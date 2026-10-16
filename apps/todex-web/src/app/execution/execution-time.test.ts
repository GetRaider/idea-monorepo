import { describe, expect, it } from "vitest";

import {
  extendGoalMinutes,
  focusSeconds,
  formatClock,
  formatDuration,
} from "./execution-time";

describe("execution time", () => {
  it("formats clocks and durations", () => {
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(3661)).toBe("1:01:01");
    expect(formatDuration(90)).toBe("1m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3900)).toBe("1h 5m");
    expect(formatDuration(null)).toBe("—");
  });

  it("counts down for a timer and up for a stopwatch", () => {
    expect(
      focusSeconds({ mode: "timer", elapsedSeconds: 60, goalMinutes: 25 }),
    ).toBe(1440);
    expect(
      focusSeconds({ mode: "stopwatch", elapsedSeconds: 60, goalMinutes: 25 }),
    ).toBe(60);
    expect(
      focusSeconds({ mode: "timer", elapsedSeconds: 2000, goalMinutes: 25 }),
    ).toBe(0);
  });

  it("adds minutes on top of the remaining goal, or past elapsed time", () => {
    expect(
      extendGoalMinutes({
        goalMinutes: 25,
        elapsedSeconds: 10 * 60,
        addMinutes: 15,
      }),
    ).toBe(40);
    expect(
      extendGoalMinutes({
        goalMinutes: 25,
        elapsedSeconds: 30 * 60,
        addMinutes: 15,
      }),
    ).toBe(45);
    expect(
      extendGoalMinutes({
        goalMinutes: 25,
        elapsedSeconds: 25 * 60 + 1,
        addMinutes: 5,
      }),
    ).toBe(31);
    expect(
      extendGoalMinutes({
        goalMinutes: 24 * 60,
        elapsedSeconds: 0,
        addMinutes: 30,
      }),
    ).toBe(24 * 60);
  });
});
