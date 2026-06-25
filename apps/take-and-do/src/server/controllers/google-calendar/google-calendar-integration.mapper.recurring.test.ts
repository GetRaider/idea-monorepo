import { describe, expect, it } from "vitest";

import {
  adjustPatchBodyForRecurringMaster,
  prepareSeriesMasterPushPatch,
  pushBodyChangesSeriesSchedule,
  resolvePushGoogleRecurrenceFromBody,
} from "./google-calendar-integration.mapper";

describe("resolvePushGoogleRecurrenceFromBody", () => {
  it("normalizes wall-clock originalStart using event timeZone", () => {
    const resolved = resolvePushGoogleRecurrenceFromBody({
      id: "gcal:master123_20250520T140000Z",
      type: "common",
      title: "Weekly",
      start: "2025-05-20T14:00:00.000Z",
      end: "2025-05-20T15:00:00.000Z",
      allDay: false,
      timeZone: "UTC",
      googleRecurrence: {
        recurringEventId: "master123",
        originalStart: "2025-05-20T10:00:00",
      },
    });

    expect(resolved?.originalStart).toBe("2025-05-20T14:00:00Z");
  });
});

describe("adjustPatchBodyForRecurringMaster", () => {
  const pushBody = {
    id: "gcal:master123_20250520T140000Z",
    type: "common" as const,
    title: "Updated",
    start: "2025-05-20T14:00:00.000Z",
    end: "2025-05-20T15:00:00.000Z",
    allDay: false,
    timeZone: "America/New_York",
  };

  it("omits start/end when master timed fields cannot be parsed", () => {
    const patchBody = {
      summary: "Updated",
      start: { dateTime: "2025-05-20T10:00:00", timeZone: "America/New_York" },
      end: { dateTime: "2025-05-20T11:00:00", timeZone: "America/New_York" },
    };
    const adjusted = adjustPatchBodyForRecurringMaster(
      patchBody,
      { start: { date: "2025-05-20" }, end: { date: "2025-05-21" } },
      {
        recurringEventId: "master123",
        originalStart: "2025-05-20T14:00:00Z",
        originalAllDay: false,
      },
      pushBody,
    );

    expect(adjusted.summary).toBe("Updated");
    expect(adjusted).not.toHaveProperty("start");
    expect(adjusted).not.toHaveProperty("end");
  });

  it("shifts master wall times by the instance delta", () => {
    const patchBody = {
      summary: "Updated",
      start: { dateTime: "2025-05-20T11:00:00", timeZone: "America/New_York" },
      end: { dateTime: "2025-05-20T12:00:00", timeZone: "America/New_York" },
    };
    const adjusted = adjustPatchBodyForRecurringMaster(
      patchBody,
      {
        start: {
          dateTime: "2025-05-06T10:00:00",
          timeZone: "America/New_York",
        },
        end: {
          dateTime: "2025-05-06T11:00:00",
          timeZone: "America/New_York",
        },
      },
      {
        recurringEventId: "master123",
        originalStart: "2025-05-20T14:00:00Z",
        originalAllDay: false,
      },
      {
        ...pushBody,
        start: "2025-05-20T15:00:00.000Z",
        end: "2025-05-20T16:00:00.000Z",
      },
    );

    expect(adjusted.start).toEqual({
      dateTime: "2025-05-06T11:00:00",
      timeZone: "America/New_York",
    });
    expect(adjusted.end).toEqual({
      dateTime: "2025-05-06T12:00:00",
      timeZone: "America/New_York",
    });
  });
});

describe("pushBodyChangesSeriesSchedule", () => {
  const meta = {
    recurringEventId: "master123",
    originalStart: "2025-05-20T14:00:00Z",
    originalAllDay: false,
  };

  it("returns false when only metadata changed on the same occurrence", () => {
    expect(
      pushBodyChangesSeriesSchedule(
        {
          start: "2025-05-20T14:00:00.000Z",
          end: "2025-05-20T15:00:00.000Z",
          allDay: false,
          timeZone: "UTC",
        },
        meta,
      ),
    ).toBe(false);
  });

  it("returns true when the occurrence start moved", () => {
    expect(
      pushBodyChangesSeriesSchedule(
        {
          start: "2025-05-20T15:00:00.000Z",
          end: "2025-05-20T16:00:00.000Z",
          allDay: false,
          timeZone: "UTC",
        },
        meta,
      ),
    ).toBe(true);
  });
});

describe("prepareSeriesMasterPushPatch", () => {
  it("omits start/end and keeps colorId for a color-only all-events update", () => {
    const patchBody = {
      summary: "Weekly",
      colorId: "11",
      start: { dateTime: "2025-05-20T10:00:00", timeZone: "UTC" },
      end: { dateTime: "2025-05-20T11:00:00", timeZone: "UTC" },
    };
    const prepared = prepareSeriesMasterPushPatch(
      patchBody,
      {
        start: {
          dateTime: "2025-05-06T10:00:00",
          timeZone: "UTC",
        },
        end: {
          dateTime: "2025-05-06T11:00:00",
          timeZone: "UTC",
        },
      },
      {
        recurringEventId: "master123",
        originalStart: "2025-05-20T14:00:00Z",
        originalAllDay: false,
      },
      {
        id: "gcal:master123_20250520T140000Z",
        type: "common",
        title: "Weekly",
        start: "2025-05-20T14:00:00.000Z",
        end: "2025-05-20T15:00:00.000Z",
        allDay: false,
        timeZone: "UTC",
        color: "#d50000",
      },
    );

    expect(prepared.colorId).toBe("11");
    expect(prepared).not.toHaveProperty("start");
    expect(prepared).not.toHaveProperty("end");
  });
});
