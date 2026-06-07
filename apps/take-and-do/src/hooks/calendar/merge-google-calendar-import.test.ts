import { describe, expect, it } from "vitest";

import type {
  CalendarEvent,
  CommonCalendarEvent,
} from "@/types/calendar.types";

import { mergeGoogleCalendarImportedEvents } from "./merge-google-calendar-import";

function gcal(id: string, color?: string): CommonCalendarEvent {
  return {
    id: `gcal:${id}`,
    type: "common",
    title: "Meet",
    start: "2025-06-01T10:00:00.000Z",
    end: "2025-06-01T11:00:00.000Z",
    allDay: false,
    ...(color ? { color } : {}),
  };
}

describe("mergeGoogleCalendarImportedEvents color", () => {
  it("replaces stale local color when Google import includes a new color", () => {
    const prev = [gcal("abc", "#ff0000")];
    const imported = [gcal("abc", "#039be5")];
    const merged = mergeGoogleCalendarImportedEvents(prev, imported, {
      incremental: true,
    });
    expect(merged[0]?.color).toBe("#039be5");
  });

  it("clears stale local color when Google import has no per-event color", () => {
    const prev = [gcal("abc", "#ff0000")];
    const imported = [gcal("abc")];
    const merged = mergeGoogleCalendarImportedEvents(prev, imported, {
      incremental: true,
    });
    expect(merged[0]).not.toHaveProperty("color");
  });

  it("keeps overlapping slots from different recurring masters", () => {
    const prev: CalendarEvent[] = [];
    const imported: CalendarEvent[] = [
      {
        ...gcal("masterA_20250610T100000Z"),
        googleRecurrence: {
          recurringEventId: "masterA",
          originalStart: "2025-06-10T10:00:00.000Z",
        },
      },
      {
        ...gcal("masterB_20250610T100000Z"),
        googleRecurrence: {
          recurringEventId: "masterB",
          originalStart: "2025-06-10T10:00:00.000Z",
        },
      },
    ];

    const merged = mergeGoogleCalendarImportedEvents(prev, imported, {
      incremental: true,
    });

    expect(merged).toHaveLength(2);
  });
});
