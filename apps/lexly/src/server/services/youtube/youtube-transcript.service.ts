import {
  NoTranscriptFound,
  TranscriptsDisabled,
  YouTubeTranscriptApi,
  YouTubeTranscriptApiException,
} from "@hallelx/youtube-transcript";
import { httpClient } from "@repo/api/helpers";

import { db, eq } from "@/db/client";
import { videosTable } from "@/db/schema";
import { BadRequestError } from "@/lib/api/errors";

export type TranscriptCue = {
  startMs: number;
  durationMs: number;
  text: string;
};

export type TranscriptResponse = {
  videoId: string;
  title: string | null;
  thumbnailUrl: string | null;
  language: string;
  cues: TranscriptCue[];
};

const youtubeTranscriptApi = new YouTubeTranscriptApi();

function mapTranscriptToCues(
  snippets: Array<{ text: string; start: number; duration: number }>,
): TranscriptCue[] {
  return snippets
    .map((snippet) => ({
      startMs: Math.round(snippet.start * 1000),
      durationMs: Math.max(0, Math.round(snippet.duration * 1000)),
      text: snippet.text.trim(),
    }))
    .filter((cue) => cue.text.length > 0);
}

function toTranscriptError(error: unknown): BadRequestError {
  if (error instanceof TranscriptsDisabled) {
    return new BadRequestError(
      "Captions are disabled for this video. Try another video with subtitles enabled.",
    );
  }

  if (error instanceof NoTranscriptFound) {
    return new BadRequestError(
      "No captions found in the requested language. Try a different video or enable English captions.",
    );
  }

  if (error instanceof YouTubeTranscriptApiException) {
    return new BadRequestError(
      "Could not load captions for this video. Try another video with English captions.",
    );
  }

  if (error instanceof Error) {
    return new BadRequestError(error.message);
  }

  return new BadRequestError("Failed to load captions for this video.");
}

export async function getYouTubeTranscript({
  videoId,
  preferredLanguage = "en",
}: {
  videoId: string;
  preferredLanguage?: string;
}): Promise<TranscriptResponse> {
  const cleanedVideoId = videoId.trim();
  if (!cleanedVideoId) throw new BadRequestError("Missing video id.");

  let transcriptLanguage = preferredLanguage;

  let cues: TranscriptCue[];
  try {
    const transcript = await youtubeTranscriptApi.fetch(cleanedVideoId, {
      languages: [preferredLanguage, "en"],
    });

    transcriptLanguage = transcript.languageCode ?? preferredLanguage;
    cues = mapTranscriptToCues(transcript.snippets);
  } catch (error) {
    throw toTranscriptError(error);
  }

  if (cues.length === 0) {
    throw new BadRequestError(
      "No captions found for this video. Try a different video (or one with English captions).",
    );
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${cleanedVideoId}`,
  )}&format=json`;

  let title: string | null = null;
  let thumbnailUrl: string | null = null;
  try {
    const response = await httpClient.get<{
      title?: string;
      thumbnail_url?: string;
    }>({ url: oembedUrl, headers: { Accept: "application/json" } });

    title = response.data.title ?? null;
    thumbnailUrl = response.data.thumbnail_url ?? null;
  } catch {
    // best-effort; proceed without metadata
  }

  try {
    const existing = await db
      .select()
      .from(videosTable)
      .where(eq(videosTable.youtubeId, cleanedVideoId));

    if (existing[0]) {
      await db
        .update(videosTable)
        .set({
          title: title ?? existing[0].title,
          thumbnailUrl: thumbnailUrl ?? existing[0].thumbnailUrl,
          language: transcriptLanguage,
          lastFetchedAt: new Date(),
        })
        .where(eq(videosTable.youtubeId, cleanedVideoId));
    } else {
      await db.insert(videosTable).values({
        youtubeId: cleanedVideoId,
        title: title ?? cleanedVideoId,
        thumbnailUrl: thumbnailUrl ?? "",
        language: transcriptLanguage,
        lastFetchedAt: new Date(),
      });
    }
  } catch {
    // Ignore DB upsert failures for now.
  }

  return {
    videoId: cleanedVideoId,
    title,
    thumbnailUrl,
    language: transcriptLanguage,
    cues,
  };
}
