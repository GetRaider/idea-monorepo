import { describe, expect, it } from "vitest";

import {
  addDays,
  currentStreak,
  summarizeEstablishment,
  weekCellState,
} from "./rules";

const everyDay = [1, 2, 3, 4, 5, 6, 7];

describe("summarizeEstablishment", () => {
  const asOfDate = "2026-11-25";
  const startedOnTime = "2026-10-27";

  it("stays short of established before 30 days", () => {
    const summary = summarizeEstablishment({
      establishingStartedOn: "2026-10-28",
      asOfDate,
      checkIns: [{ date: asOfDate, checkpointIndex: 0, status: "completed" }],
    });

    expect(summary.establishingDay).toBe(29);
    expect(summary.established).toBe(false);
    expect(summary.completionRate).toBe(1);
  });

  it("establishes at 90 percent after 30 days and ignores skips", () => {
    const summary = summarizeEstablishment({
      establishingStartedOn: startedOnTime,
      asOfDate,
      checkIns: [
        ...Array.from({ length: 9 }, (_, index) => ({
          date: addDays(asOfDate, -index),
          checkpointIndex: 0,
          status: "completed" as const,
        })),
        {
          date: addDays(asOfDate, -9),
          checkpointIndex: 0,
          status: "failed" as const,
        },
        {
          date: addDays(asOfDate, -10),
          checkpointIndex: 0,
          status: "skipped" as const,
        },
      ],
    });

    expect(summary.counts).toEqual({ completed: 9, failed: 1, skipped: 1 });
    expect(summary.completionRate).toBe(0.9);
    expect(summary.established).toBe(true);
  });

  it("does not establish below 90 percent", () => {
    const summary = summarizeEstablishment({
      establishingStartedOn: startedOnTime,
      asOfDate,
      checkIns: [
        ...Array.from({ length: 8 }, (_, index) => ({
          date: addDays(asOfDate, -index),
          checkpointIndex: 0,
          status: "completed" as const,
        })),
        ...Array.from({ length: 2 }, (_, index) => ({
          date: addDays(asOfDate, -(index + 8)),
          checkpointIndex: 0,
          status: "failed" as const,
        })),
      ],
    });

    expect(summary.established).toBe(false);
    expect(summary.completionRate).toBe(0.8);
  });

  it("flags the unanswered skip loophole: one completion and many skips qualifies", () => {
    const summary = summarizeEstablishment({
      establishingStartedOn: startedOnTime,
      asOfDate,
      checkIns: [
        { date: asOfDate, checkpointIndex: 0, status: "completed" },
        ...Array.from({ length: 29 }, (_, index) => ({
          date: addDays(asOfDate, -(index + 1)),
          checkpointIndex: 0,
          status: "skipped" as const,
        })),
      ],
    });

    expect(summary.completionRate).toBe(1);
    expect(summary.established).toBe(true);
  });
});

describe("currentStreak", () => {
  const today = "2026-11-25";

  it("keeps the streak when today is skipped and ends it on a failure", () => {
    const completedDays = [1, 2, 3, 4, 5, 6].map((offset) => ({
      date: addDays(today, -offset),
      checkpointIndex: 0,
      status: "completed" as const,
    }));

    expect(
      currentStreak({
        today,
        weekdays: everyDay,
        timeZone: "UTC",
        checkpointsPerDay: 1,
        activeFrom: "2026-01-01",
        checkIns: [
          ...completedDays,
          { date: today, checkpointIndex: 0, status: "skipped" },
        ],
      }),
    ).toBe(6);

    expect(
      currentStreak({
        today,
        weekdays: everyDay,
        timeZone: "UTC",
        checkpointsPerDay: 1,
        activeFrom: "2026-01-01",
        checkIns: [
          ...completedDays,
          { date: today, checkpointIndex: 0, status: "failed" },
        ],
      }),
    ).toBe(0);
  });

  it("extends only when every checkpoint is completed", () => {
    expect(
      currentStreak({
        today,
        weekdays: everyDay,
        timeZone: "UTC",
        checkpointsPerDay: 2,
        activeFrom: today,
        checkIns: [
          { date: today, checkpointIndex: 0, status: "completed" },
          { date: today, checkpointIndex: 1, status: "completed" },
        ],
      }),
    ).toBe(1);

    expect(
      currentStreak({
        today,
        weekdays: everyDay,
        timeZone: "UTC",
        checkpointsPerDay: 2,
        activeFrom: today,
        checkIns: [{ date: today, checkpointIndex: 0, status: "completed" }],
      }),
    ).toBe(0);
  });

  it("ignores days that are not scheduled and unmarked days", () => {
    expect(
      currentStreak({
        today: "2026-11-25",
        weekdays: [3],
        timeZone: "UTC",
        checkpointsPerDay: 1,
        activeFrom: "2026-11-01",
        checkIns: [
          { date: "2026-11-18", checkpointIndex: 0, status: "completed" },
        ],
      }),
    ).toBe(1);
  });
});

describe("weekCellState", () => {
  it("collapses a day of checkpoints into one mark", () => {
    expect(
      weekCellState({
        scheduled: false,
        checkpointsPerDay: 1,
        checkIns: [],
      }),
    ).toBe("off");
    expect(
      weekCellState({
        scheduled: true,
        checkpointsPerDay: 3,
        checkIns: [{ status: "completed" }, { status: "completed" }],
      }),
    ).toBe("partial");
    expect(
      weekCellState({
        scheduled: true,
        checkpointsPerDay: 1,
        checkIns: [{ status: "failed" }],
      }),
    ).toBe("failed");
    expect(
      weekCellState({
        scheduled: true,
        checkpointsPerDay: 1,
        checkIns: [{ status: "skipped" }],
      }),
    ).toBe("skipped");
  });
});
