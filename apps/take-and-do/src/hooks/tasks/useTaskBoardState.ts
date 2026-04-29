import { useState, useCallback } from "react";
import {
  Task,
  TaskStatus,
  TaskUpdate,
} from "@/components/Boards/KanbanBoard/types";

interface UseTaskBoardStateReturn {
  selectedTask: Task | null;
  parentTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  setParentTask: (task: Task | null) => void;
  handleTaskClick: (task: Task) => void;
  handleCloseDialog: () => void;
  handleSubtaskClick: (subtask: Task) => void;
}

export function useTaskBoardState(): UseTaskBoardStateReturn {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setParentTask(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedTask(null);
    setParentTask(null);
  }, []);

  const handleSubtaskClick = useCallback(
    (subtask: Task) => {
      setParentTask(selectedTask);
      setSelectedTask(subtask);
    },
    [selectedTask],
  );

  return {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseDialog,
    handleSubtaskClick,
  };
}

/**
 * Updates a task within a status-grouped task record.
 * Handles both top-level tasks and subtasks.
 */
export function updateTaskInColumns(
  tasks: Record<TaskStatus, Task[]>,
  updatedTask: Task,
): Record<TaskStatus, Task[]> {
  const newTasks = { ...tasks };

  // Check if this is a top-level task
  const isTopLevelTask = Object.values(newTasks).some((taskList) =>
    taskList.some((t) => t.id === updatedTask.id),
  );

  if (isTopLevelTask) {
    // Remove from old status, add to new status
    for (const status of Object.values(TaskStatus)) {
      newTasks[status] = newTasks[status].filter(
        (task) => task.id !== updatedTask.id,
      );
    }
    newTasks[updatedTask.status].push(updatedTask);
  } else {
    for (const status of Object.values(TaskStatus)) {
      newTasks[status] = newTasks[status].map((task) => {
        if (task.subtasks?.some((subtask) => subtask.id === updatedTask.id)) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === updatedTask.id ? updatedTask : subtask,
            ),
          };
        }
        return task;
      });
    }
  }

  return newTasks;
}

/**
 * Apply a non-structural patch (status, priority, schedule, etc.) optimistically
 * to a task in the local tree. Returns the input untouched if the task can't be
 * found. Re-parent patches must use {@link applyOptimisticReparent} instead.
 */
export function applyOptimisticPatch(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
  patch: Omit<TaskUpdate, "parentTaskId">,
): Record<TaskStatus, Task[]> {
  const located = locateTask(tasks, taskId);
  if (!located) return tasks;
  const merged: Task = {
    ...located.task,
    ...(patch.summary !== undefined && { summary: patch.summary }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.priority !== undefined && { priority: patch.priority }),
    ...(patch.labels !== undefined && { labels: patch.labels }),
    ...(patch.dueDate !== undefined && {
      dueDate: patch.dueDate ?? undefined,
    }),
    ...(patch.estimation !== undefined && {
      estimation: patch.estimation ?? undefined,
    }),
    ...(patch.scheduleDate !== undefined && {
      scheduleDate: patch.scheduleDate ?? undefined,
    }),
  };
  return updateTaskInColumns(tasks, merged);
}

/**
 * Apply a re-parent optimistically to the local task tree. Locates the task
 * (top-level or subtask), removes it from its current spot, applies the patch,
 * and inserts it into the new spot:
 *  - `parentTaskId === null` → top-level of its (possibly new) status.
 *  - `parentTaskId === someId` → appended to that target's `subtasks`.
 *
 * Returns the original tree unchanged if the source task can't be found or the
 * target parent isn't visible. Callers should refetch on API failure to make
 * sure the local tree reconciles with the server.
 */
export function applyOptimisticReparent(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
  patch: TaskUpdate,
): Record<TaskStatus, Task[]> {
  const located = locateTask(tasks, taskId);
  if (!located) return tasks;

  const { task: source } = located;
  const updatedTask: Task = {
    ...source,
    ...(patch.summary !== undefined && { summary: patch.summary }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.priority !== undefined && { priority: patch.priority }),
    ...(patch.labels !== undefined && { labels: patch.labels }),
    ...(patch.dueDate !== undefined && {
      dueDate: patch.dueDate ?? undefined,
    }),
    ...(patch.estimation !== undefined && {
      estimation: patch.estimation ?? undefined,
    }),
    ...(patch.scheduleDate !== undefined && {
      scheduleDate: patch.scheduleDate ?? undefined,
    }),
  };

  const stripped = removeTaskFromColumns(tasks, taskId);
  if (patch.parentTaskId === null) {
    return {
      ...stripped,
      [updatedTask.status]: [...stripped[updatedTask.status], updatedTask],
    };
  }
  const targetParentId = patch.parentTaskId;
  const next: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: stripped[TaskStatus.TODO],
    [TaskStatus.IN_PROGRESS]: stripped[TaskStatus.IN_PROGRESS],
    [TaskStatus.DONE]: stripped[TaskStatus.DONE],
  };
  let attached = false;
  for (const status of Object.values(TaskStatus)) {
    next[status] = next[status].map((parent) => {
      if (parent.id !== targetParentId) return parent;
      attached = true;
      return {
        ...parent,
        subtasks: [...(parent.subtasks ?? []), updatedTask],
      };
    });
  }
  // Target parent not visible — fall back to returning the original tree so the
  // refetch (kicked off by the caller) is the source of truth.
  return attached ? next : tasks;
}

interface LocatedTask {
  task: Task;
  parentId: string | null;
  status: TaskStatus;
}

function locateTask(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
): LocatedTask | null {
  for (const status of Object.values(TaskStatus)) {
    for (const t of tasks[status]) {
      if (t.id === taskId) return { task: t, parentId: null, status };
      const sub = t.subtasks?.find((s) => s.id === taskId);
      if (sub) return { task: sub, parentId: t.id, status };
    }
  }
  return null;
}

export function removeTaskFromColumns(
  tasks: Record<TaskStatus, Task[]>,
  taskId: string,
): Record<TaskStatus, Task[]> {
  const newTasks = { ...tasks };
  for (const status of Object.values(TaskStatus)) {
    newTasks[status] = newTasks[status]
      .filter((t) => t.id !== taskId)
      .map((t) => ({
        ...t,
        subtasks: t.subtasks?.filter((s) => s.id !== taskId),
      }));
  }
  return newTasks;
}
