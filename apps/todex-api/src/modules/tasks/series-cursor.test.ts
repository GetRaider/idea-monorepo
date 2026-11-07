import { describe, expect, it } from "vitest";

import { assertScheduleSlots } from "./task-slots";
import { satisfiedPrefix, unsatisfiedDue } from "./series-cursor";

describe("assertScheduleSlots", () => {
  it("rejects an eleventh slot, a short slot, and a duplicate range", () => {
    const slot = (index: number) => ({
      startAt: new Date(Date.UTC(2026, 0, index + 1, 9)).toISOString(),
      endAt: new Date(Date.UTC(2026, 0, index + 1, 10)).toISOString(),
    });
    expect(() => assertScheduleSlots(Array.from({ length: 11 }, (_, index) => slot(index)))).toThrow(
      /10 schedule slots/,
    );
    expect(() =>
      assertScheduleSlots([
        {
          startAt: "2026-01-01T09:00:00.000Z",
          endAt: "2026-01-01T09:10:00.000Z",
        },
      ]),
    ).toThrow(/15 minutes/);
    expect(() =>
      assertScheduleSlots([
        {
          startAt: "2026-01-01T09:00:00.000Z",
          endAt: "2026-01-01T10:00:00.000Z",
        },
        {
          startAt: "2026-01-01T09:00:00.000Z",
          endAt: "2026-01-01T10:00:00.000Z",
        },
      ]),
    ).toThrow(/Duplicate/);
  });
});

describe("series cursor", () => {
  const candidates = [
    { localKey: "a", anchor: new Date("2026-01-01T00:00:00.000Z") },
    { localKey: "b", anchor: new Date("2026-01-02T00:00:00.000Z") },
    { localKey: "c", anchor: new Date("2026-01-03T00:00:00.000Z") },
  ];

  it("does not move generated_through past a hole", () => {
    const satisfied = new Set(["a", "c"]);
    expect(
      satisfiedPrefix(candidates, (candidate) => satisfied.has(candidate.localKey)),
    ).toBe("a");
    expect(
      unsatisfiedDue(
        candidates,
        (candidate) => satisfied.has(candidate.localKey),
        30,
      ).map((candidate) => candidate.localKey),
    ).toEqual(["b"]);
  });
});
