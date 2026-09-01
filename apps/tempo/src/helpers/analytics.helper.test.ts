import { describe, expect, it } from "vitest";

import {
  NO_ACTIVITY_COLOR_KEY,
  buildAnalyticsMetrics,
  buildTimeByActivity,
  buildTimeByDay,
  formatDurationLabel,
  getAnalyticsDataset,
  getAnalyticsPalette,
  getRecordColorKey,
  parseDateInputValue,
  resolveAnalyticsPeriod,
} from "./analytics.helper";
import type { FocusRecord, SavedSession } from "../shared/records.types";

const WEEK_REFERENCE = new Date(2026, 7, 21, 12);

function localTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function makeRecord(overrides: Partial<FocusRecord> = {}): FocusRecord {
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
    ...overrides,
  };
}

describe("resolveAnalyticsPeriod", () => {
  it("uses one calendar day and hourly buckets for today", () => {
    const period = resolveAnalyticsPeriod("today", WEEK_REFERENCE);
    expect(period?.calendarDayCount).toBe(1);
    expect(period?.bucketKind).toBe("hour");
    expect(period?.start).toEqual(new Date(2026, 7, 21, 0, 0, 0, 0));
  });

  it("uses seven calendar days starting Monday for week", () => {
    const period = resolveAnalyticsPeriod("week", WEEK_REFERENCE);
    expect(period?.calendarDayCount).toBe(7);
    expect(period?.bucketKind).toBe("day");
    expect(period?.start).toEqual(new Date(2026, 7, 17, 0, 0, 0, 0));
    expect(period?.end.getDay()).toBe(0);
  });

  it("uses the full calendar month including future days", () => {
    const period = resolveAnalyticsPeriod("month", WEEK_REFERENCE);
    expect(period?.calendarDayCount).toBe(31);
    expect(period?.bucketKind).toBe("day");
    expect(period?.start).toEqual(new Date(2026, 7, 1));
    expect(period?.end.getDate()).toBe(31);
  });

  it("returns null for incomplete or inverted custom ranges", () => {
    expect(resolveAnalyticsPeriod("custom", WEEK_REFERENCE, null)).toBeNull();
    expect(
      resolveAnalyticsPeriod("custom", WEEK_REFERENCE, {
        startDate: "2026-08-21",
        endDate: "",
      }),
    ).toBeNull();
    expect(
      resolveAnalyticsPeriod("custom", WEEK_REFERENCE, {
        startDate: "2026-08-22",
        endDate: "2026-08-21",
      }),
    ).toBeNull();
  });

  it("picks hour, day, or week buckets from custom span", () => {
    expect(
      resolveAnalyticsPeriod("custom", WEEK_REFERENCE, {
        startDate: "2026-08-21",
        endDate: "2026-08-21",
      })?.bucketKind,
    ).toBe("hour");
    expect(
      resolveAnalyticsPeriod("custom", WEEK_REFERENCE, {
        startDate: "2026-08-01",
        endDate: "2026-08-21",
      })?.bucketKind,
    ).toBe("day");
    expect(
      resolveAnalyticsPeriod("custom", WEEK_REFERENCE, {
        startDate: "2026-07-01",
        endDate: "2026-08-21",
      })?.bucketKind,
    ).toBe("week");
  });
});

describe("parseDateInputValue", () => {
  it("rejects empty and impossible dates", () => {
    expect(parseDateInputValue("")).toBeNull();
    expect(parseDateInputValue("2026-02-31")).toBeNull();
  });
});

describe("getAnalyticsDataset", () => {
  const records = [
    makeRecord({ id: "open", endedAt: null }),
    makeRecord({
      id: "outside",
      startedAt: localTimestamp(2026, 8, 10, 9),
      endedAt: localTimestamp(2026, 8, 10, 10),
    }),
    makeRecord({
      id: "untagged",
      startedAt: localTimestamp(2026, 8, 21, 9),
      endedAt: localTimestamp(2026, 8, 21, 10),
    }),
    makeRecord({
      id: "tagged",
      kind: "backlog",
      sessionId: "session-1",
      name: "Software Growth",
      startedAt: localTimestamp(2026, 8, 21, 11),
      endedAt: localTimestamp(2026, 8, 21, 12),
    }),
  ];

  it("drops incomplete records and dates outside the period", () => {
    const period = resolveAnalyticsPeriod("today", WEEK_REFERENCE);
    const dataset = getAnalyticsDataset(records, period, null);
    expect(dataset.map((record) => record.id)).toEqual(["untagged", "tagged"]);
  });

  it("intersects the period with the activity filter", () => {
    const period = resolveAnalyticsPeriod("today", WEEK_REFERENCE);
    const dataset = getAnalyticsDataset(records, period, "session-1");
    expect(dataset.map((record) => record.id)).toEqual(["tagged"]);
  });

  it("returns an empty set when the period is missing", () => {
    expect(getAnalyticsDataset(records, null, null)).toEqual([]);
  });
});

describe("buildAnalyticsMetrics", () => {
  it("divides daily average by calendar days, not active days", () => {
    const records = [
      makeRecord({
        id: "mon",
        startedAt: localTimestamp(2026, 8, 17, 9),
        endedAt: localTimestamp(2026, 8, 17, 10),
        accumulatedSeconds: 3600,
      }),
      makeRecord({
        id: "tue",
        startedAt: localTimestamp(2026, 8, 18, 9),
        endedAt: localTimestamp(2026, 8, 18, 10),
        accumulatedSeconds: 3600,
      }),
      makeRecord({
        id: "wed",
        startedAt: localTimestamp(2026, 8, 19, 9),
        endedAt: localTimestamp(2026, 8, 19, 10),
        accumulatedSeconds: 3600,
      }),
      makeRecord({
        id: "thu",
        startedAt: localTimestamp(2026, 8, 20, 9),
        endedAt: localTimestamp(2026, 8, 20, 10),
        accumulatedSeconds: 3600,
      }),
      makeRecord({
        id: "fri",
        startedAt: localTimestamp(2026, 8, 21, 9),
        endedAt: localTimestamp(2026, 8, 21, 10),
        accumulatedSeconds: 7200,
      }),
    ];
    const metrics = buildAnalyticsMetrics(records, 7);
    expect(metrics.sessionCount).toBe(5);
    expect(metrics.totalSeconds).toBe(21600);
    expect(metrics.dailyAverageSeconds).toBe(21600 / 7);
    expect(metrics.averageSessionSeconds).toBe(21600 / 5);
    expect(metrics.longestSessionSeconds).toBe(7200);
    expect(metrics.activeDayCount).toBe(5);
    expect(metrics.calendarDayCount).toBe(7);
  });

  it("returns zeros for an empty range", () => {
    expect(buildAnalyticsMetrics([], 7)).toEqual({
      totalSeconds: 0,
      sessionCount: 0,
      dailyAverageSeconds: 0,
      averageSessionSeconds: 0,
      longestSessionSeconds: 0,
      activeDayCount: 0,
      calendarDayCount: 7,
    });
  });
});

describe("buildTimeByDay", () => {
  it("puts today's time into the start hour", () => {
    const period = resolveAnalyticsPeriod("today", WEEK_REFERENCE);
    if (period === null) {
      throw new Error("expected today period");
    }
    const buckets = buildTimeByDay(
      [makeRecord({ accumulatedSeconds: 1800 })],
      period,
    );
    expect(buckets).toHaveLength(24);
    expect(buckets[9]?.label).toBe("09:00");
    expect(buckets[9]?.totalSeconds).toBe(1800);
  });

  it("labels a week with weekday names", () => {
    const period = resolveAnalyticsPeriod("week", WEEK_REFERENCE);
    if (period === null) {
      throw new Error("expected week period");
    }
    const buckets = buildTimeByDay(
      [
        makeRecord({
          startedAt: localTimestamp(2026, 8, 17, 9),
          endedAt: localTimestamp(2026, 8, 17, 10),
          accumulatedSeconds: 3600,
        }),
      ],
      period,
    );
    expect(buckets.map((bucket) => bucket.label)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(buckets[0]?.totalSeconds).toBe(3600);
  });
});

describe("buildTimeByActivity", () => {
  const sessions: SavedSession[] = [
    {
      id: "session-1",
      name: "Software Growth",
      color: "#3b82f6",
      createdAt: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "session-2",
      name: "Work",
      color: "#22c55e",
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ];

  it("orders named activities by duration and keeps No Activity last", () => {
    const items = buildTimeByActivity(
      [
        makeRecord({
          id: "none",
          accumulatedSeconds: 7200,
        }),
        makeRecord({
          id: "growth",
          kind: "backlog",
          sessionId: "session-1",
          name: "Software Growth",
          accumulatedSeconds: 3600,
        }),
        makeRecord({
          id: "work",
          kind: "backlog",
          sessionId: "session-2",
          name: "Work",
          accumulatedSeconds: 10800,
        }),
      ],
      sessions,
    );
    expect(items.map((item) => item.label)).toEqual([
      "Work",
      "Software Growth",
      "No Activity",
    ]);
    expect(items[0]?.percent).toBe(50);
    expect(items[1]?.percent).toBe(17);
    expect(items[2]?.percent).toBe(33);
    expect(items.reduce((total, item) => total + item.percent, 0)).toBe(100);
  });

  it("returns a single slice when the dataset is already filtered", () => {
    const items = buildTimeByActivity(
      [
        makeRecord({
          kind: "backlog",
          sessionId: "session-1",
          name: "Software Growth",
          accumulatedSeconds: 3600,
        }),
      ],
      sessions,
    );
    expect(items).toEqual([
      expect.objectContaining({
        label: "Software Growth",
        percent: 100,
        totalSeconds: 3600,
      }),
    ]);
  });

  it("returns an empty list when there is no completed time", () => {
    expect(buildTimeByActivity([], sessions)).toEqual([]);
  });
});

describe("activity colors", () => {
  it("gives untagged records a shared key and unique hues per activity", () => {
    expect(
      getRecordColorKey(makeRecord({ kind: "unknown", sessionId: null })),
    ).toBe(NO_ACTIVITY_COLOR_KEY);
    expect(
      getRecordColorKey(
        makeRecord({ kind: "backlog", sessionId: "session-1" }),
      ),
    ).toBe("session-1");
    expect(getAnalyticsPalette("session-a").hue).not.toBe(
      getAnalyticsPalette("session-b").hue,
    );
    expect(getAnalyticsPalette(NO_ACTIVITY_COLOR_KEY)).toEqual(
      getAnalyticsPalette(NO_ACTIVITY_COLOR_KEY),
    );
  });
});

describe("formatDurationLabel", () => {
  it("omits zero minutes after hours", () => {
    expect(formatDurationLabel(3600)).toBe("1h");
    expect(formatDurationLabel(90)).toBe("1m");
  });
});
