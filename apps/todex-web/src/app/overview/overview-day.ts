import { TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  INBOX_BOARD_NAME,
  isClosedStatus,
  isUnscheduledTask,
} from "../tasks/task-helpers";

export function upcomingBounds(today: Date): DayRange {
  const start = startOfLocalDay(today);
  const from = addLocalDays(start, 1);
  const span = start.getDay() === 0 ? 1 : 7 - start.getDay();
  return { from, to: addLocalDays(from, span) };
}

export function localDays(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfLocalDay(from);
  const end = startOfLocalDay(to);
  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function overviewTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.status !== TaskStatus.CANCELLED)
    .sort((left, right) => scheduleTime(left) - scheduleTime(right));
}

export function organizingTasks(
  tasks: Task[],
  boardNameById: Map<string, string>,
): OrganizingTasks {
  const inbox = tasks
    .filter(
      (task) =>
        boardNameById.get(task.taskBoardId) === INBOX_BOARD_NAME &&
        !isClosedStatus(task.status),
    )
    .sort((left, right) => createdTime(right) - createdTime(left));
  const unscheduled = tasks
    .filter(
      (task) =>
        isUnscheduledTask(task) &&
        boardNameById.get(task.taskBoardId) !== INBOX_BOARD_NAME,
    )
    .sort((left, right) => createdTime(right) - createdTime(left));
  return { inbox, unscheduled };
}

export const UPCOMING_PREVIEW_LIMIT = 5;
export const ORGANIZING_PREVIEW_LIMIT = 8;
export const RECENT_DOCS_LIMIT = 8;

function createdTime(task: Task): number {
  const time = Date.parse(task.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

function scheduleTime(task: Task): number {
  if (!task.scheduleDate) return Number.POSITIVE_INFINITY;
  const time = Date.parse(task.scheduleDate);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

interface DayRange {
  from: Date;
  to: Date;
}

interface OrganizingTasks {
  inbox: Task[];
  unscheduled: Task[];
}
