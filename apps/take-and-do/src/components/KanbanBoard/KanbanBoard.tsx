"use client";

import { SingleKanbanBoard } from "./SingleKanbanBoard";
import { MultipleKanbanBoard } from "./MultipleKanbanBoard";
import { TaskSchedule, TaskStatus, TaskPriority, Task } from "./types";

// Re-export types and enums for backward compatibility
export { TaskSchedule, TaskStatus, TaskPriority };
export type { Task };

interface KanbanBoardProps {
  currentView?: TaskSchedule | string;
  workspaceTitle?: string;
  taskBoardId?: string;
  folderId?: string;
}

function getWorkspaceTitle(
  boardView: TaskSchedule | string,
  workspaceTitle: string,
): string {
  switch (boardView) {
    case TaskSchedule.TODAY:
      return "Today";
    case TaskSchedule.TOMORROW:
      return "Tomorrow";
    default:
      return workspaceTitle;
  }
}

export default function KanbanBoard({
  currentView = TaskSchedule.TODAY,
  workspaceTitle = "Tasks",
  folderId,
}: KanbanBoardProps) {
  const isScheduleWorkspace =
    currentView === TaskSchedule.TODAY || currentView === TaskSchedule.TOMORROW;

  const title = getWorkspaceTitle(currentView, workspaceTitle);

  // Use MultipleKanbanBoard for schedules or folders
  if (isScheduleWorkspace || folderId) {
    return (
      <MultipleKanbanBoard
        schedule={
          isScheduleWorkspace ? (currentView as TaskSchedule) : undefined
        }
        workspaceTitle={title}
        folderId={folderId}
      />
    );
  }

  // Use SingleKanbanBoard for individual boards
  return (
    <SingleKanbanBoard boardName={String(currentView)} workspaceTitle={title} />
  );
}
