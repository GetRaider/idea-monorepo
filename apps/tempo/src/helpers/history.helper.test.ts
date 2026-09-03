import { describe, expect, it } from "vitest";

import {
  buildActivityFilterOptions,
  buildBacklogFilterOptions,
  buildManualSessionOptions,
  buildHistoryEntries,
  filterRecordsByBacklogSession,
  filterRecordsByStartedAtRange,
} from "./history.helper";
import type { FocusRecord, SavedSession } from "../shared/records.types";

function localTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function makeRecord(overrides: Partial<FocusRecord>): FocusRecord {
  return {
    id: "record-1",
    name: "Work #1",
    startedAt: localTimestamp(2026, 8, 21, 9),
    endedAt: localTimestamp(2026, 8, 21, 10),
    accumulatedSeconds: 3600,
    segmentStartedAt: null,
    plannedSeconds: null,
    mode: "stopwatch",
    source: "live",
    kind: "unknown",
    sessionId: null,
    scope: null,
    recordRole: "focus",
    ...overrides,
  };
}

describe("history labels", () => {
  it("shows the event name and duration without Unknown", () => {
    const entries = buildHistoryEntries([
      makeRecord({ name: "Work #2131232", accumulatedSeconds: 3600 }),
    ]);
    expect(entries[0]?.title).toBe("Work #2131232 (1h)");
  });

  it("lists each backlog record instead of grouping", () => {
    const entries = buildHistoryEntries([
      makeRecord({
        id: "a",
        name: "Software Growth",
        kind: "backlog",
        sessionId: "session-1",
        accumulatedSeconds: 5400,
        startedAt: localTimestamp(2026, 8, 21, 8),
        endedAt: localTimestamp(2026, 8, 21, 9, 30),
      }),
      makeRecord({
        id: "b",
        name: "Software Growth",
        kind: "backlog",
        sessionId: "session-1",
        accumulatedSeconds: 1800,
        startedAt: localTimestamp(2026, 8, 21, 10),
        endedAt: localTimestamp(2026, 8, 21, 10, 30),
      }),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.title)).toEqual([
      "Software Growth (30m)",
      "Software Growth (1h 30m)",
    ]);
  });
});

describe("analytics filter", () => {
  const sessions: SavedSession[] = [
    {
      id: "session-1",
      name: "Software Growth",
      color: "#3b82f6",
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ];

  it("only lists backlog sessions as filter options", () => {
    const options = buildBacklogFilterOptions(sessions);
    expect(options.map((option) => option.label)).toEqual([
      "All sessions",
      "Software Growth",
    ]);
  });

  it("labels the analytics activity filter as All activities", () => {
    const options = buildActivityFilterOptions(sessions);
    expect(options.map((option) => option.label)).toEqual([
      "All activities",
      "Software Growth",
    ]);
  });

  it("lists custom name first for manual record session picker", () => {
    const options = buildManualSessionOptions(sessions);
    expect(options.map((option) => option.label)).toEqual([
      "Custom name",
      "Software Growth",
    ]);
  });

  it("keeps unknown records in the unfiltered set", () => {
    const records = [
      makeRecord({ id: "unknown-1", kind: "unknown" }),
      makeRecord({
        id: "backlog-1",
        kind: "backlog",
        sessionId: "session-1",
        name: "Software Growth",
      }),
    ];
    expect(filterRecordsByBacklogSession(records, null)).toHaveLength(2);
    expect(filterRecordsByBacklogSession(records, "session-1")).toEqual([
      records[1],
    ]);
  });
});

describe("history date filter", () => {
  it("keeps records inside the startedAt range", () => {
    const records = [
      makeRecord({
        id: "morning",
        startedAt: localTimestamp(2026, 8, 21, 9),
        endedAt: localTimestamp(2026, 8, 21, 10),
      }),
      makeRecord({
        id: "evening",
        startedAt: localTimestamp(2026, 8, 21, 18),
        endedAt: localTimestamp(2026, 8, 21, 19),
      }),
    ];
    const filtered = filterRecordsByStartedAtRange(
      records,
      Date.parse(localTimestamp(2026, 8, 21, 8)),
      Date.parse(localTimestamp(2026, 8, 21, 12)),
    );
    expect(filtered.map((record) => record.id)).toEqual(["morning"]);
  });
});

