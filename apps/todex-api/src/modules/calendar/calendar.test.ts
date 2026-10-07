import { describe, expect, it } from "vitest";
import {
  expandRecurrenceStarts,
  formatGoogleEventDescription,
  parseGoogleEventDescription,
  recurrenceToRrule,
  rruleToRecurrence,
  type TaskRecurrence,
} from "@repo/api/todex";

const weekly: TaskRecurrence = {
  frequency: "weekly",
  interval: 1,
  weekdays: ["MO", "WE"],
  timeZone: "UTC",
  end: { type: "count", count: 4 },
};

describe("calendar recurrence", () => {
  it("round-trips a weekly rule and expands the counted occurrences", () => {
    const parsed = rruleToRecurrence([recurrenceToRrule(weekly)], "UTC");
    expect(parsed).toEqual(weekly);
    const starts = expandRecurrenceStarts({
      start: new Date("2026-10-05T09:00:00.000Z"),
      rule: weekly,
      rangeStart: new Date("2026-10-01T00:00:00.000Z"),
      rangeEnd: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(starts).toHaveLength(4);
    expect(starts[0]?.toISOString()).toBe("2026-10-05T09:00:00.000Z");
    expect(starts[1]?.toISOString()).toBe("2026-10-07T09:00:00.000Z");
  });

  it("keeps an unsupported rule unparsed", () => {
    expect(
      rruleToRecurrence(["RRULE:FREQ=WEEKLY;BYMONTH=1"], "UTC"),
    ).toBeNull();
  });
});

describe("google event description", () => {
  it("merges task scope and description, then reads them back", () => {
    const text = formatGoogleEventDescription({
      taskSummaries: ["Do this", "Do that"],
      description: "Description Description",
    });
    expect(text).toBe(
      "# Task Scope\n[] Do this\n[] Do that\n\n# Description\nDescription Description",
    );
    expect(parseGoogleEventDescription(text)).toEqual({
      scopeLines: ["Do this", "Do that"],
      description: "Description Description",
    });
  });
});
