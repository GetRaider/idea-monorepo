import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

export const STATUS_ORDER = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
] as const;

export const STATUS_LABEL: Record<Task["status"], string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

export function nestTasks(tasks: Task[]): NestedTask[] {
  const byId = new Map<string, NestedTask>(
    tasks.map((task) => [task.id, { ...task, children: [] }]),
  );
  const roots: NestedTask[] = [];
  for (const task of byId.values()) {
    if (task.parentTaskId && byId.has(task.parentTaskId)) {
      byId.get(task.parentTaskId)!.children.push(task);
    } else {
      roots.push(task);
    }
  }
  return roots;
}

export function groupRootsByStatus(
  roots: NestedTask[],
): Record<Task["status"], NestedTask[]> {
  const groups: Record<Task["status"], NestedTask[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
  for (const root of roots) {
    groups[root.status].push(root);
  }
  return groups;
}

export function startOfLocalDay(offsetDays = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export function localDayScheduleQuery(offsetDays = 0): {
  scheduleFrom: string;
  scheduleTo: string;
} {
  return {
    scheduleFrom: startOfLocalDay(offsetDays).toISOString(),
    scheduleTo: startOfLocalDay(offsetDays + 1).toISOString(),
  };
}

export function dateInputToLocalDayStartIso(
  yearMonthDay: string,
): string | null {
  if (!yearMonthDay) return null;
  const [yearText, monthText, dayText] = yearMonthDay.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatScheduleLabel(
  iso: string | null,
  now = new Date(),
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startTarget.getTime() - startToday.getTime()) / MS_PER_DAY,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return startTarget.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const PRIORITY_LABEL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

export const DEFAULT_LIST_SORT: ListSortState = {
  enabled: false,
  field: "title",
  direction: "asc",
};

export function compareTasksForListSort(
  left: Task,
  right: Task,
  field: ListSortField,
): number {
  if (field === "title") {
    return left.summary.localeCompare(right.summary, undefined, {
      sensitivity: "base",
    });
  }
  if (field === "schedule") {
    const leftTime = left.scheduleDate ? Date.parse(left.scheduleDate) : null;
    const rightTime = right.scheduleDate
      ? Date.parse(right.scheduleDate)
      : null;
    if (leftTime == null && rightTime == null) return 0;
    if (leftTime == null) return 1;
    if (rightTime == null) return -1;
    return leftTime - rightTime;
  }
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
}

export function sortNestedTasks(
  nodes: NestedTask[],
  sort: ListSortState,
): NestedTask[] {
  if (!sort.enabled) return nodes;
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...nodes].sort(
    (left, right) =>
      direction * compareTasksForListSort(left, right, sort.field),
  );
}

export function sortGroupsByListSort(
  groups: Record<Task["status"], NestedTask[]>,
  sort: ListSortState,
): Record<Task["status"], NestedTask[]> {
  return {
    [TaskStatus.TODO]: sortNestedTasks(groups[TaskStatus.TODO], sort),
    [TaskStatus.IN_PROGRESS]: sortNestedTasks(
      groups[TaskStatus.IN_PROGRESS],
      sort,
    ),
    [TaskStatus.DONE]: sortNestedTasks(groups[TaskStatus.DONE], sort),
  };
}

export function subtaskCompletion(childTasks: Task[]): SubtaskCompletion {
  const done = childTasks.filter(
    (child) => child.status === TaskStatus.DONE,
  ).length;
  return { done, total: childTasks.length };
}

const PRIORITY_RANK: Record<Task["priority"], number> = {
  [TaskPriority.LOW]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.HIGH]: 2,
  [TaskPriority.CRITICAL]: 3,
};

export interface NestedTask extends Task {
  children: NestedTask[];
}

export interface SubtaskCompletion {
  done: number;
  total: number;
}

export type ListSortField = "title" | "schedule" | "priority";
export type ListSortDirection = "asc" | "desc";
export interface ListSortState {
  enabled: boolean;
  field: ListSortField;
  direction: ListSortDirection;
}
