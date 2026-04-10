import { toast } from "sonner";

import { clientServices } from "@/services";
import type { TaskBoardWithTasks } from "@/types/workspace";

import { TaskStatus, Task } from "../types";

/**
 * Reorder a task within the same column
 */
export function reorderTaskInColumn(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
  newStatus: TaskStatus,
  targetIndex?: number,
): Record<TaskStatus, Task[]> {
  const updatedTasks: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: [...tasks[TaskStatus.TODO]],
    [TaskStatus.IN_PROGRESS]: [...tasks[TaskStatus.IN_PROGRESS]],
    [TaskStatus.DONE]: [...tasks[TaskStatus.DONE]],
  };

  const currentArray = updatedTasks[newStatus];
  const currentIndex = currentArray.findIndex((t) => t.id === taskId);

  if (currentIndex === -1) return tasks;

  // Calculate insert index (adjust if target is after current position)
  let insertIndex =
    typeof targetIndex === "number" &&
    targetIndex >= 0 &&
    targetIndex <= currentArray.length
      ? targetIndex
      : currentArray.length;

  // If inserting after the current position, adjust for removal
  if (insertIndex > currentIndex) {
    insertIndex -= 1;
  }

  // Remove from current position
  const [movedTask] = currentArray.splice(currentIndex, 1);

  // Insert at target position
  currentArray.splice(insertIndex, 0, movedTask);

  return updatedTasks;
}

/**
 * Move a task to a different status column (optimistic update)
 */
export function moveTaskToNewStatus(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
  newStatus: TaskStatus,
  currentTask: Task | undefined,
  targetIndex?: number,
): Record<TaskStatus, Task[]> {
  const updatedTasks: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: [...tasks[TaskStatus.TODO]],
    [TaskStatus.IN_PROGRESS]: [...tasks[TaskStatus.IN_PROGRESS]],
    [TaskStatus.DONE]: [...tasks[TaskStatus.DONE]],
  };

  let foundTask: Task | undefined;

  // Find and remove task from old status
  (Object.keys(updatedTasks) as TaskStatus[]).forEach((statusKey) => {
    const index = updatedTasks[statusKey].findIndex((t) => t.id === taskId);
    if (index !== -1) {
      foundTask = updatedTasks[statusKey][index];
      updatedTasks[statusKey] = updatedTasks[statusKey].filter(
        (t) => t.id !== taskId,
      );
    }
  });

  // Add task to new status
  const taskToAdd = foundTask || currentTask;
  if (taskToAdd) {
    const updatedTask: Task = {
      ...taskToAdd,
      status: newStatus,
    };
    const insertIndex =
      typeof targetIndex === "number" &&
      targetIndex >= 0 &&
      targetIndex <= updatedTasks[newStatus].length
        ? targetIndex
        : updatedTasks[newStatus].length;
    updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);
  }

  return updatedTasks;
}

/**
 * Reorder a task within the same column for a specific board
 */
export function reorderTaskInBoardColumn(
  boardsWithTasks: TaskBoardWithTasks[],
  taskId: string,
  newStatus: TaskStatus,
  currentBoardIndex: number,
  targetIndex?: number,
): TaskBoardWithTasks[] {
  return boardsWithTasks.map((board, boardIndex) => {
    if (boardIndex !== currentBoardIndex) return board;

    const updatedTasks = reorderTaskInColumn(
      board.tasks,
      taskId,
      newStatus,
      targetIndex,
    );

    return {
      ...board,
      tasks: updatedTasks,
    };
  });
}

/**
 * Move a task to a new status within a specific board (optimistic update)
 */
export function moveTaskToNewStatusInBoard(
  boardsWithTasks: TaskBoardWithTasks[],
  taskId: string,
  newStatus: TaskStatus,
  currentTask: Task | undefined,
  currentBoardIndex: number | undefined,
  targetIndex?: number,
): TaskBoardWithTasks[] {
  return boardsWithTasks.map((board, boardIndex) => {
    const updatedTasks: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [...(board.tasks[TaskStatus.TODO] || [])],
      [TaskStatus.IN_PROGRESS]: [
        ...(board.tasks[TaskStatus.IN_PROGRESS] || []),
      ],
      [TaskStatus.DONE]: [...(board.tasks[TaskStatus.DONE] || [])],
    };

    let foundTask: Task | undefined;
    let taskFoundInBoard = false;

    (Object.keys(updatedTasks) as TaskStatus[]).forEach((statusKey) => {
      const index = updatedTasks[statusKey].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        foundTask = updatedTasks[statusKey][index];
        updatedTasks[statusKey] = updatedTasks[statusKey].filter(
          (t) => t.id !== taskId,
        );
        taskFoundInBoard = true;
      }
    });

    if (taskFoundInBoard && foundTask) {
      const updatedTask: Task = {
        ...foundTask,
        status: newStatus,
      };
      const insertIndex =
        typeof targetIndex === "number" &&
        targetIndex >= 0 &&
        targetIndex <= updatedTasks[newStatus].length
          ? targetIndex
          : updatedTasks[newStatus].length;
      updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

      return {
        ...board,
        tasks: updatedTasks,
      };
    } else if (
      currentTask &&
      typeof currentBoardIndex === "number" &&
      currentBoardIndex === boardIndex
    ) {
      const updatedTask: Task = {
        ...currentTask,
        status: newStatus,
      };
      const insertIndex =
        typeof targetIndex === "number" &&
        targetIndex >= 0 &&
        targetIndex <= updatedTasks[newStatus].length
          ? targetIndex
          : updatedTasks[newStatus].length;
      updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

      return {
        ...board,
        tasks: updatedTasks,
      };
    }

    return board;
  });
}

/**
 * Find a task in a tasks record
 */
export function findTaskInTasks(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
): { task: Task | undefined; status: TaskStatus | undefined } {
  for (const statusKey of [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE,
  ]) {
    const task = tasks[statusKey].find((t) => t.id === taskId);
    if (task) {
      return { task, status: statusKey };
    }
  }
  return { task: undefined, status: undefined };
}

/**
 * Find a task across multiple boards (each with column buckets)
 */
export function findTaskInBoards(
  boardsWithTasks: TaskBoardWithTasks[],
  taskId: string,
): {
  task: Task | undefined;
  boardIndex: number | undefined;
} {
  for (let boardIndex = 0; boardIndex < boardsWithTasks.length; boardIndex++) {
    const board = boardsWithTasks[boardIndex];
    for (const statusKey of [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ]) {
      const task = board.tasks[statusKey].find((t) => t.id === taskId);
      if (task) {
        return { task, boardIndex };
      }
    }
  }
  return { task: undefined, boardIndex: undefined };
}

/**
 * Handle task status change for a single board
 */
export async function handleSingleBoardTaskStatusChange(
  tasks: Record<TaskStatus, Task[]>,
  setTasks: (tasks: Record<TaskStatus, Task[]>) => void,
  taskId: string,
  newStatus: TaskStatus,
  targetIndex?: number,
  updateTaskStatus?: (taskId: string, newStatus: TaskStatus) => Promise<void>,
): Promise<void> {
  const persistStatus =
    updateTaskStatus ??
    (async (id: string, status: TaskStatus) => {
      const updated = await clientServices.tasks.update({
        taskId: id,
        updates: { status },
      });
      if (!updated) toast.error("Can't update task status");
    });

  const { task: currentTask } = findTaskInTasks(tasks, taskId);

  if (!currentTask) {
    console.warn(`Task ${taskId} not found in current view`);
  }

  if (currentTask && currentTask.status === newStatus) {
    const updatedTasks = reorderTaskInColumn(
      tasks,
      taskId,
      newStatus,
      targetIndex,
    );
    setTasks(updatedTasks);
    return;
  }

  const optimisticTasks = moveTaskToNewStatus(
    tasks,
    taskId,
    newStatus,
    currentTask,
    targetIndex,
  );
  setTasks(optimisticTasks);

  await persistStatus(taskId, newStatus);

  const finalTasks = moveTaskToNewStatus(
    optimisticTasks,
    taskId,
    newStatus,
    currentTask,
    targetIndex,
  );
  setTasks(finalTasks);
}

/**
 * Handle task status change when several boards are shown at once
 */
export async function handleMultipleBoardsTaskStatusChange(
  boardsWithTasks: TaskBoardWithTasks[],
  setBoardsWithTasks: (boards: TaskBoardWithTasks[]) => void,
  taskId: string,
  newStatus: TaskStatus,
  targetIndex?: number,
  updateTaskStatus?: (taskId: string, newStatus: TaskStatus) => Promise<void>,
): Promise<void> {
  const persistStatus =
    updateTaskStatus ??
    (async (id: string, status: TaskStatus) => {
      const updated = await clientServices.tasks.update({
        taskId: id,
        updates: { status },
      });
      if (!updated) toast.error("Can't update task status");
    });

  const { task: currentTask, boardIndex: currentBoardIndex } = findTaskInBoards(
    boardsWithTasks,
    taskId,
  );

  if (!currentTask) {
    console.warn(`Task ${taskId} not found in current view`);
  }

  if (
    currentTask &&
    currentTask.status === newStatus &&
    typeof currentBoardIndex === "number"
  ) {
    const updated = reorderTaskInBoardColumn(
      boardsWithTasks,
      taskId,
      newStatus,
      currentBoardIndex,
      targetIndex,
    );
    setBoardsWithTasks(updated);
    return;
  }

  const optimistic = moveTaskToNewStatusInBoard(
    boardsWithTasks,
    taskId,
    newStatus,
    currentTask,
    currentBoardIndex,
    targetIndex,
  );
  setBoardsWithTasks(optimistic);

  await persistStatus(taskId, newStatus);

  const finalBoards = moveTaskToNewStatusInBoard(
    optimistic,
    taskId,
    newStatus,
    currentTask,
    currentBoardIndex,
    targetIndex,
  );
  setBoardsWithTasks(finalBoards);
}
