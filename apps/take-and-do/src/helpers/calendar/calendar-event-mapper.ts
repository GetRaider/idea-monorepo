import type { EventApi, EventInput } from "@fullcalendar/core";

import type { CalendarEvent, CalendarEventType } from "@/types/calendar.types";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";

import {
  calendarStripeHex,
  eventFillHex,
  eventUsesCalendarStripe,
} from "./calendar-colors";

export type CalendarEventColorTheme = {
  kindColors?: Partial<Record<CalendarEventType, string>>;
  googleCalendarColor?: string;
};

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

export function kindColor(kind: CalendarEventType): string {
  switch (kind) {
    case "timeBlock":
      return "#4f46b8";
    case "common":
      return "#0f766e";
    case "task":
      return "#b45309";
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

function migrateKindProp(kind: unknown): CalendarEventType {
  if (kind === "timeBlock" || kind === "common" || kind === "task") return kind;
  // Back-compat for older persisted / imported values.
  if (kind === "time_block") return "timeBlock";
  if (kind === "general" || kind === "mutual") return "common";
  if (kind === "task_event") return "task";
  return "timeBlock";
}

export function scheduledToEventInput(
  event: CalendarEvent,
  theme?: CalendarEventColorTheme,
): EventInput {
  const t = theme ?? {};
  const fill = eventFillHex(event, t);
  const stripe = calendarStripeHex(event, t);
  const stripeActive = eventUsesCalendarStripe(event, t);
  const startDay = event.start.slice(0, 10);
  const endDay = event.end.slice(0, 10);
  if (event.allDay) {
    const taskScope = event.type === "timeBlock" ? event.taskScope : undefined;
    const taskBoardId = event.type === "task" ? event.taskBoardId : undefined;
    const taskId = event.type === "task" ? event.taskId : undefined;
    const taskSummarySnapshot =
      event.type === "task" ? event.taskSummarySnapshot : undefined;
    const rsvpStatus = event.type === "common" ? event.rsvpStatus : undefined;
    return {
      id: event.id,
      title: event.title,
      allDay: true,
      start: startDay,
      end: fcExclusiveEndDate(endDay),
      backgroundColor: fill,
      borderColor: fill,
      classNames: stripeActive ? ["tad-event-calendar-stripe"] : undefined,
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
  const rsvpStatus = event.type === "common" ? event.rsvpStatus : undefined;
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: false,
    backgroundColor: fill,
    borderColor: fill,
    classNames: stripeActive ? ["tad-event-calendar-stripe"] : undefined,
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
  return migrateKindProp(kind);
}
