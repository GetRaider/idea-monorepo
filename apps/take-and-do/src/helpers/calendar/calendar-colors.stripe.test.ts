import { describe, expect, it } from "vitest";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import type { CalendarEvent } from "@/types/calendar.types";

import {
  calendarChromeHex,
  effectiveGoogleCalendarColor,
  eventFillHex,
} from "./calendar-colors";

describe("calendarChromeHex vs eventFillHex", () => {
  const theme = { googleCalendarColor: "#0d9488" };

  const gcalEvent: CalendarEvent = {
    id: `${GOOGLE_CALENDAR_EVENT_ID_PREFIX}abc`,
    type: "common",
    title: "Meet",
    start: "2025-06-01T10:00:00.000Z",
    end: "2025-06-01T11:00:00.000Z",
    allDay: false,
    color: "#d50000",
  };

  it("keeps stripe on calendar chrome when event has custom color", () => {
    expect(calendarChromeHex(gcalEvent, theme)).toBe(
      effectiveGoogleCalendarColor(theme.googleCalendarColor),
    );
    expect(eventFillHex(gcalEvent, theme)).not.toBe(
      eventFillHex({ ...gcalEvent, color: undefined }, theme),
    );
  });
});
