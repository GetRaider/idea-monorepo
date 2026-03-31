export {
  type Task,
  type TaskUpdate,
  TaskStatus,
  TaskPriority,
  toTaskStatus,
  toTaskPriority,
} from "@/types/task";

import { TaskStatus } from "@/types/task";
import type { Task } from "@/types/task";

export const emptyTaskColumns: Record<TaskStatus, Task[]> = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

export function createEmptyStatusBuckets(): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
}
