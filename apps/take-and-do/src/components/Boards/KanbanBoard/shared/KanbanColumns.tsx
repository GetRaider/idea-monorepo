"use client";

import { Column } from "../Column/Column";
import { TaskStatus, Task } from "../types";

interface KanbanColumnsProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  onTaskDrop: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanColumns({
  tasksByStatus,
  onTaskDrop,
  onTaskClick,
}: KanbanColumnsProps) {
  return (
    <>
      <Column
        status={TaskStatus.TODO}
        tasks={tasksByStatus[TaskStatus.TODO]}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.IN_PROGRESS}
        tasks={tasksByStatus[TaskStatus.IN_PROGRESS]}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
      <Column
        status={TaskStatus.DONE}
        tasks={tasksByStatus[TaskStatus.DONE]}
        onTaskDrop={onTaskDrop}
        onTaskClick={onTaskClick}
      />
    </>
  );
}
