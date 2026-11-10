import { describe, expect, it } from "vitest";

import {
  chipSpanMinutes,
  formatChipRange,
  formatSliceRange,
  sessionDisplayTitle,
  splitIntervalAtLocalMidnight,
  unionDurationSeconds,
} from "./calendar-actual";

describe("session display", () => {
  it("falls back to the first task and a count", () => {
    expect(
      sessionDisplayTitle({
        title: "  ",
        tasks: [{ summary: "Write" }, { summary: "Review" }, { summary: "Ship" }],
      }),
    ).toBe("Write +2 tasks");
    expect(
      sessionDisplayTitle({ title: "Focus", tasks: [{ summary: "Write" }] }),
    ).toBe("Focus");
  });

  it("counts overlapping history once", () => {
    expect(
      unionDurationSeconds(
        [
          {
            startedAt: "2026-10-07T10:00:00.000Z",
            endedAt: "2026-10-07T10:20:00.000Z",
          },
          {
            startedAt: "2026-10-07T10:10:00.000Z",
            endedAt: "2026-10-07T10:30:00.000Z",
          },
        ],
        new Date("2026-10-07T12:00:00.000Z"),
      ),
    ).toBe(30 * 60);
  });

  it("ends an open interval at now", () => {
    expect(
      unionDurationSeconds(
        [{ startedAt: "2026-10-07T10:00:00.000Z", endedAt: null }],
        new Date("2026-10-07T10:10:00.000Z"),
      ),
    ).toBe(10 * 60);
  });

  it("splits a range at local midnight", () => {
    const pieces = splitIntervalAtLocalMidnight(
      {
        startedAt: "2026-10-07T22:30:00.000Z",
        endedAt: "2026-10-08T01:00:00.000Z",
      },
      "UTC",
      new Date("2026-10-08T12:00:00.000Z"),
    );
    expect(pieces).toHaveLength(2);
    expect(formatSliceRange(pieces[0]!.start, pieces[0]!.end)).toContain("–");
  });

  it("derives the chip duration from the printed minutes", () => {
    const start = new Date(2026, 10, 10, 15, 43, 50);
    const end = new Date(2026, 10, 10, 17, 22, 10);
    expect(chipSpanMinutes(start, end)).toBe(99);
    expect(formatChipRange(start, end)).toBe("15:43–17:22 • 1h 39m");
  });
});
