import { beforeAll, describe, expect, it, vi } from "vitest";

import { ConflictError } from "@/lib/api/errors";

const existingRow = [{ id: "word-1" }];

vi.mock("@/db/client", () => {
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(existingRow),
        }),
      }),
    },
    eq: vi.fn(() => ({})),
    and: vi.fn(() => ({})),
    desc: vi.fn(() => ({})),
    like: vi.fn(() => ({})),
    // The rest aren't needed for the duplicate-prevention test.
    asc: vi.fn(() => ({})),
    or: vi.fn(() => ({})),
    isNull: vi.fn(() => ({})),
    isNotNull: vi.fn(() => ({})),
    inArray: vi.fn(() => ({})),
    gte: vi.fn(() => ({})),
    lte: vi.fn(() => ({})),
    lt: vi.fn(() => ({})),
    gt: vi.fn(() => ({})),
  };
});

let saveWord: typeof import("./vocabulary.service").saveWord;

beforeAll(async () => {
  const mod = await import("./vocabulary.service");
  saveWord = mod.saveWord;
});

describe("vocabulary.saveWord", () => {
  it("throws ConflictError on duplicates (lemma + sourceYoutubeId)", async () => {
    await expect(
      saveWord({
        lemma: "the",
        word: "the",
        pronunciation: null,
        partOfSpeech: null,
        definition: "definition",
        translation: "[uk] the",
        exampleSentence: "context sentence",
        sourceYoutubeId: "video-1",
        sourceSentence: "context sentence",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

