"use client";

import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";
import { SubtitlePanel } from "@/components/video/SubtitlePanel";
import { DefinitionSheet } from "@/components/video/DefinitionSheet";

import type { NativeLanguage } from "@/server/services/dictionary/translation-stub";
import type {
  TranscriptCue,
  TranscriptResponse,
} from "@/server/services/youtube/youtube-transcript.service";

async function fetchSettings(): Promise<{
  nativeLanguage: NativeLanguage;
  playbackSpeedDefault: number;
}> {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error("Failed to load settings.");
  return response.json();
}

async function fetchTranscript(videoId: string): Promise<TranscriptResponse> {
  const response = await fetch(`/api/videos/${encodeURIComponent(videoId)}/transcript?lang=en`);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to load transcript.");
  }
  return response.json();
}

export function WatchPageClient({ videoId }: { videoId: string }) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<null | {
    wordDisplay: string;
    wordLemma: string;
    contextSentence: string;
    cue: TranscriptCue;
  }>(null);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const transcriptQuery = useQuery({
    queryKey: ["transcript", videoId],
    queryFn: () => fetchTranscript(videoId),
  });

  useEffect(() => {
    if (transcriptQuery.isError) {
      toast.error(
        transcriptQuery.error instanceof Error
          ? transcriptQuery.error.message
          : "Failed to load transcript.",
      );
    }
  }, [transcriptQuery.isError, transcriptQuery.error]);

  const cues = useMemo(
    () => transcriptQuery.data?.cues ?? [],
    [transcriptQuery.data],
  );

  const activeCue = useMemo(() => {
    if (!cues.length) return null;
    const ms = currentTimeMs;
    // Small buffer so the highlight doesn't flicker at boundaries.
    const bufferMs = 250;

    return (
      cues.find(
        (cue) =>
          ms >= cue.startMs && ms < cue.startMs + cue.durationMs + bufferMs,
      ) ?? null
    );
  }, [cues, currentTimeMs]);

  const nativeLanguage =
    settingsQuery.data?.nativeLanguage ?? ("uk" as NativeLanguage);

  const playbackRateDefault = settingsQuery.data?.playbackSpeedDefault ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-[var(--muted)]">
            Video learning
          </div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {transcriptQuery.data?.title ?? "Learning with captions"}
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[var(--border)] bg-white/60 px-3 py-1 text-sm font-medium text-[var(--foreground)] hover:bg-white/80"
        >
          Try another video
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          {transcriptQuery.isLoading ? (
            <Skeleton className="aspect-video w-full rounded-2xl" />
          ) : (
            <YouTubePlayer
              videoId={videoId}
              playbackRateDefault={playbackRateDefault}
              onTimeUpdateMs={setCurrentTimeMs}
            />
          )}

          <div className="text-xs leading-relaxed text-[var(--muted)]">
            Tip: click any word inside the subtitles to see a definition, then
            save it for practice.
          </div>
        </div>

        {transcriptQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : (
          <SubtitlePanel
            cues={cues}
            activeCue={activeCue}
            onCueSelect={() => {
              // Phrase selection is implicitly covered by the cue passed to word clicks.
            }}
            onWordSelect={(args) => {
              setSelectedWord(args);
              setDefinitionOpen(true);
            }}
          />
        )}
      </div>

      <DefinitionSheet
        open={definitionOpen}
        onOpenChange={(open) => {
          setDefinitionOpen(open);
          if (!open) setSelectedWord(null);
        }}
        nativeLanguage={nativeLanguage}
        videoId={videoId}
        selectedWord={selectedWord}
      />
    </div>
  );
}

