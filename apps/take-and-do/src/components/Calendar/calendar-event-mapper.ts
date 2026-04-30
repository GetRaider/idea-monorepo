import type { EventApi, EventInput } from "@fullcalendar/core";

import type {
  CalendarEventKind,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

export function kindLabel(kind: CalendarEventKind): string {
  switch (kind) {
    case "time_block":
      return "Time block";
    case "mutual":
      return "Mutual";
    case "task_event":
      return "Task";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function kindColor(kind: CalendarEventKind): string {
  switch (kind) {
    case "time_block":
      return "#5b4dba";
    case "mutual":
      return "#0d9488";
    case "task_event":
      return "#d97706";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function fcExclusiveEndDate(isoDateOnly: string): string {
  const d = new Date(`${isoDateOnly}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function fcEventRangeToScheduledPatch(
  event: EventApi,
): Pick<CalendarScheduledEvent, "start" | "end" | "allDay"> | null {
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

export function scheduledToEventInput(
  event: CalendarScheduledEvent,
): EventInput {
  const startDay = event.start.slice(0, 10);
  const endDay = event.end.slice(0, 10);
  if (event.allDay) {
    return {
      id: event.id,
      title: event.title,
      allDay: true,
      start: startDay,
      end: fcExclusiveEndDate(endDay),
      backgroundColor: kindColor(event.kind),
      borderColor: kindColor(event.kind),
      extendedProps: {
        kind: event.kind,
        taskScope: event.taskScope,
        attendeesNote: event.attendeesNote,
        linkedTaskSummary: event.linkedTaskSummary,
      },
    };
  }
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: false,
    backgroundColor: kindColor(event.kind),
    borderColor: kindColor(event.kind),
    extendedProps: {
      kind: event.kind,
      taskScope: event.taskScope,
      attendeesNote: event.attendeesNote,
      linkedTaskSummary: event.linkedTaskSummary,
    },
  };
}
