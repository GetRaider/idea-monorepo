"use client";

import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";

import {
  LIST_BOARD_STATUS_ORDER,
  resolveSingleListTasksSectionDrop,
} from "@/helpers/list-board.helper";
import {
  useBoardPointerSensors,
  type ListDraggableData,
  type ListDroppableData,
} from "@/lib/board-dnd";
import { TaskStatus, type Task, type TaskUpdate } from "@/types/task";

import type { BoardListSubmode } from "./useBoardListSubmode";

export interface UseListBoardDndOptions {
  tasksByStatus: Record<TaskStatus, Task[]>;
  submode: BoardListSubmode;
  onTaskStatusChange?: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onTaskFieldUpdate?: (taskId: string, patch: TaskUpdate) => void;
}

export function useListBoardDnd({
  tasksByStatus,
  submode,
  onTaskStatusChange,
  onTaskFieldUpdate,
}: UseListBoardDndOptions) {
  const sensors = useBoardPointerSensors();
  const [activeDragSection, setActiveDragSection] = useState<TaskStatus | null>(
    null,
  );

  const taskStatusById = useMemo(() => {
    const map = new Map<string, TaskStatus>();
    for (const status of LIST_BOARD_STATUS_ORDER) {
      for (const task of tasksByStatus[status] ?? []) {
        map.set(task.id, status);
      }
    }
    return map;
  }, [tasksByStatus]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const dropData = event.over?.data.current as
        | ListDroppableData
        | undefined;
      if (!dropData) {
        setActiveDragSection(null);
        return;
      }
      if (dropData.type === "reorder") {
        setActiveDragSection(dropData.status);
        return;
      }
      setActiveDragSection(taskStatusById.get(dropData.taskId) ?? null);
    },
    [taskStatusById],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragSection(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragSection(null);
      const { active, over } = event;
      if (!over) return;
      const dragData = active.data.current as ListDraggableData | undefined;
      const dropData = over.data.current as ListDroppableData | undefined;
      if (!dragData || !dropData) return;

      if (dropData.type === "subtask") {
        if (dragData.taskId === dropData.taskId) return;
        if (
          dragData.type === "subtask" &&
          dragData.parentTaskId === dropData.taskId
        ) {
          return;
        }
        if (dragData.type === "task" && dragData.hasChildren) return;
        onTaskFieldUpdate?.(dragData.taskId, {
          parentTaskId: dropData.taskId,
        });
        return;
      }

      if (dropData.type === "reorder") {
        const { index: rawTargetIndex } = dropData;
        const todoLen = tasksByStatus[TaskStatus.TODO]?.length ?? 0;
        const inProgressLen =
          tasksByStatus[TaskStatus.IN_PROGRESS]?.length ?? 0;
        const { targetStatus, targetIndex } =
          submode === "single" && dropData.status === TaskStatus.TODO
            ? resolveSingleListTasksSectionDrop(
                rawTargetIndex,
                todoLen,
                inProgressLen,
              )
            : {
                targetStatus: dropData.status,
                targetIndex: rawTargetIndex,
              };
        if (dragData.type === "subtask") {
          onTaskFieldUpdate?.(dragData.taskId, {
            parentTaskId: null,
            status: targetStatus,
          });
          return;
        }
        onTaskStatusChange?.(dragData.taskId, targetStatus, targetIndex);
      }
    },
    [onTaskFieldUpdate, onTaskStatusChange, submode, tasksByStatus],
  );

  return {
    sensors,
    activeDragSection,
    handleDragOver,
    handleDragCancel,
    handleDragEnd,
  };
}
