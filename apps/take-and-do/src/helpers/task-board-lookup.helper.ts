import { TaskStatus, type Task } from "@/types/task";
import type { TaskBoardWithTasks } from "@/types/workspace";

/**
 * Locates which status column holds a task id (top-level or nested subtask).
 * For subtasks, returns the parent row's column (`parent.status`).
 */
export function findTaskStatusInColumns(
  tasksByStatus: Record<TaskStatus, Task[]>,
  taskId: string,
): TaskStatus | null {
  for (const status of Object.values(TaskStatus)) {
    if (tasksByStatus[status].some((t) => t.id === taskId)) return status;
    for (const t of tasksByStatus[status]) {
      if (t.subtasks?.some((s) => s.id === taskId)) return t.status;
    }
  }
  return null;
}

/** Same as {@link findTaskStatusInColumns} but searches every board in order. */
export function findTaskStatusAcrossBoards(
  boards: TaskBoardWithTasks[],
  taskId: string,
): TaskStatus | null {
  for (const board of boards) {
    const found = findTaskStatusInColumns(board.tasks, taskId);
    if (found != null) return found;
  }
  return null;
}
