import { TaskStatus } from "@repo/api/todex";
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

export function isSameLocalDay(iso: string | null, day: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}

export function startOfLocalDay(offsetDays = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export interface NestedTask extends Task {
  children: NestedTask[];
}
