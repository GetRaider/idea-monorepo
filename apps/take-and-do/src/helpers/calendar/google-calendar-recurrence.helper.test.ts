import { describe, expect, it } from "vitest";

import type { CalendarEvent } from "@/types/calendar.types";

import {
  getEffectiveGoogleRecurrence,
  googleEventMatchesRecurrenceScope,
  parseGoogleGcalInstanceOccurrence,
  resolveGoogleRecurrenceMeta,
  resolveRecurringMasterId,
} from "./google-calendar-recurrence.helper";

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

describe("parseGoogleGcalInstanceOccurrence", () => {
  it("parses compact timed suffix from Google instance ids", () => {
    expect(
      parseGoogleGcalInstanceOccurrence("gcal:master123_20250520T100000Z"),
    ).toEqual({
      recurringEventId: "master123",
      originalStart: "2025-05-20T10:00:00Z",
      originalAllDay: false,
    });
  });

  it("parses ISO-like timed suffix", () => {
    expect(
      parseGoogleGcalInstanceOccurrence("gcal:master123_2025-05-20T10:00:00Z"),
    ).toEqual({
      recurringEventId: "master123",
      originalStart: "2025-05-20T10:00:00Z",
      originalAllDay: false,
    });
  });
});

describe("getEffectiveGoogleRecurrence", () => {
  it("uses instance id suffix when originalStart is missing and event was moved", () => {
    const event = gcalEvent(
      "master123_20250520T100000Z",
      "2025-05-21T11:00:00.000Z",
      "master123",
    );
    expect(getEffectiveGoogleRecurrence(event)).toEqual({
      recurringEventId: "master123",
      originalStart: "2025-05-20T10:00:00Z",
      originalAllDay: false,
    });
  });
});

describe("resolveRecurringMasterId", () => {
  it("derives master id from the clicked instance id even when stored metadata is wrong", () => {
    expect(
      resolveRecurringMasterId("gcal:master123_20250520T140000Z", {
        recurringEventId: "master123_20250520T140000Z",
      }),
    ).toBe("master123");
  });
});

describe("resolveGoogleRecurrenceMeta", () => {
  it("prefers instance id suffix over stored wall-clock originalStart", () => {
    expect(
      resolveGoogleRecurrenceMeta(
        "gcal:master123_20250520T140000Z",
        {
          recurringEventId: "master123",
          originalStart: "2025-05-20T10:00:00",
        },
        { start: "2025-05-21T11:00:00.000Z", allDay: false },
      ),
    ).toEqual({
      recurringEventId: "master123",
      originalStart: "2025-05-20T14:00:00Z",
      originalAllDay: false,
    });
  });
});

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

  it("series scope matches split segments linked by splitGroupId", () => {
    const head = {
      ...anchor,
      googleRecurrence: {
        recurringEventId: "headMaster",
        splitGroupId: "root123",
      },
    };
    const tail = {
      ...later,
      id: "gcal:tailMaster_20250527T100000Z",
      googleRecurrence: {
        recurringEventId: "tailMaster",
        splitGroupId: "root123",
      },
    };

    expect(googleEventMatchesRecurrenceScope(tail, head, "series")).toBe(true);
    expect(googleEventMatchesRecurrenceScope(earlier, head, "series")).toBe(
      true,
    );
    expect(googleEventMatchesRecurrenceScope(otherSeries, head, "series")).toBe(
      false,
    );
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

  it("following scope uses id suffix when originalStart is missing", () => {
    const movedAnchor = gcalEvent(
      "master123_20250520T100000Z",
      "2025-05-21T11:00:00.000Z",
      master,
    );
    const laterWithoutOriginalStart = gcalEvent(
      "master123_20250527T100000Z",
      "2025-05-27T10:00:00.000Z",
      master,
    );
    expect(
      googleEventMatchesRecurrenceScope(
        laterWithoutOriginalStart,
        movedAnchor,
        "following",
      ),
    ).toBe(true);
  });
});
