import { TaskPriority, TaskStatus, type Task } from "@/types/task";

import type { TaskStats } from "@/app/overview/StatsCards/StatsCards";

export function deriveGuestTaskStats(tasks: Task[]): TaskStats {
  const flatTasks = flattenTasks(tasks);
  const now = new Date();

  return {
    total: flatTasks.length,
    todo: filterTasksByStatus(flatTasks, TaskStatus.TODO).length,
    inProgress: filterTasksByStatus(flatTasks, TaskStatus.IN_PROGRESS).length,
    done: filterTasksByStatus(flatTasks, TaskStatus.DONE).length,
    highPriority: flatTasks.filter(
      (task) => task.priority === TaskPriority.HIGH,
    ).length,
    overdue: flatTasks.filter((task) => {
      return (
        task.dueDate !== undefined &&
        task.dueDate < now &&
        task.status !== TaskStatus.DONE
      );
    }).length,
  };
}

function filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status);
}

function flattenTasks(tasks: Task[]): Task[] {
  const result: Task[] = [];

  for (const task of tasks) {
    result.push(task);
    if (task.subtasks?.length) {
      result.push(...flattenTasks(task.subtasks));
    }
  }

  return result;
}
