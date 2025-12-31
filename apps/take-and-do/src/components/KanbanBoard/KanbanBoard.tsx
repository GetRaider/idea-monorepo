"use client";

import { SingleKanbanBoard } from "./SingleKanbanBoard";
import { MultipleKanbanBoard } from "./MultipleKanbanBoard";
import { TaskStatus, TaskPriority, Task, isScheduleString, getDateFromScheduleString } from "./types";

// Re-export types and enums for backward compatibility
export { TaskStatus, TaskPriority };
export type { Task };

interface KanbanBoardProps {
  currentView?: string;
  workspaceTitle?: string;
  taskBoardId?: string;
  folderId?: string;
  taskBoardNameMap?: Record<string, string>;
}

function getWorkspaceTitle(
  boardView: string,
  workspaceTitle: string,
): string {
  if (boardView === "today") {
    return "Today";
  } else if (boardView === "tomorrow") {
    return "Tomorrow";
  }
  return workspaceTitle;
}

export default function KanbanBoard({
  currentView = "today",
  workspaceTitle = "Tasks",
  folderId,
  taskBoardNameMap = {},
}: KanbanBoardProps) {
  const isScheduleWorkspace = isScheduleString(currentView);

  const title = getWorkspaceTitle(currentView, workspaceTitle);

  // Use MultipleKanbanBoard for schedules or folders
  if (isScheduleWorkspace || folderId) {
    return (
      <MultipleKanbanBoard
        scheduleDate={
          isScheduleWorkspace ? getDateFromScheduleString(currentView) : undefined
        }
        workspaceTitle={title}
        folderId={folderId}
        taskBoardNameMap={taskBoardNameMap}
      />
    );
  }

  // Use SingleKanbanBoard for individual boards
  return (
    <SingleKanbanBoard
      boardName={String(currentView)}
      workspaceTitle={title}
      taskBoardNameMap={taskBoardNameMap}
    />
  );
}
