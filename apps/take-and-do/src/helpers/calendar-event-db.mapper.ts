import type {
  CalendarEvent,
  CommonCalendarEvent,
  TimeBlockCalendarEvent,
} from "@/types/calendar.types";

import type { calendarEventsTable } from "@/db/schemas/calendar-event.schema";

type CalendarEventRow = typeof calendarEventsTable.$inferSelect;

type Extra = {
  reminderMinutes?: number;
  timeZone?: string;
  repeat?: CommonCalendarEvent["repeat"];
  meetingUrl?: string;
  participants?: string[];
  notes?: string;
  description?: string;
  taskScope?: string[];
  rsvpStatus?: CommonCalendarEvent["rsvpStatus"];
  rsvpDeclineReason?: string;
};

function parseExtra(raw: unknown): Extra {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Extra;
}

export function calendarEventRowToClient(row: CalendarEventRow): CalendarEvent {
  const extra = parseExtra(row.extra);
  const base = {
    id: row.id,
    title: row.title,
    start: row.start.toISOString(),
    end: row.end.toISOString(),
    allDay: row.allDay,
    ...(row.color ? { color: row.color } : {}),
    ...(extra.reminderMinutes !== undefined
      ? { reminderMinutes: extra.reminderMinutes }
      : {}),
    ...(extra.timeZone ? { timeZone: extra.timeZone } : {}),
    ...(extra.repeat ? { repeat: extra.repeat } : {}),
    ...(extra.meetingUrl ? { meetingUrl: extra.meetingUrl } : {}),
    ...(extra.participants ? { participants: extra.participants } : {}),
    ...(extra.notes ? { notes: extra.notes } : {}),
    ...(extra.description ? { description: extra.description } : {}),
  };

  if (row.type === "timeBlock") {
    const ev: TimeBlockCalendarEvent = {
      ...base,
      type: "timeBlock",
      ...(extra.taskScope ? { taskScope: extra.taskScope } : {}),
    };
    return ev;
  }

  const ev: CommonCalendarEvent = {
    ...base,
    type: "common",
    ...(extra.rsvpStatus ? { rsvpStatus: extra.rsvpStatus } : {}),
    ...(extra.rsvpDeclineReason
      ? { rsvpDeclineReason: extra.rsvpDeclineReason }
      : {}),
  };
  return ev;
}

export function clientCalendarEventToExtra(
  event: CommonCalendarEvent | TimeBlockCalendarEvent,
): Extra {
  const extra: Extra = {};
  if (event.reminderMinutes !== undefined)
    extra.reminderMinutes = event.reminderMinutes;
  if (event.timeZone) extra.timeZone = event.timeZone;
  if (event.repeat) extra.repeat = event.repeat;
  if (event.type === "common") {
    if (event.meetingUrl) extra.meetingUrl = event.meetingUrl;
    if (event.participants) extra.participants = event.participants;
    if (event.notes) extra.notes = event.notes;
    if (event.description) extra.description = event.description;
    if (event.rsvpStatus) extra.rsvpStatus = event.rsvpStatus;
    if (event.rsvpDeclineReason)
      extra.rsvpDeclineReason = event.rsvpDeclineReason;
  } else {
    if (event.meetingUrl) extra.meetingUrl = event.meetingUrl;
    if (event.participants) extra.participants = event.participants;
    if (event.notes) extra.notes = event.notes;
    if (event.description) extra.description = event.description;
    if (event.taskScope) extra.taskScope = event.taskScope;
  }
  return extra;
}
