import { describe, expect, it } from "vitest";

import { formatEstimation, parseEstimation } from "@repo/api/todex";

describe("parseEstimation", () => {
  it("parses hours and minutes", () => {
    expect(parseEstimation("1h")).toBe(60);
    expect(parseEstimation("30m")).toBe(30);
    expect(parseEstimation("1.5h")).toBe(90);
  });

  it("parses days and mixed phrases", () => {
    expect(parseEstimation("2d")).toBe(2880);
    expect(parseEstimation("2 days")).toBe(2880);
    expect(parseEstimation("5 days and 5 hours")).toBe(7500);
    expect(parseEstimation("5d 5h")).toBe(7500);
  });

  it("returns null for empty, junk, or a bare number", () => {
    expect(parseEstimation("")).toBe(null);
    expect(parseEstimation("   ")).toBe(null);
    expect(parseEstimation("foo")).toBe(null);
    expect(parseEstimation("90")).toBe(null);
  });
});

describe("formatEstimation", () => {
  it("formats canonical parts", () => {
    expect(formatEstimation(90)).toBe("1h 30m");
    expect(formatEstimation(1440)).toBe("1d");
    expect(formatEstimation(7500)).toBe("5d 5h");
    expect(formatEstimation(null)).toBe("");
  });
});
