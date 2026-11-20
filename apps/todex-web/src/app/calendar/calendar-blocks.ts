import {
  expandRecurrenceStarts,
  type CalendarEvent,
  type CalendarRsvpStatus,
  type ExecutionCalendar,
  type Space,
  type Task,
  type TaskCalendarPreview,
} from "@repo/api/todex";

import {
  sessionDisplayTitle,
  splitIntervalAtLocalMidnight,
} from "./calendar-actual";

export const NEUTRAL_BLOCK_COLOR = "#7c7c86";

export function blocksForRange(
  events: CalendarEvent[],
  tasks: Task[],
  sessions: ExecutionCalendar["sessions"],
  spaces: Space[],
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
  timeZone: string,
  previews: TaskCalendarPreview[] = [],
): CalendarBlock[] {
  return [
    ...eventBlocks(events, spaces, rangeStart, rangeEnd),
    ...taskBlocks(tasks, events, spaces, rangeStart, rangeEnd),
    ...previewBlocks(previews, rangeStart, rangeEnd),
    ...sessionBlocks(sessions, rangeStart, rangeEnd, now, timeZone),
  ];
}

export function eventBlocks(
  events: CalendarEvent[],
  spaces: Space[],
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
        blocks.push(
          plannedBlock({
            key: `${source.id}@${start.toISOString()}`,
            kind: "event",
            eventId: source.id,
            taskId: null,
            slotId: null,
            title: source.title,
            start: exception ? new Date(exception.start) : start,
            end: exception
              ? new Date(exception.end)
              : new Date(start.getTime() + duration),
            allDay: source.allDay,
            color: spaceColor(source.spaceId, spaces),
            rsvpStatus: source.rsvpStatus,
            originalStart: exception ? null : start.toISOString(),
            readOnly: !source.organizerSelf,
            series: true,
            seriesEventId: event.id,
            spaceId: source.spaceId,
          }),
        );
      }
      continue;
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (start < rangeEnd && end > rangeStart) {
      blocks.push(
        plannedBlock({
          key: event.id,
          kind: "event",
          eventId: event.id,
          taskId: null,
          slotId: null,
          title: event.title,
          start,
          end,
          allDay: event.allDay,
          color: spaceColor(event.spaceId, spaces),
          rsvpStatus: event.rsvpStatus,
          originalStart: null,
          readOnly: !event.organizerSelf,
          series: Boolean(event.rawRrule),
          seriesEventId: event.id,
          spaceId: event.spaceId,
        }),
      );
    }
  }
  return blocks;
}

export function visibleBlocks(
  blocks: CalendarBlock[],
  visibility: CalendarVisibility,
  mode: CalendarMode,
): CalendarBlock[] {
  return blocks.filter((block) => {
    if (mode === "planned" && block.lane === "actual") return false;
    if (mode === "actual" && block.lane === "planned") return false;
    if (block.kind === "session") return true;
    if (block.kind === "task" || block.kind === "preview") return visibility.tasks;
    return visibility.events;
  });
}

function taskBlocks(
  tasks: Task[],
  events: CalendarEvent[],
  spaces: Space[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarBlock[] {
  const scopedTaskIds = taskIdsCoveredByEvents(events);
  const blocks: CalendarBlock[] = [];
  const summaryById = new Map(tasks.map((task) => [task.id, task.summary]));
  for (const task of tasks) {
    if (
      task.status === "done" ||
      task.status === "cancelled" ||
      scopedTaskIds.has(task.id)
    ) {
      continue;
    }
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
      blocks.push(
        plannedBlock({
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
          color: spaceColor(task.spaceId, spaces),
          rsvpStatus: null,
          originalStart: null,
          readOnly: false,
          series: false,
          seriesEventId: null,
          spaceId: task.spaceId,
        }),
      );
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
      blocks.push(
        plannedBlock({
          key: `preview:${preview.occurrenceKey}:${index}`,
          kind: "preview",
          eventId: null,
          taskId: null,
          slotId: null,
          title: preview.title,
          start,
          end,
          allDay: end.getTime() - start.getTime() >= 24 * 60 * 60_000,
          color: NEUTRAL_BLOCK_COLOR,
          rsvpStatus: null,
          originalStart: null,
          readOnly: true,
          series: true,
          seriesEventId: null,
          spaceId: null,
        }),
      );
    });
  }
  return blocks;
}

function sessionBlocks(
  sessions: ExecutionCalendar["sessions"],
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
  timeZone: string,
): CalendarBlock[] {
  const blocks: CalendarBlock[] = [];
  for (const session of sessions) {
    const title = sessionDisplayTitle(session);
    session.slices.forEach((slice, sliceIndex) => {
      const pieces = splitIntervalAtLocalMidnight(slice, timeZone, now);
      pieces.forEach((piece, pieceIndex) => {
        if (piece.start >= rangeEnd || piece.end <= rangeStart) return;
        blocks.push({
          key: `session:${session.id}:${sliceIndex}:${pieceIndex}`,
          kind: "session",
          lane: "actual",
          eventId: null,
          taskId: null,
          slotId: null,
          sessionId: session.id,
          title,
          description: "",
          start: piece.start,
          end: piece.end,
          allDay: false,
          color: session.color,
          rsvpStatus: null,
          originalStart: null,
          readOnly: true,
          series: false,
          seriesEventId: null,
          spaceId: session.spaceId,
        });
      });
    });
  }
  return blocks;
}

function plannedBlock(
  block: Omit<CalendarBlock, "lane" | "sessionId" | "description"> & {
    description?: string;
  },
): CalendarBlock {
  return {
    ...block,
    description: block.description ?? "",
    lane: "planned",
    sessionId: null,
  };
}

export function taskIdsCoveredByEvents(events: CalendarEvent[]) {
  return new Set(
    events.flatMap((event) => (event.cancelled ? [] : event.taskScope)),
  );
}

function spaceColor(spaceId: string | null, spaces: Space[]) {
  if (!spaceId) return NEUTRAL_BLOCK_COLOR;
  return spaces.find((space) => space.id === spaceId)?.color ?? NEUTRAL_BLOCK_COLOR;
}

export interface CalendarBlock {
  key: string;
  kind: "event" | "task" | "session" | "preview";
  lane: "planned" | "actual";
  eventId: string | null;
  taskId: string | null;
  slotId: string | null;
  sessionId: string | null;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  rsvpStatus: CalendarRsvpStatus | null;
  originalStart: string | null;
  readOnly: boolean;
  series: boolean;
  seriesEventId: string | null;
  spaceId: string | null;
}

export interface CalendarVisibility {
  events: boolean;
  tasks: boolean;
}

export type CalendarMode = "planned" | "actual" | "both";
