import { describe, expect, it } from "vitest";

import {
  buildManualFocusSessionRecord,
  canStartFocusSession,
  computeActiveTimerFromWallClock,
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  resolveBreakBasisSeconds,
  resolveIdleTimerMode,
  shouldAutoCompleteActiveTimer,
  validateManualFocusRecordInput,
  validateStopwatchSessionConfig,
} from "./focus-session.helper";

import type { ActiveFocusTimer } from "@/types/focus.types";

describe("validateStopwatchSessionConfig", () => {
  it("allows missing duration when name is provided", () => {
    const result = validateStopwatchSessionConfig({
      ...DEFAULT_SESSION_CONFIG,
      name: "Deep work",
      durationMinutes: null,
    });

    expect(result.status).toBe("SUCCESS");
  });

  it("rejects missing name without linked task", () => {
    const result = validateStopwatchSessionConfig({
      ...DEFAULT_SESSION_CONFIG,
      durationMinutes: null,
    });

    expect(result.status).toBe("CONSTRAINT_VIOLATION");
  });
});

describe("canStartFocusSession", () => {
  it("allows stopwatch start without duration", () => {
    const canStart = canStartFocusSession(
      { ...DEFAULT_SESSION_CONFIG, name: "Focus block" },
      { ...DEFAULT_IDLE_DRAFT, timerMode: "stopwatch" },
    );

    expect(canStart).toBe(true);
  });

  it("defaults undefined timer mode to stopwatch", () => {
    const canStart = canStartFocusSession(
      { ...DEFAULT_SESSION_CONFIG, name: "Focus block" },
      { ...DEFAULT_IDLE_DRAFT, timerMode: undefined as never },
    );

    expect(
      resolveIdleTimerMode({
        ...DEFAULT_IDLE_DRAFT,
        timerMode: undefined as never,
      }),
    ).toBe("stopwatch");
    expect(canStart).toBe(true);
  });

  it("requires duration for timer mode", () => {
    const canStart = canStartFocusSession(
      { ...DEFAULT_SESSION_CONFIG, name: "Focus block" },
      { ...DEFAULT_IDLE_DRAFT, timerMode: "timer" },
    );

    expect(canStart).toBe(false);
  });
});

describe("computeActiveTimerFromWallClock", () => {
  it("does not auto-complete stopwatch timers at zero remaining", () => {
    const startedAt = "2026-08-21T08:00:00.000Z";
    const timer: ActiveFocusTimer = {
      sessionId: "session-1",
      sessionType: "focus",
      systemState: "running",
      timerMode: "stopwatch",
      name: "Focus",
      taskId: null,
      color: "#f97316",
      plannedDurationSeconds: 0,
      elapsedSeconds: 0,
      remainingSeconds: Number.MAX_SAFE_INTEGER,
      pausedAt: null,
      startedAt,
    };

    const nextTimer = computeActiveTimerFromWallClock(
      timer,
      new Date(startedAt).getTime() + 1000,
    );

    expect(nextTimer.elapsedSeconds).toBe(1);
    expect(shouldAutoCompleteActiveTimer(nextTimer)).toBe(false);
  });

  it("auto-completes countdown timers at zero remaining", () => {
    const startedAt = "2026-08-21T08:00:00.000Z";
    const timer: ActiveFocusTimer = {
      sessionId: "session-1",
      sessionType: "focus",
      systemState: "running",
      timerMode: "timer",
      name: "Focus",
      taskId: null,
      color: "#f97316",
      plannedDurationSeconds: 60,
      elapsedSeconds: 0,
      remainingSeconds: 60,
      pausedAt: null,
      startedAt,
    };

    const nextTimer = computeActiveTimerFromWallClock(
      timer,
      new Date(startedAt).getTime() + 60_000,
    );

    expect(nextTimer.remainingSeconds).toBe(0);
    expect(shouldAutoCompleteActiveTimer(nextTimer)).toBe(true);
  });
});

describe("resolveBreakBasisSeconds", () => {
  it("uses elapsed seconds when no planned duration exists", () => {
    const timer: ActiveFocusTimer = {
      sessionId: "session-1",
      sessionType: "focus",
      systemState: "running",
      timerMode: "stopwatch",
      name: "Focus",
      taskId: null,
      color: "#f97316",
      plannedDurationSeconds: 0,
      elapsedSeconds: 900,
      remainingSeconds: Number.MAX_SAFE_INTEGER,
      pausedAt: null,
      startedAt: "2026-08-21T08:00:00.000Z",
    };

    expect(resolveBreakBasisSeconds(timer)).toBe(900);
  });
});

describe("buildManualFocusSessionRecord", () => {
  it("creates a completed manual session", () => {
    const record = buildManualFocusSessionRecord({
      name: "Missed session",
      durationSeconds: 1800,
      startedAt: "2026-08-21T08:00:00.000Z",
    });

    expect(record.source).toBe("manual");
    expect(record.status).toBe("completed");
    expect(record.actualDurationSeconds).toBe(1800);
    expect(record.endedAt).toBe("2026-08-21T08:30:00.000Z");
  });
});

describe("validateManualFocusRecordInput", () => {
  it("rejects future datetimes", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = validateManualFocusRecordInput({
      name: "Missed session",
      durationSeconds: 1800,
      startedAt: future,
    });

    expect(result.status).toBe("CONSTRAINT_VIOLATION");
  });
});
