"use client";

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { Column } from "../Column/Column";
import { TaskCardView } from "../TaskCard/TaskCard";
import { TaskStatus, Task } from "../types";
import type {
  KanbanCardDraggableData,
  KanbanDraggableData,
  KanbanDroppableData,
} from "./kanbanDnd";

interface KanbanColumnsProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  columnBodyScrolls?: boolean;
  /** Optional slot rendered at the top of the To Do column (e.g. quick-create cell). */
  todoTopSlot?: ReactNode;
  /**
   * Called on drop. `targetIndex` is the position the card should be inserted at
   * within `newStatus`.
   */
  onTaskDrop: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanColumns({
  tasksByStatus,
  columnBodyScrolls = true,
  todoTopSlot,
  onTaskDrop,
  onTaskClick,
}: KanbanColumnsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const [activeDropStatus, setActiveDropStatus] = useState<TaskStatus | null>(
    null,
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    for (const status of Object.values(TaskStatus)) {
      const found = tasksByStatus[status].find((t) => t.id === activeTaskId);
      if (found) return found;
    }
    return null;
  }, [activeTaskId, tasksByStatus]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | KanbanCardDraggableData
      | undefined;
    if (data?.type === "card") setActiveTaskId(data.taskId);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const dropData = event.over?.data.current as
      | KanbanDroppableData
      | undefined;
    setActiveDropStatus(dropData?.type === "reorder" ? dropData.status : null);
  }, []);

  const resetDragState = useCallback(() => {
    setActiveDropStatus(null);
    setActiveTaskId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      resetDragState();
      const { active, over } = event;
      if (!over) return;
      const dragData = active.data.current as KanbanDraggableData | undefined;
      const dropData = over.data.current as KanbanDroppableData | undefined;
      if (!dragData || !dropData) return;
      if (dropData.type !== "reorder") return;
      onTaskDrop(dragData.taskId, dropData.status, dropData.index);
    },
    [onTaskDrop, resetDragState],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      // Auto-scroll vertically only — the columns sit inside an overflow-x
      // scroller and we don't want the page to drift sideways during a drag.
      autoScroll={{ threshold: { x: 0, y: 0.15 } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={resetDragState}
      onDragEnd={handleDragEnd}
    >
      <Column
        status={TaskStatus.TODO}
        tasks={tasksByStatus[TaskStatus.TODO]}
        bodyScrolls={columnBodyScrolls}
        topSlot={todoTopSlot}
        isActiveDrop={activeDropStatus === TaskStatus.TODO}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.IN_PROGRESS}
        tasks={tasksByStatus[TaskStatus.IN_PROGRESS]}
        bodyScrolls={columnBodyScrolls}
        isActiveDrop={activeDropStatus === TaskStatus.IN_PROGRESS}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.DONE}
        tasks={tasksByStatus[TaskStatus.DONE]}
        bodyScrolls={columnBodyScrolls}
        isActiveDrop={activeDropStatus === TaskStatus.DONE}
        onTaskClick={onTaskClick}
      />
      <DragOverlay dropAnimation={null} zIndex={9999}>
        {activeTask ? (
          <TaskCardView
            task={activeTask}
            className="cursor-grabbing shadow-[0_18px_40px_-6px_rgba(0,0,0,0.55)] ring-2 ring-focus-ring"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
