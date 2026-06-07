import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import type { CalendarEventCreateBody } from "@/db/dtos/calendar-events.dto";
import type {
  CalendarEvent,
  CommonCalendarEvent,
  TimeBlockCalendarEvent,
} from "@/types/calendar.types";

export function calendarEventUsesApiStorage(
  ev: CalendarEvent,
  isGuest: boolean,
): boolean {
  if (isGuest) return false;
  if (ev.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)) return false;
  if (ev.type === "task") return false;
  return ev.type === "common" || ev.type === "timeBlock";
}

export function userCalendarEventToCreateBody(
  ev: CommonCalendarEvent | TimeBlockCalendarEvent,
): CalendarEventCreateBody {
  const color = (ev as { color?: string }).color;
  const base: CalendarEventCreateBody = {
    id: ev.id,
    type: ev.type,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    allDay: ev.allDay,
    color: color ?? null,
    reminderMinutes: ev.reminderMinutes,
    timeZone: ev.timeZone,
    repeat: ev.repeat,
  };
  if (ev.type === "common") {
    return {
      ...base,
      meetingUrl: ev.meetingUrl,
      participants: ev.participants,
      notes: ev.notes,
      description: ev.description,
      rsvpStatus: ev.rsvpStatus,
      rsvpDeclineReason: ev.rsvpDeclineReason,
    };
  }
  return {
    ...base,
    meetingUrl: ev.meetingUrl,
    participants: ev.participants,
    notes: ev.notes,
    description: ev.description,
    taskScope: ev.taskScope,
    rsvpStatus: ev.rsvpStatus,
    rsvpDeclineReason: ev.rsvpDeclineReason,
  };
}

export function userCalendarEventToPatchBody(
  ev: CommonCalendarEvent | TimeBlockCalendarEvent,
) {
  const full = userCalendarEventToCreateBody(ev);
  const { id: _omit, ...patch } = full;
  return patch;
}
