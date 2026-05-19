import { toast } from "sonner";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import { clientServices } from "@/services";
import type { ApiResult } from "@/services/api-result.types";
import type {
  CalendarEvent,
  GoogleCalendarRecurrenceMeta,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

import { getEffectiveGoogleRecurrence } from "./google-calendar-recurrence.helper";

function toastApiFailure(result: ApiResult<unknown>, fallback: string): void {
  if (result.ok) return;
  if (
    result.kind === "http" &&
    result.body &&
    typeof result.body === "object"
  ) {
    const msg = (result.body as { error?: string }).error;
    if (typeof msg === "string" && msg.trim()) {
      toast.error(msg);
      return;
    }
  }
  toast.error(fallback);
}

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

  const result =
    await clientServices.googleCalendarIntegration.deleteEvent(body);
  if (result.ok) return true;
  toastApiFailure(result, "Could not delete Google Calendar event.");
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
    ...(event.repeat ? { repeat: event.repeat } : {}),
  };

  const result =
    await clientServices.googleCalendarIntegration.createEvent(body);
  if (result.ok && result.data) return result.data.event;
  toastApiFailure(result, "Could not create Google Calendar event.");
  return null;
}

export async function pushConnectedGoogleCalendarEvent(
  event: CalendarEvent,
  recurrenceScope?: GoogleCalendarRecurrenceScope,
): Promise<boolean> {
  if (
    event.type !== "common" ||
    !event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)
  )
    return true;

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
    ...(event.repeat ? { repeat: event.repeat } : {}),
    ...(event.rsvpStatus ? { rsvpStatus: event.rsvpStatus } : {}),
  };

  if (recurrenceScope) {
    body.recurrenceScope = recurrenceScope;
  }
  const effectiveGr = getEffectiveGoogleRecurrence(event);
  if (recurrenceScope && recurrenceScope !== "instance" && effectiveGr) {
    body.googleRecurrence = effectiveGr;
  }

  const result = await clientServices.googleCalendarIntegration.pushEvent(body);
  if (result.ok) return true;
  toastApiFailure(
    result,
    "Could not update Google Calendar. Try reconnecting in Settings.",
  );
  return false;
}
