import {
  expandRecurrenceStarts,
  type CalendarEvent,
  type CalendarRsvpStatus,
  type Task,
  type TaskCalendarPreview,
} from "@repo/api/todex";

export function blocksForRange(
  events: CalendarEvent[],
  tasks: Task[],
  rangeStart: Date,
  rangeEnd: Date,
  previews: TaskCalendarPreview[] = [],
): CalendarBlock[] {
  return [
    ...eventBlocks(events, rangeStart, rangeEnd),
    ...taskBlocks(tasks, rangeStart, rangeEnd),
    ...previewBlocks(previews, rangeStart, rangeEnd),
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
          slotId: null,
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
        slotId: null,
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
  const summaryById = new Map(tasks.map((task) => [task.id, task.summary]));
  for (const task of tasks) {
    if (task.status === "done" || task.status === "cancelled") continue;
    const parentSummary = task.parentTaskId
      ? summaryById.get(task.parentTaskId)
      : undefined;
    const title = parentSummary
      ? `${parentSummary} / ${task.summary}`
      : task.summary;
    for (const slot of task.scheduleSlots) {
      if (slot.retiredAt) continue;
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);
      if (start >= rangeEnd || end <= rangeStart) continue;
      blocks.push({
        key: `task:${task.id}:${slot.id}`,
        kind: "task",
        eventId: null,
        taskId: task.id,
        slotId: slot.id,
        title,
        description: task.description,
        start,
        end,
        allDay: end.getTime() - start.getTime() >= 24 * 60 * 60_000,
        color: task.color,
        rsvpStatus: null,
        originalStart: null,
        readOnly: false,
        series: false,
        seriesEventId: null,
      });
    }
  }
  return blocks;
}

function previewBlocks(
  previews: TaskCalendarPreview[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarBlock[] {
  const blocks: CalendarBlock[] = [];
  for (const preview of previews) {
    preview.slots.forEach((slot, index) => {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);
      if (start >= rangeEnd || end <= rangeStart) return;
      blocks.push({
        key: `preview:${preview.occurrenceKey}:${index}`,
        kind: "preview",
        eventId: null,
        taskId: null,
        slotId: null,
        title: preview.title,
        description: "",
        start,
        end,
        allDay: end.getTime() - start.getTime() >= 24 * 60 * 60_000,
        color: null,
        rsvpStatus: null,
        originalStart: null,
        readOnly: true,
        series: true,
        seriesEventId: null,
      });
    });
  }
  return blocks;
}

export function visibleBlocks(
  blocks: CalendarBlock[],
  visibility: CalendarVisibility,
): CalendarBlock[] {
  return blocks.filter((block) =>
    block.kind === "event" ? visibility.events : visibility.tasks,
  );
}

export interface CalendarBlock {
  key: string;
  kind: "event" | "task" | "preview";
  eventId: string | null;
  taskId: string | null;
  slotId: string | null;
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
