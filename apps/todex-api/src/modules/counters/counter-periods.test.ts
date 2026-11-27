import { describe, expect, it } from "vitest";
import {
  CreateCounterBodySchema,
  LogCounterOccurrenceBodySchema,
  UpdateCounterBodySchema,
} from "@repo/api/todex";

import {
  localDate,
  mondayOf,
  openPeriod,
  periodContaining,
  settlePeriod,
  weekDays,
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

describe("weekDays", () => {
  const base = {
    today: "2026-11-27",
    rule: { frequency: "daily", interval: 1, target: 2 } as const,
    period: { start: "2026-11-27", end: "2026-11-27" },
    closedPeriods: [],
    occurrences: [],
  };

  it("returns Monday to Sunday around today", () => {
    const days = weekDays(base);
    expect(days.map((day) => day.date)).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
  });

  it("allows logging only inside the open period up to today", () => {
    const days = weekDays({
      ...base,
      rule: { frequency: "weekly", interval: 1, target: 4 },
      period: { start: "2026-11-23", end: "2026-11-29" },
    });
    expect(days.map((day) => day.loggable)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it("allows nothing without a period or before it starts", () => {
    expect(
      weekDays({ ...base, period: null }).some((day) => day.loggable),
    ).toBe(false);
    expect(
      weekDays({
        ...base,
        period: { start: "2026-11-28", end: "2026-11-28" },
      }).some((day) => day.loggable),
    ).toBe(false);
  });

  it("shows partial days only for every-day counters with target 2+", () => {
    const occurrences = [
      { date: "2026-11-27", status: "completed" as const },
      { date: "2026-11-27", status: "skipped" as const },
    ];
    expect(weekDays({ ...base, occurrences })[4]).toMatchObject({
      fill: "partial",
      completed: 1,
      skipped: 1,
    });
    expect(
      weekDays({
        ...base,
        rule: { frequency: "daily", interval: 2, target: 2 },
        occurrences,
      })[4]?.fill,
    ).toBe("filled");
  });

  it("judges a closed day by the target in its snapshot", () => {
    const days = weekDays({
      ...base,
      closedPeriods: [{ start: "2026-11-26", end: "2026-11-26", target: 1 }],
      occurrences: [{ date: "2026-11-26", status: "completed" }],
    });
    expect(days[3]?.fill).toBe("filled");
  });

  it("never counts skipped or failed toward the fill", () => {
    const days = weekDays({
      ...base,
      occurrences: [{ date: "2026-11-26", status: "failed" }],
    });
    expect(days[3]).toMatchObject({ fill: "empty", failed: 1 });
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

  it("requires a skip reason and never accepts Failed", () => {
    expect(
      LogCounterOccurrenceBodySchema.safeParse({ status: "skipped" }).success,
    ).toBe(false);
    expect(
      LogCounterOccurrenceBodySchema.safeParse({
        status: "skipped",
        skipReason: "   ",
      }).success,
    ).toBe(false);
    expect(
      LogCounterOccurrenceBodySchema.safeParse({ status: "failed" }).success,
    ).toBe(false);
    expect(
      LogCounterOccurrenceBodySchema.safeParse({
        status: "completed",
        date: "2026-02-30",
      }).success,
    ).toBe(false);
  });
});
