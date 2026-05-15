import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import type {
  CalendarEvent,
  GoogleCalendarRecurrenceMeta,
} from "@/types/calendar.types";

function looksLikeGoogleOccurrenceSuffix(s: string): boolean {
  if (s.length < 7 || s.length > 56) return false;
  if (!/^20\d/.test(s)) return false;
  return /^[0-9A-Za-zTZ:.\+\-]+$/.test(s);
}

function inferGoogleRecurrenceFromGcalInstanceId(
  event: CalendarEvent & { type: "common" },
): GoogleCalendarRecurrenceMeta | undefined {
  const raw = event.id.slice(GOOGLE_CALENDAR_EVENT_ID_PREFIX.length);
  for (let i = raw.length - 1; i >= 0; i--) {
    if (raw[i] !== "_") continue;
    const suffix = raw.slice(i + 1);
    if (!looksLikeGoogleOccurrenceSuffix(suffix)) continue;
    const recurringEventId = raw.slice(0, i);
    if (!recurringEventId) continue;
    return {
      recurringEventId,
      originalStart: event.start,
      originalAllDay: event.allDay,
    };
  }
  return undefined;
}

/**
 * Recurrence metadata for API calls, merging stored Google fields with fallbacks.
 * Covers rows where sync omitted `recurringEventId` but the event id is still an instance id.
 */
export function getEffectiveGoogleRecurrence(
  event: CalendarEvent,
): GoogleCalendarRecurrenceMeta | undefined {
  if (
    event.type !== "common" ||
    !event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)
  )
    return undefined;
  const gr = event.googleRecurrence;
  if (gr?.recurringEventId) {
    if (gr.originalStart?.trim()) return gr;
    return {
      recurringEventId: gr.recurringEventId,
      originalStart: event.start,
      originalAllDay: gr.originalAllDay ?? event.allDay,
    };
  }
  return inferGoogleRecurrenceFromGcalInstanceId(event);
}

export function needsGoogleCalendarRecurrenceScope(
  event: CalendarEvent,
): boolean {
  return !!getEffectiveGoogleRecurrence(event)?.recurringEventId;
}
