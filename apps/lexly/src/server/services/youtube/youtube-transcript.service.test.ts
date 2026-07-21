import { beforeAll, describe, expect, it, vi } from "vitest";

import { BadRequestError } from "@/lib/api/errors";

const fetchMock = vi.fn();

vi.mock("@hallelx/youtube-transcript", () => {
  class YouTubeTranscriptApiException extends Error {}

  class TranscriptsDisabled extends YouTubeTranscriptApiException {}

  class NoTranscriptFound extends YouTubeTranscriptApiException {}

  class YouTubeTranscriptApi {
    fetch = fetchMock;
  }

  return {
    YouTubeTranscriptApi,
    YouTubeTranscriptApiException,
    TranscriptsDisabled,
    NoTranscriptFound,
  };
});

vi.mock("@repo/api/helpers", () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({
      data: { title: "Demo", thumbnail_url: "https://example.com/thumb.jpg" },
      status: 200,
      headers: {},
      config: {},
    }),
  },
}));

let getYouTubeTranscript: typeof import("./youtube-transcript.service").getYouTubeTranscript;

beforeAll(async () => {
  const mod = await import("./youtube-transcript.service");
  getYouTubeTranscript = mod.getYouTubeTranscript;
});

describe("getYouTubeTranscript", () => {
  it("maps transcript snippets to cues", async () => {
    fetchMock.mockResolvedValueOnce({
      languageCode: "en",
      snippets: [
        { text: "Hello world", start: 1.2, duration: 2.5 },
        { text: "   ", start: 4, duration: 1 },
        { text: "Next line", start: 5, duration: 1.8 },
      ],
    });

    const result = await getYouTubeTranscript({
      videoId: "qz0aGYrrlhU",
      preferredLanguage: "en",
    });

    expect(result.cues).toEqual([
      { startMs: 1200, durationMs: 2500, text: "Hello world" },
      { startMs: 5000, durationMs: 1800, text: "Next line" },
    ]);
    expect(result.language).toBe("en");
  });

  it("throws BadRequestError when captions are missing", async () => {
    const { TranscriptsDisabled } = await import("@hallelx/youtube-transcript");
    fetchMock.mockRejectedValueOnce(new TranscriptsDisabled("disabled"));

    await expect(
      getYouTubeTranscript({ videoId: "qz0aGYrrlhU", preferredLanguage: "en" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
