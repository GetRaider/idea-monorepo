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
import type { BoardViewMode } from "@/hooks/tasks/useBoardViewMode";
import type { BoardListSubmode } from "@/hooks/tasks/useBoardListSubmode";
import type { ListSortState } from "@/helpers/list-sort.helper";

interface ToolbarProps {
  workspaceTitle: string;
  /** Emoji string or icon (e.g. sidebar clock icons for Today / Tomorrow). */
  workspaceEmoji?: ReactNode;
  onCreateTask?: () => void;
  onCreateTaskWithAI?: () => void;
  /** Single-board view: board id for workspace visibility settings (omitted for schedule / multi-board toolbars). */
  boardId?: string;
  /** When provided, renders a settings popover with the Kanban/List toggle. */
  viewMode?: BoardViewMode;
  onViewModeChange?: (next: BoardViewMode) => void;
  listSubmode?: BoardListSubmode;
  onListSubmodeChange?: (next: BoardListSubmode) => void;
  sort?: ListSortState;
  onSortChange?: (next: ListSortState) => void;
}

export function Toolbar({
  workspaceTitle,
  workspaceEmoji,
  onCreateTask,
  onCreateTaskWithAI,
  boardId,
  viewMode,
  onViewModeChange,
  listSubmode,
  onListSubmodeChange,
  sort,
  onSortChange,
}: ToolbarProps) {
  const showSettings = !!viewMode && !!onViewModeChange;

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
        {showSettings ? (
          <WorkspaceSettings
            boardId={boardId}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            listSubmode={listSubmode}
            onListSubmodeChange={onListSubmodeChange}
            sort={sort}
            onSortChange={onSortChange}
          />
        ) : null}
      </Actions>
    </ToolbarBar>
  );
}
