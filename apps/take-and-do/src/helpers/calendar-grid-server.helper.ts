import type {
  CalendarEvent,
  CommonCalendarEvent,
  TimeBlockCalendarEvent,
} from "@/types/calendar.types";
import type { CalendarEventCreateBody } from "@/db/dtos/calendar-events.dto";

const GCAL_PREFIX = "gcal:";

export function calendarEventUsesApiStorage(
  ev: CalendarEvent,
  isGuest: boolean,
): boolean {
  if (isGuest) return false;
  if (ev.id.startsWith(GCAL_PREFIX)) return false;
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
  };
}

export function userCalendarEventToPatchBody(
  ev: CommonCalendarEvent | TimeBlockCalendarEvent,
) {
  const full = userCalendarEventToCreateBody(ev);
  const { id: _omit, ...patch } = full;
  return patch;
}
