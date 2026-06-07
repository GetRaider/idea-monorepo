import { describe, expect, it } from "vitest";

import type { CalendarEvent } from "@/types/calendar.types";

import { googlePushColorIfChanged } from "./google-calendar-sync-actions";

function commonEvent(id: string, color?: string): CalendarEvent {
  return {
    id,
    type: "common",
    title: "Meet",
    start: "2025-06-01T10:00:00.000Z",
    end: "2025-06-01T11:00:00.000Z",
    allDay: false,
    ...(color ? { color } : {}),
  };
}

describe("googlePushColorIfChanged", () => {
  it("returns undefined when color is unchanged", () => {
    const event = commonEvent("gcal:abc", "#039be5");
    expect(googlePushColorIfChanged(event, event)).toBeUndefined();
  });

  it("returns null when color is cleared", () => {
    const previous = commonEvent("gcal:abc", "#039be5");
    const next = commonEvent("gcal:abc");
    expect(googlePushColorIfChanged(next, previous)).toBeNull();
  });

  it("returns hex when color changed", () => {
    const previous = commonEvent("gcal:abc", "#039be5");
    const next = commonEvent("gcal:abc", "#d50000");
    expect(googlePushColorIfChanged(next, previous)).toBe("#d50000");
  });
});
