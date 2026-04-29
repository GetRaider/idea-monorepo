import { tasksHelper } from "@/helpers/task.helper";
import { TaskPriority, TaskStatus, type Task } from "@/types/task";

export type ListSortField = "title" | "schedule" | "priority";
export type ListSortDirection = "asc" | "desc";

export interface ListSortState {
  /** When false, tasks render in their natural (server / creation) order. */
  enabled: boolean;
  field: ListSortField;
  direction: ListSortDirection;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.LOW]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.HIGH]: 2,
  [TaskPriority.CRITICAL]: 3,
};

function compareTitles(a: Task, b: Task): number {
  return a.summary.localeCompare(b.summary, undefined, { sensitivity: "base" });
}

function compareSchedules(a: Task, b: Task): number {
  const aTime = tasksHelper.date.getTime(a.scheduleDate);
  const bTime = tasksHelper.date.getTime(b.scheduleDate);
  if (aTime == null && bTime == null) return 0;
  if (aTime == null) return 1;
  if (bTime == null) return -1;
  return aTime - bTime;
}

function comparePriorities(a: Task, b: Task): number {
  return (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0);
}

const COMPARATORS: Record<ListSortField, (a: Task, b: Task) => number> = {
  title: compareTitles,
  schedule: compareSchedules,
  priority: comparePriorities,
};

export function sortTasksForList(tasks: Task[], state: ListSortState): Task[] {
  if (!state.enabled) return tasks;
  const compare = COMPARATORS[state.field];
  const direction = state.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => direction * compare(a, b));
}

export function sortTaskColumnsForList(
  tasksByStatus: Record<TaskStatus, Task[]>,
  sort: ListSortState,
): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: sortTasksForList(tasksByStatus[TaskStatus.TODO], sort),
    [TaskStatus.IN_PROGRESS]: sortTasksForList(
      tasksByStatus[TaskStatus.IN_PROGRESS],
      sort,
    ),
    [TaskStatus.DONE]: sortTasksForList(tasksByStatus[TaskStatus.DONE], sort),
  };
}
