import {
  expandRecurrenceStarts,
  type CalendarEvent,
  type CalendarRsvpStatus,
  type Task,
} from "@repo/api/todex";

import { isMidnightSchedule } from "../tasks/task-helpers";

const DEFAULT_TASK_MINUTES = 30;

export function blocksForRange(
  events: CalendarEvent[],
  tasks: Task[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarBlock[] {
  return [
    ...eventBlocks(events, rangeStart, rangeEnd),
    ...taskBlocks(tasks, rangeStart, rangeEnd),
  ];
}

export function eventBlocks(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarBlock[] {
  const exceptions = events.filter((event) => event.seriesEventId);
  const blocks: CalendarBlock[] = [];
  for (const event of events) {
    if (event.seriesEventId || event.cancelled) continue;
    if (event.recurrence) {
      const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
      const starts = expandRecurrenceStarts({
        start: new Date(event.start),
        rule: event.recurrence,
        rangeStart,
        rangeEnd,
      });
      for (const start of starts) {
        const exception = exceptions.find(
          (item) =>
            item.seriesEventId === event.id &&
            item.originalStart != null &&
            new Date(item.originalStart).getTime() === start.getTime(),
        );
        if (exception?.cancelled) continue;
        const source = exception ?? event;
        blocks.push({
          key: `${source.id}@${start.toISOString()}`,
          kind: "event",
          eventId: source.id,
          taskId: null,
          title: source.title,
          description: "",
          start: exception ? new Date(exception.start) : start,
          end: exception
            ? new Date(exception.end)
            : new Date(start.getTime() + duration),
          allDay: source.allDay,
          color: source.color,
          rsvpStatus: source.rsvpStatus,
          originalStart: exception ? null : start.toISOString(),
          readOnly: !source.organizerSelf,
          series: true,
          seriesEventId: event.id,
        });
      }
      continue;
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (start < rangeEnd && end > rangeStart) {
      blocks.push({
        key: event.id,
        kind: "event",
        eventId: event.id,
        taskId: null,
        title: event.title,
        description: "",
        start,
        end,
        allDay: event.allDay,
        color: event.color,
        rsvpStatus: event.rsvpStatus,
        originalStart: null,
        readOnly: !event.organizerSelf,
        series: Boolean(event.rawRrule),
        seriesEventId: event.id,
      });
    }
  }
  return blocks;
}

function taskBlocks(tasks: Task[], rangeStart: Date, rangeEnd: Date): CalendarBlock[] {
  const blocks: CalendarBlock[] = [];
  for (const task of tasks) {
    if (
      !task.scheduleDate ||
      task.status === "done" ||
      task.status === "cancelled"
    ) {
      continue;
    }
    const start = new Date(task.scheduleDate);
    const allDay = isMidnightSchedule(task.scheduleDate);
    const minutes = allDay ? 24 * 60 : (task.estimation ?? DEFAULT_TASK_MINUTES);
    const end = new Date(start.getTime() + minutes * 60_000);
    if (start >= rangeEnd || end <= rangeStart) continue;
    blocks.push({
      key: `task:${task.id}`,
      kind: "task",
      eventId: null,
      taskId: task.id,
      title: task.summary,
      description: task.description,
      start,
      end,
      allDay,
      color: task.color,
      rsvpStatus: null,
      originalStart: null,
      readOnly: false,
      series: false,
      seriesEventId: null,
    });
  }
  return blocks;
}

export function visibleBlocks(
  blocks: CalendarBlock[],
  visibility: CalendarVisibility,
): CalendarBlock[] {
  return blocks.filter((block) =>
    block.kind === "task" ? visibility.tasks : visibility.events,
  );
}

export interface CalendarBlock {
  key: string;
  kind: "event" | "task";
  eventId: string | null;
  taskId: string | null;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string | null;
  rsvpStatus: CalendarRsvpStatus | null;
  originalStart: string | null;
  readOnly: boolean;
  series: boolean;
  seriesEventId: string | null;
}

export interface CalendarVisibility {
  events: boolean;
  tasks: boolean;
}
