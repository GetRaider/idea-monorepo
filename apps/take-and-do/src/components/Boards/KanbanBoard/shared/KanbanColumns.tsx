"use client";

import { Column } from "../Column/Column";
import { TaskStatus, Task } from "../types";

interface KanbanColumnsProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  columnBodyScrolls?: boolean;
  onTaskDrop: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanColumns({
  tasksByStatus,
  columnBodyScrolls = true,
  onTaskDrop,
  onTaskClick,
}: KanbanColumnsProps) {
  return (
    <>
      <Column
        status={TaskStatus.TODO}
        tasks={tasksByStatus[TaskStatus.TODO]}
        bodyScrolls={columnBodyScrolls}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.IN_PROGRESS}
        tasks={tasksByStatus[TaskStatus.IN_PROGRESS]}
        bodyScrolls={columnBodyScrolls}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.DONE}
        tasks={tasksByStatus[TaskStatus.DONE]}
        bodyScrolls={columnBodyScrolls}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
    </>
  );
}
