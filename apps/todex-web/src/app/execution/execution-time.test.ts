import { describe, expect, it } from "vitest";

import {
  executionWorkPhase,
  extendGoalMinutes,
  focusSeconds,
  formatClock,
  formatDuration,
  formatSessionClock,
  queuedStartIds,
  remainingWorkSeconds,
  selectedSessionTaskId,
  sessionClockSeconds,
  sessionCompletion,
  sessionElapsedSeconds,
  sessionRingProgress,
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

  it("formats the session clock and sums interval elapsed time", () => {
    expect(formatSessionClock(0)).toBe("00:00:00");
    expect(formatSessionClock(42 * 60 + 18)).toBe("00:42:18");
    expect(formatSessionClock(3661)).toBe("01:01:01");
    const now = new Date("2026-11-18T12:10:00.000Z");
    expect(
      sessionElapsedSeconds(
        [
          {
            intervals: [
              {
                startedAt: "2026-11-18T12:00:00.000Z",
                endedAt: "2026-11-18T12:05:00.000Z",
              },
            ],
          },
          {
            intervals: [
              { startedAt: "2026-11-18T12:05:00.000Z", endedAt: null },
            ],
          },
        ],
        now,
      ),
    ).toBe(600);
  });

  it("counts simultaneous task intervals only once in the session timer", () => {
    const now = new Date("2026-11-18T12:30:00.000Z");
    const tasks = [
      {
        intervals: [
          { startedAt: "2026-11-18T12:00:00.000Z", endedAt: "2026-11-18T12:10:00.000Z" },
          { startedAt: "2026-11-18T12:15:00.000Z", endedAt: null },
        ],
      },
      {
        intervals: [
          { startedAt: "2026-11-18T12:00:00.000Z", endedAt: "2026-11-18T12:20:00.000Z" },
          { startedAt: "2026-11-18T12:25:00.000Z", endedAt: null },
        ],
      },
    ];
    // 20 minutes in the first window, then 15 more minutes through 12:30,
    // with five minutes of overlap and a five-minute gap in the middle.
    expect(sessionElapsedSeconds(tasks, now)).toBe(35 * 60);
  });

  it("keeps an implicit queue selection and derives work phase", () => {
    expect(queuedStartIds(["a", "b", "c"], [], false)).toEqual(["a", "b", "c"]);
    expect(queuedStartIds(["a", "b", "c"], ["c", "a"], true)).toEqual([
      "a",
      "c",
    ]);
    expect(queuedStartIds(["a", "b"], [], true)).toEqual([]);
    expect(executionWorkPhase("done", "a", "b")).toBe("completed");
    expect(executionWorkPhase("cancelled", "a", "a")).toBe("completed");
    expect(executionWorkPhase("todo", "a", "a")).toBe("in_progress");
    expect(executionWorkPhase("todo", "b", "a")).toBe("pending");
    expect(sessionCompletion([{ status: "done" }, { status: "todo" }])).toEqual(
      {
        completed: 1,
        total: 2,
        ratio: 0.5,
      },
    );
    expect(
      selectedSessionTaskId({
        sessionId: "session",
        queryTaskId: "b",
        storedSessionId: "session",
        storedTaskId: "a",
        taskIds: ["a", "b"],
      }),
    ).toBe("b");
    expect(
      selectedSessionTaskId({
        sessionId: "session",
        queryTaskId: null,
        storedSessionId: "session",
        storedTaskId: "a",
        taskIds: ["a", "b"],
      }),
    ).toBe("a");
  });

  it("counts a timer down from the goal and a stopwatch up", () => {
    expect(
      sessionClockSeconds({
        mode: "timer",
        elapsedSeconds: 90,
        goalMinutes: 25,
      }),
    ).toBe(25 * 60 - 90);
    expect(
      sessionClockSeconds({
        mode: "stopwatch",
        elapsedSeconds: 90,
        goalMinutes: 25,
      }),
    ).toBe(90);
    expect(
      sessionClockSeconds({
        mode: "timer",
        elapsedSeconds: 40 * 60,
        goalMinutes: 25,
      }),
    ).toBe(0);
    expect(
      sessionRingProgress({
        mode: "timer",
        elapsedSeconds: 15 * 60,
        goalMinutes: 30,
      }),
    ).toBe(0.5);
    expect(
      sessionRingProgress({
        mode: "stopwatch",
        elapsedSeconds: 15 * 60,
        goalMinutes: 30,
      }),
    ).toBe(0.5);
  });

  it("counts remaining time from the timer goal, not task estimates", () => {
    expect(
      remainingWorkSeconds({
        mode: "timer",
        goalMinutes: 150,
        elapsedSeconds: 42 * 60,
        incompleteEstimateMinutes: 75,
      }),
    ).toBe(108 * 60);
    expect(
      remainingWorkSeconds({
        mode: "stopwatch",
        goalMinutes: 150,
        elapsedSeconds: 42 * 60,
        incompleteEstimateMinutes: 75,
      }),
    ).toBe(75 * 60);
    expect(
      remainingWorkSeconds({
        mode: "timer",
        goalMinutes: null,
        elapsedSeconds: 42 * 60,
        incompleteEstimateMinutes: 75,
      }),
    ).toBe(75 * 60);
    expect(
      remainingWorkSeconds({
        mode: "timer",
        goalMinutes: 25,
        elapsedSeconds: 40 * 60,
        incompleteEstimateMinutes: 10,
      }),
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
