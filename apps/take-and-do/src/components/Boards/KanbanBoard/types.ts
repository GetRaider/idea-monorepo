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
  return Object.values(TaskStatus).includes(status as TaskStatus)
    ? (status as TaskStatus)
    : TaskStatus.TODO;
}

export function createEmptyStatusBuckets(): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
}
