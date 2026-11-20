import { describe, expect, it } from "vitest";
import {
  CreateCalendarEventBodySchema,
  UpdateCalendarEventBodySchema,
  expandRecurrenceStarts,
  formatGoogleEventDescription,
  parseGoogleEventDescription,
  recurrenceToRrule,
  rruleToRecurrence,
  type TaskRecurrence,
} from "@repo/api/todex";

import { mapCalendarEvent } from "../../db/mappers";
import { assertTaskScope, assertTimedEventRange } from "./calendar-scope";

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

describe("calendar event rules", () => {
  const start = "2026-10-07T10:00:00.000Z";
  const end = "2026-10-07T11:00:00.000Z";

  it("rejects a task from another space and a scope with no space", () => {
    expect(() =>
      assertTaskScope({
        spaceId: "space-a",
        taskIds: ["task-1"],
        tasks: [{ id: "task-1", spaceId: "space-b" }],
      }),
    ).toThrow("Task must belong to the event space");
    expect(() =>
      assertTaskScope({
        spaceId: null,
        taskIds: ["task-1"],
        tasks: [{ id: "task-1", spaceId: "space-a" }],
      }),
    ).toThrow("Select a space to add tasks");
  });

  it("rejects a timed range under 15 minutes and allows all-day", () => {
    expect(() =>
      assertTimedEventRange({
        allDay: false,
        start: new Date(start),
        end: new Date("2026-10-07T10:10:00.000Z"),
      }),
    ).toThrow("Timed events must be at least 15 minutes");
    expect(() =>
      assertTimedEventRange({
        allDay: true,
        start: new Date(start),
        end: new Date("2026-10-07T10:10:00.000Z"),
      }),
    ).not.toThrow();
  });

  it("maps a short google row and rejects color on write", () => {
    const mapped = mapCalendarEvent({
      id: "event-1",
      workspaceId: "workspace-1",
      spaceId: null,
      seriesEventId: null,
      title: "Imported",
      start: new Date(start),
      end: new Date("2026-10-07T10:05:00.000Z"),
      allDay: false,
      timeZone: "UTC",
      recurrence: null,
      rawRrule: null,
      description: "",
      taskScope: [],
      participants: [],
      rsvpStatus: null,
      googleEventId: "google-1",
      googleEtag: null,
      googleUpdatedAt: null,
      organizerSelf: false,
      originalStart: null,
      cancelled: false,
      createdAt: new Date(start),
      updatedAt: new Date(start),
    });
    expect(mapped.end).toBe("2026-10-07T10:05:00.000Z");
    expect(mapped).not.toHaveProperty("color");
    expect(
      CreateCalendarEventBodySchema.safeParse({
        title: "Plan",
        start,
        end,
        timeZone: "UTC",
        color: "#B8A4D1",
      }).success,
    ).toBe(false);
    expect(
      UpdateCalendarEventBodySchema.safeParse({ color: "#B8A4D1" }).success,
    ).toBe(false);
  });
});
