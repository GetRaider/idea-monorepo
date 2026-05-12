import { toast } from "sonner";

import type {
  CalendarEvent,
  GoogleCalendarRecurrenceMeta,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

export async function deleteConnectedGoogleCalendarEvent(params: {
  id: string;
  recurrenceScope?: GoogleCalendarRecurrenceScope;
  googleRecurrence?: GoogleCalendarRecurrenceMeta;
  /** Instance times when `googleRecurrence.originalStart` is omitted (delete “following”). */
  start?: string;
  allDay?: boolean;
}): Promise<boolean> {
  const body: Record<string, unknown> = { id: params.id };
  if (params.recurrenceScope) body.recurrenceScope = params.recurrenceScope;
  if (params.googleRecurrence) body.googleRecurrence = params.googleRecurrence;
  if (params.start !== undefined) body.start = params.start;
  if (params.allDay !== undefined) body.allDay = params.allDay;

  const res = await fetch("/api/integrations/google-calendar/delete", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) return true;

  const parsed = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  toast.error(parsed?.error ?? "Could not delete Google Calendar event.");
  return false;
}

export async function createConnectedGoogleCalendarEvent(
  event: CalendarEvent,
): Promise<CalendarEvent | null> {
  if (event.type !== "common") return null;

  const body = {
    type: "common" as const,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    ...(event.timeZone?.trim() ? { timeZone: event.timeZone.trim() } : {}),
    description: event.description ?? "",
    notes: event.notes ?? "",
  };

  const res = await fetch("/api/integrations/google-calendar/create", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const parsed = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    toast.error(parsed?.error ?? "Could not create Google Calendar event.");
    return null;
  }

  const data = (await res.json()) as { event: CalendarEvent };
  return data.event;
}
