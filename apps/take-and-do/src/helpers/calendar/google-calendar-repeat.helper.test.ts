import { describe, expect, it } from "vitest";

import {
  calendarRepeatToGoogleRecurrence,
  parseGoogleRecurrenceToCalendarRepeat,
} from "./google-calendar-repeat.helper";

describe("google-calendar-repeat.helper", () => {
  it("maps UI repeat rules to Google RRULE", () => {
    expect(calendarRepeatToGoogleRecurrence("daily")).toEqual([
      "RRULE:FREQ=DAILY",
    ]);
    expect(calendarRepeatToGoogleRecurrence("weekly")).toEqual([
      "RRULE:FREQ=WEEKLY",
    ]);
    expect(calendarRepeatToGoogleRecurrence("monthly")).toEqual([
      "RRULE:FREQ=MONTHLY",
    ]);
  });

  it("parses supported Google RRULE frequencies", () => {
    expect(
      parseGoogleRecurrenceToCalendarRepeat(["RRULE:FREQ=WEEKLY;BYDAY=MO"]),
    ).toBe("weekly");
    expect(parseGoogleRecurrenceToCalendarRepeat(["RRULE:FREQ=DAILY"])).toBe(
      "daily",
    );
    expect(
      parseGoogleRecurrenceToCalendarRepeat(["RRULE:FREQ=MONTHLY;COUNT=12"]),
    ).toBe("monthly");
    expect(
      parseGoogleRecurrenceToCalendarRepeat(["RRULE:FREQ=YEARLY"]),
    ).toBeUndefined();
  });
});
