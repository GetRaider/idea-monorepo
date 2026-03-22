import { tasksHelper } from "@/helpers/task.helper";

import {
  Task,
  TaskStatus,
  createEmptyStatusBuckets,
  toTaskStatus,
} from "../types";

export function tasksIntoStatusColumns(
  tasks: Task[],
): Record<TaskStatus, Task[]> {
  const buckets = createEmptyStatusBuckets();
  for (const task of tasks) {
    const due = tasksHelper.date.parse(task.dueDate);
    if (due) {
      task.dueDate = due;
    }
    task.status = toTaskStatus(task.status);
    task.priority = tasksHelper.priority.format(task.priority);
    buckets[task.status].push(task);
  }
  return buckets;
}
