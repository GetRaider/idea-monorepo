import { describe, expect, it } from "vitest";

import {
  translationStub,
  type NativeLanguage,
} from "./translation-stub";

describe("translationStub", () => {
  it("falls back to [lang] format", () => {
    const nativeLanguage: NativeLanguage = "uk";
    expect(
      translationStub({ word: "someUnmappedLemma", nativeLanguage }),
    ).toBe("[uk] someUnmappedLemma");
  });

  it("returns known mappings for common words", () => {
    expect(translationStub({ word: "and", nativeLanguage: "uk" })).toBe(
      "і",
    );
  });
});

