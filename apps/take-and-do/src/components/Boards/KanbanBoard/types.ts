import { TaskPriority, TaskStatus } from "@/constants/tasks.constants";

export { TaskPriority, TaskStatus };

export interface Task {
  id: string;
  taskBoardId: string;
  taskKey?: string;
  summary: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels?: string[];
  dueDate?: Date;
  estimation?: number;
  subtasks?: Task[];
  scheduleDate?: Date;
}

/**
 * Type for task updates where nullable fields can be explicitly set to null.
 * Use null to clear a field, undefined means "don't change".
 */
export type TaskUpdate = Partial<
  Omit<Task, "dueDate" | "estimation" | "scheduleDate">
> & {
  dueDate?: Date | null;
  estimation?: number | null;
  scheduleDate?: Date | null;
};

export const emptyTaskColumns: Record<TaskStatus, Task[]> = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

export function toTaskStatus(status: unknown): TaskStatus {
  if (typeof status !== "string") return TaskStatus.TODO;
  for (const value of Object.values(TaskStatus)) {
    if (status === value) return value;
  }
  return TaskStatus.TODO;
}

export function toTaskPriority(priority: unknown): TaskPriority {
  if (priority === TaskPriority.LOW || priority === "low")
    return TaskPriority.LOW;
  if (priority === TaskPriority.MEDIUM || priority === "medium")
    return TaskPriority.MEDIUM;
  if (priority === TaskPriority.HIGH || priority === "high")
    return TaskPriority.HIGH;
  if (priority === TaskPriority.CRITICAL || priority === "critical")
    return TaskPriority.CRITICAL;
  return TaskPriority.MEDIUM;
}

export function createEmptyStatusBuckets(): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
}
