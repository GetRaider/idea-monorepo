import { tasksService } from "@/services/api/tasks.service";
import { TaskStatus, Task, TaskGroup } from "../types";

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
 * Reorder a task within the same column for a specific group
 */
export function reorderTaskInGroupColumn(
  taskGroups: TaskGroup[],
  taskId: string,
  newStatus: TaskStatus,
  currentGroupIndex: number,
  targetIndex?: number,
): TaskGroup[] {
  return taskGroups.map((group, groupIndex) => {
    // Only process the group that contains the task
    if (groupIndex !== currentGroupIndex) return group;

    const updatedTasks = reorderTaskInColumn(
      group.tasks,
      taskId,
      newStatus,
      targetIndex,
    );

    return {
      ...group,
      tasks: updatedTasks,
    };
  });
}

/**
 * Move a task to a new status within a specific group (optimistic update)
 */
export function moveTaskToNewStatusInGroup(
  taskGroups: TaskGroup[],
  taskId: string,
  newStatus: TaskStatus,
  currentTask: Task | undefined,
  currentGroupIndex: number | undefined,
  targetIndex?: number,
): TaskGroup[] {
  return taskGroups.map((group, groupIndex) => {
    const updatedTasks: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [...(group.tasks[TaskStatus.TODO] || [])],
      [TaskStatus.IN_PROGRESS]: [
        ...(group.tasks[TaskStatus.IN_PROGRESS] || []),
      ],
      [TaskStatus.DONE]: [...(group.tasks[TaskStatus.DONE] || [])],
    };

    let foundTask: Task | undefined;
    let taskFoundInGroup = false;

    // Find and remove task from old status (in this group)
    (Object.keys(updatedTasks) as TaskStatus[]).forEach((statusKey) => {
      const index = updatedTasks[statusKey].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        foundTask = updatedTasks[statusKey][index];
        updatedTasks[statusKey] = updatedTasks[statusKey].filter(
          (t) => t.id !== taskId,
        );
        taskFoundInGroup = true;
      }
    });

    // Only update if task was found in this group, or if we have currentTask and this is the right group
    if (taskFoundInGroup && foundTask) {
      // Task was found in this group, add it to new status
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
        ...group,
        tasks: updatedTasks,
      };
    } else if (
      currentTask &&
      typeof currentGroupIndex === "number" &&
      currentGroupIndex === groupIndex
    ) {
      // Task wasn't in this group's arrays yet, but currentTask exists and this is the correct group
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
        ...group,
        tasks: updatedTasks,
      };
    }

    // Task not in this group, return unchanged
    return group;
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
 * Find a task in task groups
 */
export function findTaskInGroups(
  taskGroups: TaskGroup[],
  taskId: string,
): {
  task: Task | undefined;
  groupIndex: number | undefined;
} {
  for (let groupIndex = 0; groupIndex < taskGroups.length; groupIndex++) {
    const group = taskGroups[groupIndex];
    for (const statusKey of [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ]) {
      const task = group.tasks[statusKey].find((t) => t.id === taskId);
      if (task) {
        return { task, groupIndex };
      }
    }
  }
  return { task: undefined, groupIndex: undefined };
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
): Promise<void> {
  try {
    const { task: currentTask } = findTaskInTasks(tasks, taskId);

    if (!currentTask) {
      console.warn(`Task ${taskId} not found in current view`);
    }

    // If status hasn't changed, handle reordering within the same column
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

    // OPTIMISTIC UPDATE: Update local state immediately for smooth animation
    const optimisticTasks = moveTaskToNewStatus(
      tasks,
      taskId,
      newStatus,
      currentTask,
      targetIndex,
    );
    setTasks(optimisticTasks);

    // Update task status via API (after optimistic update for smooth UX)
    await tasksService.update(taskId, { status: newStatus });

    // Update state after API call (in case of any server-side changes)
    const finalTasks = moveTaskToNewStatus(
      optimisticTasks,
      taskId,
      newStatus,
      currentTask,
      targetIndex,
    );
    setTasks(finalTasks);
  } catch (error) {
    console.error("Failed to update task status:", error);
    // Optionally show an error message to the user
  }
}

/**
 * Handle task status change for multiple boards (task groups)
 */
export async function handleMultipleBoardsTaskStatusChange(
  taskGroups: TaskGroup[],
  setTaskGroups: (groups: TaskGroup[]) => void,
  taskId: string,
  newStatus: TaskStatus,
  targetIndex?: number,
): Promise<void> {
  try {
    const { task: currentTask, groupIndex: currentGroupIndex } =
      findTaskInGroups(taskGroups, taskId);

    if (!currentTask) {
      console.warn(`Task ${taskId} not found in current view`);
    }

    // If status hasn't changed, handle reordering within the same column
    if (
      currentTask &&
      currentTask.status === newStatus &&
      typeof currentGroupIndex === "number"
    ) {
      const updatedGroups = reorderTaskInGroupColumn(
        taskGroups,
        taskId,
        newStatus,
        currentGroupIndex,
        targetIndex,
      );
      setTaskGroups(updatedGroups);
      return;
    }

    // OPTIMISTIC UPDATE: Update local state immediately for smooth animation
    const optimisticGroups = moveTaskToNewStatusInGroup(
      taskGroups,
      taskId,
      newStatus,
      currentTask,
      currentGroupIndex,
      targetIndex,
    );
    setTaskGroups(optimisticGroups);

    // Update task status via API (after optimistic update for smooth UX)
    await tasksService.update(taskId, { status: newStatus });

    // Update state after API call (in case of any server-side changes)
    const finalGroups = moveTaskToNewStatusInGroup(
      optimisticGroups,
      taskId,
      newStatus,
      currentTask,
      currentGroupIndex,
      targetIndex,
    );
    setTaskGroups(finalGroups);
  } catch (error) {
    console.error("Failed to update task status:", error);
    // Optionally show an error message to the user
  }
}
