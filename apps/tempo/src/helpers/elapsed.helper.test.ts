import { describe, expect, it } from "vitest";

import {
  foldRunningSegment,
  formatClock,
  formatHmsClock,
  formatMenuBarClock,
  formatTimerClock,
  getDisplayedElapsedSeconds,
  getRemainingSeconds,
  shouldAutoStopTimer,
  shouldNotifyStopwatchGoal,
} from "./elapsed.helper";
import {
  buildLiveStartRecord,
  buildManualRecord,
  buildPausedRecord,
  buildResumedRecord,
  buildStoppedRecord,
  buildUpdatedRecord,
  parseMinutesInput,
  validateDeleteRecord,
  validateManualRecord,
  validateStartSession,
  validateUpdateRecord,
  assertSavedSessionNotInUse,
} from "./session.helper";

describe("getDisplayedElapsedSeconds", () => {
  it("uses accumulated seconds when paused or stopped", () => {
    expect(
      getDisplayedElapsedSeconds(
        {
          accumulatedSeconds: 90,
          segmentStartedAt: null,
          endedAt: null,
        },
        Date.parse("2026-08-21T10:00:00.000Z"),
      ),
    ).toBe(90);
  });

  it("adds the live segment from wall clock", () => {
    expect(
      getDisplayedElapsedSeconds(
        {
          accumulatedSeconds: 10,
          segmentStartedAt: "2026-08-21T10:00:00.000Z",
          endedAt: null,
        },
        Date.parse("2026-08-21T10:00:15.000Z"),
      ),
    ).toBe(25);
  });
});

describe("timer remaining and auto-stop", () => {
  it("clamps remaining at zero", () => {
    expect(getRemainingSeconds(70, 60)).toBe(0);
  });

  it("auto-stops timer when elapsed reaches planned", () => {
    expect(shouldAutoStopTimer(60, "timer", 60)).toBe(true);
    expect(shouldAutoStopTimer(60, "stopwatch", 60)).toBe(false);
  });

  it("notifies a stopwatch goal without treating it as a timer", () => {
    expect(shouldNotifyStopwatchGoal(60, "stopwatch", 60)).toBe(true);
    expect(shouldNotifyStopwatchGoal(59, "stopwatch", 60)).toBe(false);
    expect(shouldNotifyStopwatchGoal(60, "timer", 60)).toBe(false);
  });
});

describe("formatClock", () => {
  it("formats minutes and hours", () => {
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(3661)).toBe("1:01:01");
  });
});

describe("formatTimerClock", () => {
  it("keeps minutes past 59 instead of rolling to hours", () => {
    expect(formatTimerClock(75)).toBe("01:15");
    expect(formatTimerClock(3600)).toBe("60:00");
  });
});

describe("formatMenuBarClock", () => {
  const nowMs = Date.parse("2026-08-21T10:01:15.000Z");

  it("is empty when idle", () => {
    expect(formatMenuBarClock(null, nowMs)).toBe("");
  });

  it("shows compact elapsed time for a running stopwatch", () => {
    expect(
      formatMenuBarClock(
        {
          accumulatedSeconds: 10,
          segmentStartedAt: "2026-08-21T10:00:00.000Z",
          endedAt: null,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        nowMs,
      ),
    ).toBe("01:25");
  });

  it("shows remaining time for a running timer", () => {
    expect(
      formatMenuBarClock(
        {
          accumulatedSeconds: 0,
          segmentStartedAt: "2026-08-21T10:00:00.000Z",
          endedAt: null,
          mode: "timer",
          plannedSeconds: 600,
        },
        nowMs,
      ),
    ).toBe("08:45");
  });

  it("can force elapsed for a running timer", () => {
    expect(
      formatMenuBarClock(
        {
          accumulatedSeconds: 0,
          segmentStartedAt: "2026-08-21T10:00:00.000Z",
          endedAt: null,
          mode: "timer",
          plannedSeconds: 600,
        },
        nowMs,
        "elapsed",
      ),
    ).toBe("01:15");
  });

  it("wraps paused time in parentheses", () => {
    expect(
      formatMenuBarClock(
        {
          accumulatedSeconds: 90,
          segmentStartedAt: null,
          endedAt: null,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        nowMs,
      ),
    ).toBe("(01:30)");
  });
});

describe("formatHmsClock", () => {
  it("always pads hours", () => {
    expect(formatHmsClock(75)).toBe("00:01:15");
    expect(formatHmsClock(3661)).toBe("01:01:01");
  });
});

describe("session helpers", () => {
  const startedAt = "2026-08-21T10:00:00.000Z";
  const nowMs = Date.parse("2026-08-21T10:01:00.000Z");

  it("requires a name and timer duration to start", () => {
    expect(() =>
      validateStartSession(
        {
          name: "",
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        false,
      ),
    ).toThrow("Name is required");
    expect(() =>
      validateStartSession(
        {
          name: "Work",
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
          mode: "timer",
          plannedSeconds: null,
        },
        false,
      ),
    ).toThrow("Duration is required for timer");
    expect(() =>
      validateStartSession(
        {
          name: "Work",
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        true,
      ),
    ).toThrow("A session is already running");
    expect(() =>
      validateStartSession(
        {
          name: "",
          kind: "backlog",
          sessionId: null,
          saveToBacklog: false,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        false,
      ),
    ).toThrow("Select a backlog session");
  });

  it("pauses by folding the live segment", () => {
    const liveRecord = buildLiveStartRecord(
      {
        name: "Work",
        kind: "unknown",
        sessionId: null,
        saveToBacklog: false,
        mode: "stopwatch",
        plannedSeconds: null,
      },
      "record-1",
      startedAt,
      null,
    );
    const pausedRecord = buildPausedRecord(liveRecord, nowMs);
    expect(pausedRecord.accumulatedSeconds).toBe(60);
    expect(pausedRecord.segmentStartedAt).toBeNull();
    expect(foldRunningSegment(pausedRecord, nowMs).accumulatedSeconds).toBe(60);
  });

  it("resumes and stops using wall clock", () => {
    const liveRecord = buildLiveStartRecord(
      {
        name: "Work",
        kind: "unknown",
        sessionId: null,
        saveToBacklog: false,
        mode: "timer",
        plannedSeconds: 1500,
      },
      "record-1",
      startedAt,
      null,
    );
    const pausedRecord = buildPausedRecord(liveRecord, nowMs);
    const resumedRecord = buildResumedRecord(
      pausedRecord,
      "2026-08-21T10:02:00.000Z",
    );
    const stoppedRecord = buildStoppedRecord(
      resumedRecord,
      Date.parse("2026-08-21T10:02:10.000Z"),
    );
    expect(stoppedRecord.endedAt).toBe("2026-08-21T10:02:10.000Z");
    expect(stoppedRecord.accumulatedSeconds).toBe(70);
    expect(stoppedRecord.segmentStartedAt).toBeNull();
  });

  it("rejects future manual records", () => {
    expect(() =>
      validateManualRecord(
        {
          name: "Catch up",
          durationSeconds: 60,
          startedAt: "2026-08-21T12:00:00.000Z",
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
        },
        nowMs,
      ),
    ).toThrow("Date and time cannot be in the future");
  });

  it("builds a completed manual record", () => {
    const record = buildManualRecord(
      {
        name: "Catch up",
        durationSeconds: 120,
        startedAt: "2026-08-21T09:00:00.000Z",
        kind: "unknown",
        sessionId: null,
        saveToBacklog: false,
      },
      "manual-1",
      null,
    );
    expect(record.source).toBe("manual");
    expect(record.endedAt).toBe("2026-08-21T09:02:00.000Z");
    expect(record.accumulatedSeconds).toBe(120);
  });

  it("builds a backlog manual record from a saved session", () => {
    const record = buildManualRecord(
      {
        name: "ignored",
        durationSeconds: 1800,
        startedAt: "2026-08-21T09:00:00.000Z",
        kind: "backlog",
        sessionId: "session-1",
        saveToBacklog: false,
      },
      "manual-2",
      {
        id: "session-1",
        name: "Software Growth",
        color: "#3b82f6",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    );
    expect(record.kind).toBe("backlog");
    expect(record.sessionId).toBe("session-1");
    expect(record.name).toBe("Software Growth");
    expect(record.source).toBe("manual");
  });

  it("updates a completed record name and duration", () => {
    const stoppedRecord = buildStoppedRecord(
      buildLiveStartRecord(
        {
          name: "Work",
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
          mode: "stopwatch",
          plannedSeconds: null,
        },
        "record-1",
        startedAt,
        null,
      ),
      nowMs,
    );
    expect(() =>
      validateUpdateRecord(
        stoppedRecord,
        {
          id: stoppedRecord.id,
          name: "",
          durationSeconds: 120,
          startedAt,
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
        },
        nowMs,
      ),
    ).toThrow("Name is required");
    const updated = buildUpdatedRecord(
      stoppedRecord,
      {
        id: stoppedRecord.id,
        name: "Deep work",
        durationSeconds: 120,
        startedAt: "2026-08-21T09:00:00.000Z",
        kind: "unknown",
        sessionId: null,
        saveToBacklog: false,
      },
      null,
    );
    expect(updated.name).toBe("Deep work");
    expect(updated.accumulatedSeconds).toBe(120);
    expect(updated.endedAt).toBe("2026-08-21T09:02:00.000Z");
    const backlogUpdated = buildUpdatedRecord(
      stoppedRecord,
      {
        id: stoppedRecord.id,
        name: "ignored",
        durationSeconds: 1800,
        startedAt: "2026-08-21T09:00:00.000Z",
        kind: "backlog",
        sessionId: "session-1",
        saveToBacklog: false,
      },
      {
        id: "session-1",
        name: "Software Growth",
        color: "#3b82f6",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    );
    expect(backlogUpdated.kind).toBe("backlog");
    expect(backlogUpdated.sessionId).toBe("session-1");
    expect(backlogUpdated.name).toBe("Software Growth");
    expect(() =>
      validateDeleteRecord({ ...stoppedRecord, endedAt: null }),
    ).toThrow("Cannot delete an active session");
  });

  it("blocks editing or deleting a running backlog session", () => {
    expect(() =>
      assertSavedSessionNotInUse("session-1", "session-1", "delete"),
    ).toThrow("Cannot delete a session that is running");
    expect(() =>
      assertSavedSessionNotInUse("session-1", "session-1", "edit"),
    ).toThrow("Cannot edit a session that is running");
    expect(() =>
      assertSavedSessionNotInUse("session-1", null, "delete"),
    ).not.toThrow();
  });

  it("parses minute inputs", () => {
    expect(parseMinutesInput("25m")).toBe(25);
    expect(parseMinutesInput("")).toBeNull();
  });
});
