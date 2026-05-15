"use client";

import type { CalendarEvent, TaskCalendarEvent } from "@/types/calendar.types";

import { readCalendarState, writeCalendarState } from "./calendar-storage";

/** Dispatched after {@link applyTaskScheduleToPersistedCalendar} mutates localStorage. */
export const CALENDAR_STATE_EXTERNAL_UPDATE_EVENT =
  "take-and-do:calendar-state-external-update";

function notifyCalendarStateExternallyUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CALENDAR_STATE_EXTERNAL_UPDATE_EVENT));
}

const DEFAULT_TASK_DURATION_MS = 60 * 60 * 1000;

function isTaskCalendarEvent(e: CalendarEvent): e is TaskCalendarEvent {
  return e.type === "task";
}

/**
 * Keeps local planning-calendar task blocks aligned with `task.scheduleDate`
 * after the task is updated from boards / task view (calendar already updates
 * the task when a linked block moves).
 */
export function applyTaskScheduleToPersistedCalendar(input: {
  taskId: string;
  taskBoardId: string;
  taskTitle: string;
  scheduleDate: Date | null | undefined;
}): void {
  if (typeof window === "undefined") return;

  const { taskId, taskBoardId, taskTitle, scheduleDate } = input;
  const prev = readCalendarState();

  const linked = prev.events.filter(
    (e): e is TaskCalendarEvent =>
      isTaskCalendarEvent(e) && e.taskId === taskId,
  );

  const clear = scheduleDate == null || Number.isNaN(scheduleDate.getTime());

  if (clear) {
    if (linked.length === 0) return;
    writeCalendarState({
      ...prev,
      events: prev.events.filter(
        (e) => !(isTaskCalendarEvent(e) && e.taskId === taskId),
      ),
    });
    notifyCalendarStateExternallyUpdated();
    return;
  }

  if (linked.length === 0) return;

  const start = new Date(scheduleDate);
  let durationMs = DEFAULT_TASK_DURATION_MS;
  const first = linked[0];
  const es = new Date(first.start).getTime();
  const ee = new Date(first.end).getTime();
  if (Number.isFinite(es) && Number.isFinite(ee) && ee > es) {
    durationMs = ee - es;
  }
  const end = new Date(start.getTime() + durationMs);

  const updated: TaskCalendarEvent = {
    ...first,
    taskBoardId: taskBoardId || first.taskBoardId,
    title: taskTitle,
    taskSummarySnapshot: taskTitle,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: false,
  };

  const nextEvents: CalendarEvent[] = [
    ...prev.events.filter(
      (e) => !(isTaskCalendarEvent(e) && e.taskId === taskId),
    ),
    updated,
  ];

  writeCalendarState({ ...prev, events: nextEvents });
  notifyCalendarStateExternallyUpdated();
}
