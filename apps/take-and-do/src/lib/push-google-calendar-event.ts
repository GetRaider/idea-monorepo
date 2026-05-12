import { toast } from "sonner";

import type {
  CalendarEvent,
  GoogleCalendarRecurrenceMeta,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

const GCAL_PREFIX = "gcal:";

function looksLikeGoogleOccurrenceSuffix(s: string): boolean {
  if (s.length < 7 || s.length > 56) return false;
  if (!/^20\d/.test(s)) return false;
  return /^[0-9A-Za-zTZ:.\+\-]+$/.test(s);
}

function inferGoogleRecurrenceFromGcalInstanceId(
  event: CalendarEvent & { type: "common" },
): GoogleCalendarRecurrenceMeta | undefined {
  const raw = event.id.slice(GCAL_PREFIX.length);
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
  if (event.type !== "common" || !event.id.startsWith(GCAL_PREFIX))
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

export async function pushConnectedGoogleCalendarEvent(
  event: CalendarEvent,
  recurrenceScope?: GoogleCalendarRecurrenceScope,
): Promise<boolean> {
  if (event.type !== "common" || !event.id.startsWith(GCAL_PREFIX)) return true;

  const body: Record<string, unknown> = {
    id: event.id,
    type: "common",
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    description: event.description ?? "",
    notes: event.notes ?? "",
    ...(event.timeZone?.trim() ? { timeZone: event.timeZone.trim() } : {}),
  };

  if (recurrenceScope) {
    body.recurrenceScope = recurrenceScope;
  }
  const effectiveGr = getEffectiveGoogleRecurrence(event);
  if (recurrenceScope && recurrenceScope !== "instance" && effectiveGr) {
    body.googleRecurrence = effectiveGr;
  }

  const res = await fetch("/api/integrations/google-calendar/push", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) return true;

  const parsed = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  toast.error(
    parsed?.error ??
      "Could not update Google Calendar. Try reconnecting in Settings.",
  );
  return false;
}
