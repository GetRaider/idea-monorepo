import { describe, expect, it } from "vitest";
import type { CounterSchedule } from "@repo/api/todex";

import {
  isSameSchedule,
  isScheduled,
  localDate,
  nextScheduledDate,
} from "./counter-schedule";

// 2026-11-27 is a Friday.
const ANCHOR = "2026-11-27";

function scheduledDays(schedule: CounterSchedule, dates: string[]) {
  return dates.filter((date) => isScheduled(schedule, ANCHOR, date));
}

describe("localDate", () => {
  it("reads the calendar date in the given time zone", () => {
    const now = new Date("2026-11-27T22:30:00Z");
    expect(localDate(now, "UTC")).toBe("2026-11-27");
    expect(localDate(now, "Europe/Kyiv")).toBe("2026-11-28");
  });
});

describe("isScheduled", () => {
  it("falls on every day", () => {
    const dates = ["2026-11-26", "2026-11-27", "2026-11-28"];
    expect(scheduledDays({ frequency: "daily", interval: 1 }, dates)).toEqual(
      dates,
    );
  });

  it("counts a day interval from the anchor in both directions", () => {
    expect(
      scheduledDays({ frequency: "daily", interval: 3 }, [
        "2026-11-21",
        "2026-11-22",
        "2026-11-24",
        "2026-11-27",
        "2026-11-28",
        "2026-11-30",
      ]),
    ).toEqual(["2026-11-21", "2026-11-24", "2026-11-27", "2026-11-30"]);
  });

  it("falls on the chosen weekdays", () => {
    expect(
      scheduledDays(
        { frequency: "weekly", interval: 1, weekdays: ["MO", "WE", "FR"] },
        [
          "2026-11-22",
          "2026-11-23",
          "2026-11-24",
          "2026-11-25",
          "2026-11-26",
          "2026-11-27",
          "2026-11-28",
          "2026-11-29",
        ],
      ),
    ).toEqual(["2026-11-23", "2026-11-25", "2026-11-27"]);
  });

  it("skips every other Monday-based week", () => {
    expect(
      scheduledDays({ frequency: "weekly", interval: 2, weekdays: ["SU"] }, [
        "2026-11-15",
        "2026-11-22",
        "2026-11-29",
        "2026-12-06",
        "2026-12-13",
      ]),
    ).toEqual(["2026-11-15", "2026-11-29", "2026-12-13"]);
  });

  it("uses the last day of a month that is too short", () => {
    expect(
      scheduledDays({ frequency: "monthly", monthDay: 31 }, [
        "2026-11-29",
        "2026-11-30",
        "2026-12-30",
        "2026-12-31",
        "2027-02-28",
        "2028-02-28",
        "2028-02-29",
      ]),
    ).toEqual(["2026-11-30", "2026-12-31", "2027-02-28", "2028-02-29"]);
  });
});

describe("nextScheduledDate", () => {
  it("finds the next scheduled day after a date", () => {
    expect(
      nextScheduledDate(
        { frequency: "weekly", interval: 2, weekdays: ["FR"] },
        ANCHOR,
        ANCHOR,
      ),
    ).toBe("2026-12-11");
  });

  it("reaches across the widest gap", () => {
    expect(
      nextScheduledDate({ frequency: "daily", interval: 99 }, ANCHOR, ANCHOR),
    ).toBe("2027-03-06");
  });
});

describe("isSameSchedule", () => {
  it("ignores the order of weekdays", () => {
    expect(
      isSameSchedule(
        { frequency: "weekly", interval: 1, weekdays: ["FR", "MO"] },
        { weekdays: ["MO", "FR"], interval: 1, frequency: "weekly" },
      ),
    ).toBe(true);
  });

  it("tells different schedules apart", () => {
    expect(
      isSameSchedule(
        { frequency: "daily", interval: 1 },
        { frequency: "daily", interval: 2 },
      ),
    ).toBe(false);
  });
});
