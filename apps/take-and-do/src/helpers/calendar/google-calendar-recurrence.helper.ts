import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import type {
  CalendarEvent,
  GoogleCalendarRecurrenceMeta,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

function looksLikeGoogleOccurrenceSuffix(s: string): boolean {
  if (s.length < 7 || s.length > 56) return false;
  if (!/^20\d/.test(s)) return false;
  return /^[0-9A-Za-zTZ:.\+\-]+$/.test(s);
}

function parseOccurrenceSuffix(suffix: string): {
  originalStart: string;
  originalAllDay: boolean;
} | null {
  const trimmed = suffix.trim();
  if (!trimmed || !/^20\d/.test(trimmed)) return null;

  if (/^\d{8}$/.test(trimmed)) {
    return {
      originalStart: `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`,
      originalAllDay: true,
    };
  }

  const compactTimed =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})$/i.exec(trimmed);
  if (compactTimed) {
    const [, year, month, day, hour, minute, second, zoneTail] = compactTimed;
    const zone =
      zoneTail.toUpperCase() === "Z"
        ? "Z"
        : `${zoneTail.slice(0, 3)}:${zoneTail.slice(3)}`;
    return {
      originalStart: `${year}-${month}-${day}T${hour}:${minute}:${second}${zone}`,
      originalAllDay: false,
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { originalStart: trimmed, originalAllDay: true };
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    return {
      originalStart: new Date(parsedMs).toISOString().replace(/\.\d{3}Z$/, "Z"),
      originalAllDay: false,
    };
  }

  return null;
}

/** Parse `{recurringEventId}_{originalStart}` from a Google instance event id. */
export function parseGoogleGcalInstanceOccurrence(
  gcalEventId: string,
): GoogleCalendarRecurrenceMeta | null {
  if (!gcalEventId.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)) return null;
  const raw = gcalEventId.slice(GOOGLE_CALENDAR_EVENT_ID_PREFIX.length);
  for (let index = raw.length - 1; index >= 0; index--) {
    if (raw[index] !== "_") continue;
    const suffix = raw.slice(index + 1);
    if (!looksLikeGoogleOccurrenceSuffix(suffix)) continue;
    const parsed = parseOccurrenceSuffix(suffix);
    if (!parsed) continue;
    const recurringEventId = raw.slice(0, index);
    if (!recurringEventId) continue;
    return {
      recurringEventId,
      originalStart: parsed.originalStart,
      originalAllDay: parsed.originalAllDay,
    };
  }
  return null;
}

/** Master id for API writes — always derived from the clicked instance id when possible. */
export function resolveRecurringMasterId(
  gcalEventId: string,
  meta?: GoogleCalendarRecurrenceMeta,
): string | undefined {
  const fromPushInstance = parseGoogleGcalInstanceOccurrence(gcalEventId);
  if (fromPushInstance?.recurringEventId) {
    return fromPushInstance.recurringEventId;
  }
  const stored = meta?.recurringEventId?.trim();
  if (!stored) return undefined;
  const fromStoredInstance = parseGoogleGcalInstanceOccurrence(
    `${GOOGLE_CALENDAR_EVENT_ID_PREFIX}${stored}`,
  );
  return fromStoredInstance?.recurringEventId ?? stored;
}

export function resolveGoogleRecurrenceMeta(
  gcalEventId: string,
  meta?: GoogleCalendarRecurrenceMeta,
  fallback?: { start: string; allDay: boolean; timeZone?: string },
): GoogleCalendarRecurrenceMeta | undefined {
  const fromId = parseGoogleGcalInstanceOccurrence(gcalEventId);
  const recurringEventId = resolveRecurringMasterId(gcalEventId, meta);
  if (!recurringEventId) return undefined;

  const originalStart =
    fromId?.originalStart?.trim() ||
    meta?.originalStart?.trim() ||
    fallback?.start;
  if (!originalStart?.trim()) {
    return {
      recurringEventId,
      ...(meta?.splitGroupId?.trim()
        ? { splitGroupId: meta.splitGroupId.trim() }
        : {}),
    };
  }

  return {
    recurringEventId,
    originalStart,
    originalAllDay:
      fromId?.originalAllDay ??
      meta?.originalAllDay ??
      fallback?.allDay ??
      false,
    ...(meta?.splitGroupId?.trim()
      ? { splitGroupId: meta.splitGroupId.trim() }
      : {}),
  };
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
  return resolveGoogleRecurrenceMeta(event.id, event.googleRecurrence, {
    start: event.start,
    allDay: event.allDay,
    timeZone: event.timeZone,
  });
}

export function needsGoogleCalendarRecurrenceScope(
  event: CalendarEvent,
): boolean {
  return !!getEffectiveGoogleRecurrence(event)?.recurringEventId;
}

export function googleEventMatchesRecurrenceScope(
  event: CalendarEvent,
  anchor: CalendarEvent,
  scope: GoogleCalendarRecurrenceScope,
): boolean {
  if (scope === "instance") return event.id === anchor.id;

  const anchorMeta = getEffectiveGoogleRecurrence(anchor);
  const masterId = anchorMeta?.recurringEventId;
  if (!masterId) return event.id === anchor.id;

  const eventMeta = getEffectiveGoogleRecurrence(event);
  if (scope === "series") {
    const anchorSplitGroupId = anchorMeta.splitGroupId;
    if (anchorSplitGroupId && eventMeta?.splitGroupId === anchorSplitGroupId) {
      return true;
    }
    return eventMeta?.recurringEventId === masterId;
  }

  if (eventMeta?.recurringEventId !== masterId) return false;

  const anchorStart = anchorMeta.originalStart ?? anchor.start;
  const eventStart = eventMeta.originalStart ?? event.start;
  const anchorMs = new Date(anchorStart).getTime();
  const eventMs = new Date(eventStart).getTime();
  if (Number.isNaN(anchorMs) || Number.isNaN(eventMs)) return false;
  return eventMs >= anchorMs;
}

/** Fields safe to mirror across recurring instances (not start/end). */
export function googleRecurrenceSeriesLocalPatchKeys(): ReadonlySet<string> {
  return new Set([
    "title",
    "description",
    "notes",
    "meetingUrl",
    "participants",
    "timeZone",
    "repeat",
    "reminderMinutes",
    "rsvpStatus",
    "rsvpDeclineReason",
    "color",
  ]);
}
