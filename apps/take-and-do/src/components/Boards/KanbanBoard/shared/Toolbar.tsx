"use client";

import type { ReactNode } from "react";

import {
  Toolbar as ToolbarBar,
  WorkspacePath,
  BoardTitleEmoji,
  WorkspacePathLeading,
  Actions,
} from "../KanbanBoard.ui";
import { CreateTaskButton } from "./CreateTaskButton";
import { WorkspaceSettings } from "./WorkspaceSettings";

interface ToolbarProps {
  workspaceTitle: string;
  /** Emoji string or icon (e.g. sidebar clock icons for Today / Tomorrow). */
  workspaceEmoji?: ReactNode;
  onCreateTask?: () => void;
  onCreateTaskWithAI?: () => void;
  /** Single-board view: board id for workspace visibility settings (omitted for schedule / multi-board toolbars). */
  boardId?: string;
}

export function Toolbar({
  workspaceTitle,
  workspaceEmoji,
  onCreateTask,
  onCreateTaskWithAI,
  boardId,
}: ToolbarProps) {
  return (
    <ToolbarBar>
      <WorkspacePath>
        {workspaceEmoji != null && workspaceEmoji !== "" ? (
          <WorkspacePathLeading aria-hidden>
            {typeof workspaceEmoji === "string" ? (
              <BoardTitleEmoji>{workspaceEmoji}</BoardTitleEmoji>
            ) : (
              workspaceEmoji
            )}
          </WorkspacePathLeading>
        ) : null}
        {workspaceTitle}
      </WorkspacePath>
      <Actions>
        <CreateTaskButton
          onManualCreate={onCreateTask}
          onAICreate={onCreateTaskWithAI}
        />
        {boardId ? <WorkspaceSettings boardId={boardId} /> : null}
      </Actions>
    </ToolbarBar>
  );
}
