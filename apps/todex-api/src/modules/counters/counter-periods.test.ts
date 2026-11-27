import { describe, expect, it } from "vitest";
import {
  CreateCounterBodySchema,
  SetCounterDayBodySchema,
  UpdateCounterBodySchema,
} from "@repo/api/todex";

import {
  calendarDays,
  currentStreak,
  dayCapacity,
  localDate,
  mondayOf,
  openPeriod,
  periodContaining,
  planDay,
  settlePeriod,
  totalDays,
  type CounterEntry,
} from "./counter-periods";

describe("localDate", () => {
  it("uses the Counter time zone, not UTC", () => {
    const instant = new Date("2026-11-27T22:30:00.000Z");
    expect(localDate(instant, "UTC")).toBe("2026-11-27");
    expect(localDate(instant, "Europe/Kyiv")).toBe("2026-11-28");
    expect(localDate(instant, "America/Los_Angeles")).toBe("2026-11-27");
  });
});

describe("periodContaining", () => {
  it("makes one-day periods for every day", () => {
    expect(
      periodContaining(
        { frequency: "daily", interval: 1 },
        "2026-11-27",
        "2026-12-03",
      ),
    ).toEqual({ start: "2026-12-03", end: "2026-12-03" });
  });

  it("counts every-2-days blocks from the anchor", () => {
    const rule = { frequency: "daily", interval: 2 } as const;
    expect(periodContaining(rule, "2026-11-27", "2026-11-27")).toEqual({
      start: "2026-11-27",
      end: "2026-11-28",
    });
    expect(periodContaining(rule, "2026-11-27", "2026-12-02")).toEqual({
      start: "2026-12-01",
      end: "2026-12-02",
    });
  });

  it("runs weeks from Monday to Sunday", () => {
    const rule = { frequency: "weekly", interval: 1 } as const;
    // 2026-11-29 is a Sunday.
    expect(periodContaining(rule, "2026-11-27", "2026-11-29")).toEqual({
      start: "2026-11-23",
      end: "2026-11-29",
    });
    expect(periodContaining(rule, "2026-11-27", "2026-11-30")).toEqual({
      start: "2026-11-30",
      end: "2026-12-06",
    });
  });

  it("counts 2-week blocks from the Monday of the anchor week", () => {
    const rule = { frequency: "weekly", interval: 2 } as const;
    expect(periodContaining(rule, "2026-11-27", "2026-12-06")).toEqual({
      start: "2026-11-23",
      end: "2026-12-06",
    });
    expect(periodContaining(rule, "2026-11-27", "2026-12-07")).toEqual({
      start: "2026-12-07",
      end: "2026-12-20",
    });
  });

  it("covers whole calendar months, leap years included", () => {
    const rule = { frequency: "monthly", interval: 1 } as const;
    expect(periodContaining(rule, "2026-11-27", "2027-02-14")).toEqual({
      start: "2027-02-01",
      end: "2027-02-28",
    });
    expect(periodContaining(rule, "2028-02-10", "2028-02-10")).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
    });
  });

  it("is unaffected by daylight saving transitions", () => {
    expect(mondayOf("2027-03-28")).toBe("2027-03-22");
    expect(
      periodContaining(
        { frequency: "daily", interval: 2 },
        "2027-03-27",
        "2027-03-29",
      ),
    ).toEqual({ start: "2027-03-29", end: "2027-03-30" });
  });
});

describe("openPeriod", () => {
  it("starts the day after the cursor and ends on the calendar boundary", () => {
    expect(
      openPeriod(
        { frequency: "monthly", interval: 1 },
        "2026-12-07",
        "2026-12-06",
      ),
    ).toEqual({ start: "2026-12-07", end: "2026-12-31" });
  });
});

describe("settlePeriod", () => {
  const week = { start: "2026-11-23", end: "2026-11-29" };

  it("fails the missing slots on the last empty days", () => {
    expect(
      settlePeriod(week, 4, [
        { date: "2026-11-23", status: "completed" },
        { date: "2026-11-29", status: "completed" },
      ]),
    ).toEqual({
      completed: 2,
      skipped: 0,
      failed: 2,
      outcome: "failed",
      failedDates: ["2026-11-27", "2026-11-28"],
    });
  });

  it("puts the remainder on the last day when empty days run out", () => {
    const day = { start: "2026-11-27", end: "2026-11-27" };
    expect(settlePeriod(day, 3, []).failedDates).toEqual([
      "2026-11-27",
      "2026-11-27",
      "2026-11-27",
    ]);
    const two = { start: "2026-11-27", end: "2026-11-28" };
    expect(
      settlePeriod(two, 4, [{ date: "2026-11-28", status: "completed" }])
        .failedDates,
    ).toEqual(["2026-11-27", "2026-11-28", "2026-11-28"]);
  });

  it("is met when completions reach or exceed the target", () => {
    const occurrences = Array.from({ length: 5 }, () => ({
      date: "2026-11-23",
      status: "completed" as const,
    }));
    expect(settlePeriod(week, 4, occurrences)).toMatchObject({
      completed: 5,
      failed: 0,
      outcome: "met",
      failedDates: [],
    });
  });

  it("is excused when skips fill the gap", () => {
    expect(
      settlePeriod(week, 2, [
        { date: "2026-11-23", status: "completed" },
        { date: "2026-11-24", status: "skipped" },
      ]),
    ).toMatchObject({ failed: 0, outcome: "excused" });
  });
});

describe("settlePeriod with hand-set fails", () => {
  const week = { start: "2026-11-23", end: "2026-11-29" };

  it("counts them and only adds default fails for untouched slots", () => {
    expect(
      settlePeriod(week, 3, [
        { date: "2026-11-23", status: "completed" },
        { date: "2026-11-29", status: "failed" },
      ]),
    ).toEqual({
      completed: 1,
      skipped: 0,
      failed: 2,
      outcome: "failed",
      failedDates: ["2026-11-28"],
    });
  });
});

describe("dayCapacity", () => {
  const week = { start: "2026-11-23", end: "2026-11-29" };
  const day = { start: "2026-11-27", end: "2026-11-27" };

  it("is the Target for every day and one for most longer periods", () => {
    expect(dayCapacity(day, 1)).toBe(1);
    expect(dayCapacity(day, 3)).toBe(3);
    expect(dayCapacity(week, 4)).toBe(1);
    expect(dayCapacity(week, 7)).toBe(1);
  });

  it("grows only when the Target cannot fit one per day", () => {
    expect(dayCapacity(week, 10)).toBe(2);
    expect(dayCapacity({ start: "2026-11-27", end: "2026-11-28" }, 3)).toBe(2);
  });
});

describe("planDay", () => {
  const week = { start: "2026-11-23", end: "2026-11-29", target: 4 };
  const day = { start: "2026-11-27", end: "2026-11-27", target: 3 };

  it("adds completions up to the count asked for", () => {
    expect(
      planDay({
        period: day,
        dayEntries: [entry("a", "completed")],
        otherDays: 0,
        change: { status: "completed", count: 3 },
      }),
    ).toEqual({ removeIds: [], add: ["completed", "completed"] });
  });

  it("replaces a fail or skip when the day is completed", () => {
    expect(
      planDay({
        period: week,
        dayEntries: [entry("a", "skipped")],
        otherDays: 3,
        change: { status: "completed", count: 1 },
      }),
    ).toEqual({ removeIds: ["a"], add: ["completed"] });
  });

  it("keeps Task completions before hand-made ones when lowering", () => {
    expect(
      planDay({
        period: day,
        dayEntries: [
          entry("hand", "completed"),
          entry("task", "completed", "task"),
        ],
        otherDays: 0,
        change: { status: "completed", count: 1 },
      }),
    ).toEqual({ removeIds: ["hand"], add: [] });
  });

  it("refuses more than the day or the Target can hold", () => {
    expect(
      planDay({
        period: week,
        dayEntries: [],
        otherDays: 0,
        change: { status: "completed", count: 2 },
      }),
    ).toEqual({ error: "This day holds at most 1" });
    for (const change of [
      { status: "completed", count: 1 },
      { status: "failed" },
      { status: "skipped", skipReason: "Sick" },
    ] as const) {
      expect(
        planDay({ period: week, dayEntries: [], otherDays: 4, change }),
      ).toEqual({ error: "The Target for this period is already covered" });
    }
  });

  it("marks the rest of a partly done day", () => {
    expect(
      planDay({
        period: day,
        dayEntries: [entry("a", "completed")],
        otherDays: 0,
        change: { status: "skipped", skipReason: "Sick" },
      }),
    ).toEqual({ removeIds: [], add: ["skipped", "skipped"] });
  });

  it("replaces the completions of a full day when it is failed", () => {
    expect(
      planDay({
        period: week,
        dayEntries: [entry("a", "completed")],
        otherDays: 0,
        change: { status: "failed" },
      }),
    ).toEqual({ removeIds: ["a"], add: ["failed"] });
  });

  it("clears everything on the day", () => {
    expect(
      planDay({
        period: week,
        dayEntries: [entry("a", "failed")],
        otherDays: 4,
        change: { status: "empty" },
      }),
    ).toEqual({ removeIds: ["a"], add: [] });
  });
});

describe("calendarDays", () => {
  const base = {
    until: "2026-11-27",
    today: "2026-11-27",
    isActive: true,
    periods: [
      { start: "2026-11-16", end: "2026-11-22", target: 2 },
      { start: "2026-11-23", end: "2026-11-29", target: 1 },
    ],
    entries: [],
  };

  it("returns the seven days ending on the requested date", () => {
    expect(calendarDays(base).map((item) => item.date)).toEqual([
      "2026-11-21",
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
    ]);
  });

  it("allows marking any tracked day up to today, closed ones included", () => {
    const days = calendarDays({ ...base, until: "2026-11-28" });
    expect(days.map((item) => item.loggable)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
  });

  it("leaves untracked days and archived Counters inert", () => {
    const early = calendarDays({ ...base, until: "2026-11-17" });
    expect(early[0]).toMatchObject({ tracked: false, loggable: false });
    expect(early[6]).toMatchObject({ tracked: true, loggable: true });
    expect(
      calendarDays({ ...base, isActive: false }).some((item) => item.loggable),
    ).toBe(false);
  });

  it("stops completing once the period Target is covered", () => {
    const days = calendarDays({
      ...base,
      entries: [entry("a", "completed", "manual", "2026-11-23")],
    });
    expect(days[2]).toMatchObject({
      fill: "filled",
      canComplete: false,
      canMark: true,
    });
    expect(days[3]).toMatchObject({
      fill: "empty",
      canComplete: false,
      canMark: false,
    });
  });

  it("lets a default fail be completed", () => {
    const days = calendarDays({
      ...base,
      entries: [entry("a", "failed", "system", "2026-11-22")],
    });
    expect(days[1]).toMatchObject({ failed: 1, canComplete: true });
  });

  it("shows part of a multi-completion day", () => {
    const days = calendarDays({
      ...base,
      periods: [{ start: "2026-11-27", end: "2026-11-27", target: 2 }],
      entries: [entry("a", "completed", "manual", "2026-11-27")],
    });
    expect(days[6]).toMatchObject({
      fill: "partial",
      capacity: 2,
      canComplete: true,
    });
  });
});

describe("currentStreak", () => {
  const closed = (...outcomes: ("met" | "excused" | "failed")[]) =>
    outcomes.map((outcome, index) => ({
      start: `2026-11-${String(index + 1).padStart(2, "0")}`,
      outcome,
    }));

  it("counts met periods back to the last failed one", () => {
    expect(
      currentStreak(closed("met", "failed", "met", "excused", "met"), null),
    ).toBe(2);
    expect(currentStreak(closed("met", "failed"), null)).toBe(0);
  });

  it("adds the open period once its Target is reached", () => {
    const history = closed("met");
    expect(
      currentStreak(history, { completed: 1, target: 2, hasFail: false }),
    ).toBe(1);
    expect(
      currentStreak(history, { completed: 2, target: 2, hasFail: false }),
    ).toBe(2);
  });

  it("resets at once on a hand-set fail in the open period", () => {
    expect(
      currentStreak(closed("met", "met"), {
        completed: 1,
        target: 2,
        hasFail: true,
      }),
    ).toBe(0);
  });
});

describe("totalDays", () => {
  it("counts days whose completions fill the day", () => {
    const periods = [
      { start: "2026-11-26", end: "2026-11-26", target: 2 },
      { start: "2026-11-27", end: "2026-11-27", target: 1 },
    ];
    expect(
      totalDays(
        [
          entry("a", "completed", "manual", "2026-11-26"),
          entry("b", "completed", "manual", "2026-11-27"),
          entry("c", "skipped", "manual", "2026-11-25"),
        ],
        periods,
      ),
    ).toBe(1);
  });
});

describe("counter contracts", () => {
  const create = {
    name: "Gym",
    frequency: "weekly",
    interval: 1,
    target: 4,
    timeZone: "Europe/Kyiv",
  };

  it("accepts only the five recurrences", () => {
    expect(CreateCounterBodySchema.safeParse(create).success).toBe(true);
    expect(
      CreateCounterBodySchema.safeParse({
        ...create,
        frequency: "monthly",
        interval: 2,
      }).success,
    ).toBe(false);
    expect(
      UpdateCounterBodySchema.safeParse({ frequency: "monthly" }).success,
    ).toBe(false);
  });

  it("rejects a target below 1, a bad zone and unknown fields", () => {
    for (const invalid of [
      { target: 0 },
      { target: 1.5 },
      { timeZone: "Mars/Base" },
      { closedThrough: "2026-01-01" },
    ]) {
      expect(
        CreateCounterBodySchema.safeParse({ ...create, ...invalid }).success,
      ).toBe(false);
    }
  });

  it("validates how a day is set", () => {
    const accepts = (body: unknown) =>
      SetCounterDayBodySchema.safeParse(body).success;
    expect(accepts({ status: "completed", count: 1 })).toBe(true);
    expect(accepts({ status: "completed", count: 0 })).toBe(false);
    expect(accepts({ status: "completed" })).toBe(false);
    expect(accepts({ status: "failed" })).toBe(true);
    expect(accepts({ status: "empty" })).toBe(true);
    expect(accepts({ status: "skipped" })).toBe(false);
    expect(accepts({ status: "skipped", skipReason: "   " })).toBe(false);
  });
});

function entry(
  id: string,
  status: CounterEntry["status"],
  source: CounterEntry["source"] = "manual",
  date = "2026-11-27",
): CounterEntry {
  return { id, status, source, date };
}
