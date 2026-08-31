import { describe, expect, it } from "vitest";

import { formatTaskKey, hasParentCycle } from "./parent-cycle.helper";

describe("hasParentCycle", () => {
  it("allows detaching", () => {
    expect(hasParentCycle("a", null, new Map())).toBe(false);
  });

  it("rejects self parent", () => {
    expect(hasParentCycle("a", "a", new Map())).toBe(true);
  });

  it("rejects ancestor loops", () => {
    const parentById = new Map<string, string | null>([
      ["b", "a"],
      ["c", "b"],
    ]);
    expect(hasParentCycle("a", "c", parentById)).toBe(true);
  });

  it("allows attaching under an unrelated task", () => {
    const parentById = new Map<string, string | null>([
      ["b", null],
      ["c", "b"],
    ]);
    expect(hasParentCycle("a", "c", parentById)).toBe(false);
  });
});

describe("formatTaskKey", () => {
  it("uses workspace sequence", () => {
    expect(formatTaskKey(1)).toBe("T-1");
    expect(formatTaskKey(12)).toBe("T-12");
  });
});
