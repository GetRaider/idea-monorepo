import { describe, expect, it } from "vitest";
import type {
  CounterOccurrenceSource,
  CounterOccurrenceStatus,
} from "@repo/api/todex";

import {
  calendarDays,
  currentStreak,
  planDay,
  settleDay,
  totalDays,
  type CounterEntry,
  type SavedOutcome,
} from "./counter-days";

function entry(
  id: string,
  status: CounterOccurrenceStatus,
  source: CounterOccurrenceSource = "manual",
  date = "2026-11-27",
): CounterEntry {
  return { id, status, source, date };
}

describe("settleDay", () => {
  it("fails every untouched slot of a required day", () => {
    expect(settleDay(3, true, [entry("a", "completed")])).toEqual({
      completed: 1,
      skipped: 0,
      failed: 2,
      outcome: "failed",
      defaultFails: 2,
    });
  });

  it("never adds a fail to a day marked by choice", () => {
    expect(settleDay(3, false, [entry("a", "completed")])).toMatchObject({
      failed: 0,
      outcome: "excused",
      defaultFails: 0,
    });
  });

  it("is met at the target", () => {
    expect(settleDay(1, true, [entry("a", "completed")]).outcome).toBe("met");
  });

  it("is excused when the rest of the day is skipped", () => {
    expect(
      settleDay(2, true, [entry("a", "completed"), entry("b", "skipped")])
        .outcome,
    ).toBe("excused");
  });
});

describe("planDay", () => {
  it("adds completions up to the asked count", () => {
    expect(
      planDay({
        target: 3,
        dayEntries: [entry("a", "completed")],
        change: { status: "completed", count: 2 },
      }),
    ).toEqual({ removeIds: [], add: ["completed"] });
  });

  it("refuses more completions than the day holds", () => {
    expect(
      planDay({
        target: 1,
        dayEntries: [],
        change: { status: "completed", count: 2 },
      }),
    ).toEqual({ error: "This day holds at most 1" });
  });

  it("drops hand-made completions before Task ones", () => {
    expect(
      planDay({
        target: 2,
        dayEntries: [
          entry("hand", "completed"),
          entry("task", "completed", "task"),
        ],
        change: { status: "completed", count: 1 },
      }),
    ).toEqual({ removeIds: ["hand"], add: [] });
  });

  it("fails what is left beside the completions", () => {
    expect(
      planDay({
        target: 3,
        dayEntries: [entry("a", "completed"), entry("b", "skipped")],
        change: { status: "failed" },
      }),
    ).toEqual({ removeIds: ["b"], add: ["failed", "failed"] });
  });

  it("replaces a finished day with the asked mark", () => {
    expect(
      planDay({
        target: 1,
        dayEntries: [entry("a", "completed")],
        change: { status: "skipped", skipReason: "Sick" },
      }),
    ).toEqual({ removeIds: ["a"], add: ["skipped"] });
  });

  it("empties the day", () => {
    expect(
      planDay({
        target: 1,
        dayEntries: [entry("a", "completed", "task")],
        change: { status: "empty" },
      }),
    ).toEqual({ removeIds: ["a"], add: [] });
  });
});

describe("calendarDays", () => {
  const days = calendarDays({
    until: "2026-11-28",
    today: "2026-11-27",
    isActive: true,
    targetOn: (date) => (date === "2026-11-26" ? null : 2),
    entries: [entry("a", "completed")],
  });
  const on = (date: string) => days.find((day) => day.date === date);

  it("covers the seven days ending on the requested date", () => {
    expect(days.map((day) => day.date)).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ]);
  });

  it("shows progress and lets a part-done day be completed", () => {
    expect(on("2026-11-27")).toMatchObject({
      fill: "partial",
      capacity: 2,
      completed: 1,
      loggable: true,
      canComplete: true,
    });
  });

  it("locks unscheduled and future days", () => {
    expect(on("2026-11-26")).toMatchObject({
      tracked: false,
      loggable: false,
    });
    expect(on("2026-11-28")).toMatchObject({
      tracked: true,
      loggable: false,
      canComplete: false,
    });
  });
});

describe("currentStreak", () => {
  const day = (
    date: string,
    outcome: SavedOutcome["outcome"] = "met",
    skipped = 0,
  ) => ({ date, outcome, skipped });
  const streak = (
    days: SavedOutcome[],
    extra: Partial<Parameters<typeof currentStreak>[0]> = {},
  ) =>
    currentStreak({
      days,
      today: null,
      createdOn: "2026-11-01",
      isScheduledOn: () => true,
      ...extra,
    });

  it("counts met days back to the last failed one", () => {
    expect(
      streak([
        day("2026-11-24", "failed"),
        day("2026-11-26"),
        day("2026-11-25"),
      ]),
    ).toBe(2);
  });

  it("passes over a skipped day", () => {
    expect(
      streak([
        day("2026-11-24"),
        day("2026-11-25", "excused", 1),
        day("2026-11-26"),
      ]),
    ).toBe(2);
  });

  it("includes a finished today and ignores an unfinished one", () => {
    const days = [day("2026-11-26")];
    const today = { completed: 1, target: 1, hasFail: false };
    expect(streak(days, { today })).toBe(2);
    expect(streak(days, { today: { ...today, completed: 0 } })).toBe(1);
    expect(streak(days, { today: { ...today, hasFail: true } })).toBe(0);
  });

  it("stops at an unmarked day from before the Counter existed", () => {
    expect(
      streak([day("2026-11-26"), day("2026-11-24")], {
        createdOn: "2026-11-27",
      }),
    ).toBe(1);
  });

  it("runs on through unscheduled days before the Counter existed", () => {
    expect(
      streak([day("2026-11-25"), day("2026-11-23")], {
        createdOn: "2026-11-27",
        isScheduledOn: (date) => Number(date.slice(8)) % 2 === 1,
      }),
    ).toBe(2);
  });

  it("stops at a part-done day from before the Counter existed", () => {
    expect(
      streak(
        [day("2026-11-26"), day("2026-11-25", "excused"), day("2026-11-24")],
        { createdOn: "2026-11-27" },
      ),
    ).toBe(1);
  });
});

describe("totalDays", () => {
  it("counts the days that reached their target", () => {
    expect(
      totalDays(
        [
          entry("a", "completed", "manual", "2026-11-26"),
          entry("b", "completed", "manual", "2026-11-26"),
          entry("c", "completed", "manual", "2026-11-27"),
          entry("d", "failed", "system", "2026-11-25"),
        ],
        () => 2,
      ),
    ).toBe(1);
  });
});
