import { describe, expect, it } from "vitest";

import {
  UNKNOWN_ANALYTICS_COLOR_KEY,
  buildHeatmapGrid,
  formatDurationLabel,
  getAnalyticsPalette,
  getDailyFocusSeconds,
  getRecordColorKey,
} from "./analytics.helper";
import {
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

  it("counts today seconds from startedAt", () => {
    const records = [
      makeRecord({ accumulatedSeconds: 1800 }),
      makeRecord({
        id: "old",
        startedAt: localTimestamp(2026, 8, 20, 9),
        endedAt: localTimestamp(2026, 8, 20, 10),
        accumulatedSeconds: 3600,
      }),
    ];
    expect(getDailyFocusSeconds(records, new Date(2026, 7, 21, 12))).toBe(1800);
  });

  it("builds heatmap cells for local days", () => {
    const columns = buildHeatmapGrid(
      [makeRecord({ accumulatedSeconds: 3600 })],
      2,
      new Date(2026, 7, 21, 12),
    );
    const seconds = columns
      .flatMap((column) => column.days)
      .reduce((total, day) => total + day.totalSeconds, 0);
    expect(seconds).toBe(3600);
  });
});

describe("analytics session colors", () => {
  it("gives unknown records a shared color and unique colors per backlog session", () => {
    expect(
      getRecordColorKey(makeRecord({ kind: "unknown", sessionId: null })),
    ).toBe(UNKNOWN_ANALYTICS_COLOR_KEY);
    expect(
      getRecordColorKey(
        makeRecord({ kind: "backlog", sessionId: "session-1" }),
      ),
    ).toBe("session-1");
    expect(getAnalyticsPalette("session-a").hue).not.toBe(
      getAnalyticsPalette("session-b").hue,
    );
    expect(getAnalyticsPalette(UNKNOWN_ANALYTICS_COLOR_KEY)).toEqual(
      getAnalyticsPalette(UNKNOWN_ANALYTICS_COLOR_KEY),
    );
  });

  it("colors a heatmap day by the dominant session", () => {
    const columns = buildHeatmapGrid(
      [
        makeRecord({
          id: "unknown",
          kind: "unknown",
          sessionId: null,
          accumulatedSeconds: 600,
        }),
        makeRecord({
          id: "backlog",
          kind: "backlog",
          sessionId: "session-1",
          name: "Software Growth",
          accumulatedSeconds: 3600,
        }),
      ],
      2,
      new Date(2026, 7, 21, 12),
    );
    const day = columns
      .flatMap((column) => column.days)
      .find((heatmapDay) => heatmapDay.totalSeconds === 4200);
    expect(day?.colorKey).toBe("session-1");
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

describe("formatDurationLabel", () => {
  it("omits zero minutes after hours", () => {
    expect(formatDurationLabel(3600)).toBe("1h");
    expect(formatDurationLabel(90)).toBe("1m");
  });
});
