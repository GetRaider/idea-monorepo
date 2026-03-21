"use client";

import { SingleKanbanBoard } from "./SingleKanbanBoard";
import { MultipleKanbanBoard } from "./MultipleKanbanBoard";
import { TaskStatus, TaskPriority, Task } from "./types";
import { tasksHelper } from "@/helpers/task.helper";

// Re-export types and enums for backward compatibility
export { TaskStatus, TaskPriority };
export type { Task };

export function KanbanBoard({
  currentView = "today",
  workspaceTitle = "Tasks",
  folderId,
  taskBoardId,
  boardEmoji,
}: KanbanBoardProps) {
  const isScheduleWorkspace = tasksHelper.schedule.isSchedule(currentView);
  const isMultipleWorkspace = isScheduleWorkspace || folderId;
  const title = getWorkspaceTitle(currentView, workspaceTitle);

  return isMultipleWorkspace ? (
    <MultipleKanbanBoard
      scheduleDate={
        isScheduleWorkspace
          ? tasksHelper.schedule.getDate(currentView as "today" | "tomorrow")
          : undefined
      }
      workspaceTitle={title}
      folderId={folderId}
    />
  ) : (
    <SingleKanbanBoard
      boardId={taskBoardId}
      workspaceTitle={title}
      boardEmoji={boardEmoji}
    />
  );
}

function getWorkspaceTitle(boardView: string, workspaceTitle: string): string {
  if (boardView === "today") return "Today";
  if (boardView === "tomorrow") return "Tomorrow";
  return workspaceTitle;
}

interface KanbanBoardProps {
  currentView?: string;
  workspaceTitle?: string;
  taskBoardId: string;
  folderId?: string;
  boardEmoji?: string | null;
}
