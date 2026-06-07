import type { EventApi, EventInput } from "@fullcalendar/core";

import type {
  CalendarEvent,
  CalendarEventType,
  CalendarRsvpStatus,
} from "@/types/calendar.types";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";

import type { CalendarColorTheme } from "./calendar-colors";
import {
  calendarChromeHex,
  eventFillHex,
  eventUsesCalendarStripe,
} from "./calendar-colors";
import { parseCalendarEventTypeOrDefault } from "./calendar-event-type";

export type CalendarEventColorTheme = CalendarColorTheme;

/** Common events created or synced via Google Calendar use `gcal:` ids. */
export function calendarCommonEventUsesGoogleCalendar(
  event: Pick<CalendarEvent, "id" | "type">,
): boolean {
  return (
    event.type === "common" &&
    event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)
  );
}

export function kindLabel(kind: CalendarEventType): string {
  switch (kind) {
    case "timeBlock":
      return "Time block";
    case "common":
      return "Common";
    case "task":
      return "Task";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Short label for compact timed events (single-line layout). */
export function kindTag(kind: CalendarEventType): string {
  switch (kind) {
    case "timeBlock":
      return "Block";
    case "common":
      return "Common";
    case "task":
      return "Task";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function fcEventRangeToScheduledPatch(
  event: EventApi,
): Pick<CalendarEvent, "start" | "end" | "allDay"> | null {
  const start = event.start;
  const end = event.end;
  if (!start || !end) return null;
  if (event.allDay) {
    const startLocal = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0,
    );
    const endExclusive = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      0,
      0,
      0,
      0,
    );
    const endLocal = new Date(endExclusive);
    endLocal.setDate(endLocal.getDate() - 1);
    endLocal.setHours(23, 59, 59, 999);
    return {
      allDay: true,
      start: startLocal.toISOString(),
      end: endLocal.toISOString(),
    };
  }
  return {
    allDay: false,
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function fcExclusiveEndDate(isoDateOnly: string): string {
  const d = new Date(`${isoDateOnly}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function scheduledEventRsvpStatus(
  event: CalendarEvent,
): CalendarRsvpStatus | undefined {
  if (event.type === "common" || event.type === "timeBlock") {
    return event.rsvpStatus;
  }
  return undefined;
}

function planningEventClassNames(
  stripeActive: boolean,
  rsvpStatus?: CalendarRsvpStatus,
): string[] | undefined {
  const classNames: string[] = [];
  if (stripeActive) classNames.push("tad-event-calendar-stripe");
  if (rsvpStatus === "no") classNames.push("tad-event-rsvp-no");
  else if (rsvpStatus === "maybe") classNames.push("tad-event-rsvp-maybe");
  return classNames.length > 0 ? classNames : undefined;
}

export function scheduledToEventInput(
  event: CalendarEvent,
  theme?: CalendarEventColorTheme,
): EventInput {
  const t = theme ?? {};
  const fill = eventFillHex(event, t);
  const stripe = calendarChromeHex(event, t);
  const stripeActive = eventUsesCalendarStripe(event, t);
  const startDay = event.start.slice(0, 10);
  const endDay = event.end.slice(0, 10);
  if (event.allDay) {
    const taskScope = event.type === "timeBlock" ? event.taskScope : undefined;
    const taskBoardId = event.type === "task" ? event.taskBoardId : undefined;
    const taskId = event.type === "task" ? event.taskId : undefined;
    const taskSummarySnapshot =
      event.type === "task" ? event.taskSummarySnapshot : undefined;
    const rsvpStatus = scheduledEventRsvpStatus(event);
    return {
      id: event.id,
      title: event.title,
      allDay: true,
      start: startDay,
      end: fcExclusiveEndDate(endDay),
      backgroundColor: fill,
      borderColor: fill,
      classNames: planningEventClassNames(stripeActive, rsvpStatus),
      extendedProps: {
        kind: event.type,
        taskScope,
        taskBoardId,
        taskId,
        taskSummarySnapshot,
        rsvpStatus,
        reminderMinutes: event.reminderMinutes,
        eventBodyFill: fill,
        eventCalendarBaseColor: stripe,
        useCalendarStripe: stripeActive,
      },
    };
  }
  const taskScope = event.type === "timeBlock" ? event.taskScope : undefined;
  const taskBoardId = event.type === "task" ? event.taskBoardId : undefined;
  const taskId = event.type === "task" ? event.taskId : undefined;
  const taskSummarySnapshot =
    event.type === "task" ? event.taskSummarySnapshot : undefined;
  const rsvpStatus = scheduledEventRsvpStatus(event);
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: false,
    backgroundColor: fill,
    borderColor: fill,
    classNames: planningEventClassNames(stripeActive, rsvpStatus),
    extendedProps: {
      kind: event.type,
      taskScope,
      taskBoardId,
      taskId,
      taskSummarySnapshot,
      rsvpStatus,
      reminderMinutes: event.reminderMinutes,
      eventBodyFill: fill,
      eventCalendarBaseColor: stripe,
      useCalendarStripe: stripeActive,
    },
  };
}

export function extendedPropsToKind(kind: unknown): CalendarEventType {
  return parseCalendarEventTypeOrDefault(kind);
}
