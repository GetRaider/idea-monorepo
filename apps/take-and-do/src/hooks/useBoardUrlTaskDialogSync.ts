"use client";

import { useCallback, useEffect, useRef } from "react";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { TaskStatus } from "@/components/Boards/KanbanBoard/types";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useTaskUrlPathname } from "./useKanbanTaskUrlSync";

export function useBoardUrlTaskDialogSync({
  boardName,
  tasksByStatus,
  isLoading,
  selectedTask,
  parentTask,
  setSelectedTask,
  setParentTask,
  handleCloseDialog,
  onTaskOpen,
}: BoardUrlTaskDialogSyncParams) {
  const pathname = useTaskUrlPathname();
  const suppressOpenForSig = useRef<string | null>(null);

  const handleCloseBoardDialog = useCallback(() => {
    const { taskKey, subtaskKey } = tasksUrlHelper.boardRoute.keysFromPathname(
      pathname,
      boardName,
    );
    if (taskKey) {
      suppressOpenForSig.current = tasksUrlHelper.boardRoute.keysSignature(
        taskKey,
        subtaskKey,
      );
    }
    handleCloseDialog();
  }, [pathname, boardName, handleCloseDialog]);

  useEffect(() => {
    const { taskKey, subtaskKey } = tasksUrlHelper.boardRoute.keysFromPathname(
      pathname,
      boardName,
    );

    if (!taskKey) {
      suppressOpenForSig.current = null;
      return;
    }
    if (isLoading) return;

    const sig = tasksUrlHelper.boardRoute.keysSignature(taskKey, subtaskKey);
    if (!selectedTask && suppressOpenForSig.current === sig) return;
    if (suppressOpenForSig.current && suppressOpenForSig.current !== sig) {
      suppressOpenForSig.current = null;
    }

    const { parent, task } = tasksUrlHelper.boardRoute.findTaskByUrlKeys(
      tasksByStatus,
      taskKey,
      subtaskKey,
    );
    if (!task) return;
    if (
      selectedTask?.id === task.id &&
      (parent?.id ?? null) === (parentTask?.id ?? null)
    ) {
      return;
    }

    suppressOpenForSig.current = null;
    setParentTask(parent);
    setSelectedTask(task);
    onTaskOpen?.(task);
  }, [
    pathname,
    boardName,
    isLoading,
    tasksByStatus,
    selectedTask,
    parentTask?.id,
    setParentTask,
    setSelectedTask,
    onTaskOpen,
  ]);

  return { handleCloseBoardDialog };
}

interface BoardUrlTaskDialogSyncParams {
  boardName: string;
  tasksByStatus: Record<TaskStatus, Task[]>;
  isLoading: boolean;
  selectedTask: Task | null;
  parentTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  setParentTask: (task: Task | null) => void;
  handleCloseDialog: () => void;
  onTaskOpen?: (task: Task) => void;
}
