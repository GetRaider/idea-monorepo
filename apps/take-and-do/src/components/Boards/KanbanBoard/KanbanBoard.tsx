"use client";

import { SingleKanbanBoard } from "./SingleKanbanBoard";
import { MultipleKanbanBoard } from "./MultipleKanbanBoard";
import {
  TaskStatus,
  TaskPriority,
  Task,
  isScheduleString,
  getDateFromScheduleString,
} from "./types";

// Re-export types and enums for backward compatibility
export { TaskStatus, TaskPriority };
export type { Task };

interface KanbanBoardProps {
  currentView?: string;
  workspaceTitle?: string;
  taskBoardId: string;
  folderId?: string;
}

function getWorkspaceTitle(boardView: string, workspaceTitle: string): string {
  if (boardView === "today") {
    return "Today";
  } else if (boardView === "tomorrow") {
    return "Tomorrow";
  }
  return workspaceTitle;
}

export function KanbanBoard({
  currentView = "today",
  workspaceTitle = "Tasks",
  folderId,
  taskBoardId,
}: KanbanBoardProps) {
  const isScheduleWorkspace = isScheduleString(currentView);
  const isMultipleWorkspace = isScheduleWorkspace || folderId;

  const title = getWorkspaceTitle(currentView, workspaceTitle);

  return isMultipleWorkspace ? (
    <MultipleKanbanBoard
      scheduleDate={
        isScheduleWorkspace ? getDateFromScheduleString(currentView) : undefined
      }
      workspaceTitle={title}
      folderId={folderId}
    />
  ) : (
    <SingleKanbanBoard
      boardId={taskBoardId}
      boardName={String(currentView)}
      workspaceTitle={title}
    />
  );
}
