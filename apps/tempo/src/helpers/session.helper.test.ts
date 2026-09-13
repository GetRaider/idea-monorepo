import { describe, expect, it } from "vitest";

import {
  clampSessionName,
  SESSION_NAME_MAX_LENGTH,
  shouldOfferSaveAsActivity,
  validateSavedSessionName,
  validateSavedSessionReorder,
} from "./session.helper";

describe("validateSavedSessionReorder", () => {
  it("accepts a permutation of the current ids", () => {
    expect(validateSavedSessionReorder(["b", "a"], ["a", "b"])).toEqual([
      "b",
      "a",
    ]);
  });

  it("rejects a different set or duplicates", () => {
    expect(() => validateSavedSessionReorder(["a"], ["a", "b"])).toThrow(
      "Activity list is out of date",
    );
    expect(() => validateSavedSessionReorder(["a", "a"], ["a", "b"])).toThrow(
      "Activity list is out of date",
    );
    expect(() => validateSavedSessionReorder(["a", "c"], ["a", "b"])).toThrow(
      "Activity list is out of date",
    );
  });
});

describe("shouldOfferSaveAsActivity", () => {
  it("offers save for a new typed name", () => {
    expect(
      shouldOfferSaveAsActivity("Writing", null, ["Deep Work"]),
    ).toBe(true);
  });

  it("hides save when an activity is selected or the name already exists", () => {
    expect(shouldOfferSaveAsActivity("Writing", "session-1", ["Writing"])).toBe(
      false,
    );
    expect(shouldOfferSaveAsActivity("Writing", null, ["writing"])).toBe(false);
    expect(shouldOfferSaveAsActivity("   ", null, [])).toBe(false);
  });
});

describe("clampSessionName", () => {
  it("caps names at 30 characters", () => {
    const longName = "a".repeat(SESSION_NAME_MAX_LENGTH + 5);
    expect(clampSessionName(longName)).toHaveLength(SESSION_NAME_MAX_LENGTH);
    expect(() => validateSavedSessionName(longName)).toThrow(
      "Session name must be 30 characters or fewer",
    );
  });
});
