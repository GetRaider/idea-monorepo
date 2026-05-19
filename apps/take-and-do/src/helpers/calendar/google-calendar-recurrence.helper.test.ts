import { describe, expect, it } from "vitest";

import type { CalendarEvent } from "@/types/calendar.types";

import { googleEventMatchesRecurrenceScope } from "./google-calendar-recurrence.helper";

function gcalEvent(
  id: string,
  start: string,
  recurringEventId: string,
  originalStart?: string,
): CalendarEvent {
  return {
    id: `gcal:${id}`,
    type: "common",
    title: "Test",
    start,
    end: start,
    allDay: false,
    googleRecurrence: {
      recurringEventId,
      ...(originalStart ? { originalStart } : {}),
    },
  };
}

describe("googleEventMatchesRecurrenceScope", () => {
  const master = "master123";
  const anchor = gcalEvent(
    "master123_2025-05-20T10:00:00Z",
    "2025-05-20T10:00:00.000Z",
    master,
    "2025-05-20T10:00:00.000Z",
  );
  const earlier = gcalEvent(
    "master123_2025-05-13T10:00:00Z",
    "2025-05-13T10:00:00.000Z",
    master,
    "2025-05-13T10:00:00.000Z",
  );
  const later = gcalEvent(
    "master123_2025-05-27T10:00:00Z",
    "2025-05-27T10:00:00.000Z",
    master,
    "2025-05-27T10:00:00.000Z",
  );
  const otherSeries = gcalEvent(
    "other_2025-05-20T10:00:00Z",
    "2025-05-20T10:00:00.000Z",
    "other",
    "2025-05-20T10:00:00.000Z",
  );

  it("instance scope matches only the anchor id", () => {
    expect(googleEventMatchesRecurrenceScope(anchor, anchor, "instance")).toBe(
      true,
    );
    expect(googleEventMatchesRecurrenceScope(later, anchor, "instance")).toBe(
      false,
    );
  });

  it("series scope matches all instances with the same master", () => {
    expect(googleEventMatchesRecurrenceScope(earlier, anchor, "series")).toBe(
      true,
    );
    expect(googleEventMatchesRecurrenceScope(later, anchor, "series")).toBe(
      true,
    );
    expect(
      googleEventMatchesRecurrenceScope(otherSeries, anchor, "series"),
    ).toBe(false);
  });

  it("following scope matches anchor and later instances only", () => {
    expect(
      googleEventMatchesRecurrenceScope(earlier, anchor, "following"),
    ).toBe(false);
    expect(googleEventMatchesRecurrenceScope(anchor, anchor, "following")).toBe(
      true,
    );
    expect(googleEventMatchesRecurrenceScope(later, anchor, "following")).toBe(
      true,
    );
  });
});
