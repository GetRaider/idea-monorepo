"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { SingleKanbanBoard } from "@/components/Boards/KanbanBoard/SingleKanbanBoard";
import {
  LoadingContainer,
  Spinner,
} from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useBoardTaskUrlSync } from "@/hooks/useKanbanTaskUrlSync";
import { useWorkspaceInitialLoadReady } from "@/hooks/useWorkspaceInitialLoadReady";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

export default function BoardPage({ params }: BoardPageProps) {
  const { boardPath } = use(params);
  const { taskBoards } = useWorkspace();
  const isBoardReady = useWorkspaceInitialLoadReady();

  const parsedBoardPath = tasksUrlHelper.routing.parseBoardPath(boardPath);
  const boardName = parsedBoardPath?.boardName ?? "";
  const { onTaskOpen, onTaskClose, onSubtaskOpen } =
    useBoardTaskUrlSync(boardName);

  if (!parsedBoardPath) notFound();

  if (!isBoardReady) {
    return (
      <LoadingContainer className="flex flex-col gap-3">
        <Spinner />
        <span className="text-sm text-[#888]">Loading board...</span>
      </LoadingContainer>
    );
  }

  const currentBoard = taskBoards.find((board) => board.name === boardName);

  if (!currentBoard) {
    return (
      <div className="p-10 text-[#888]">
        Board &quot;{boardName}&quot; not found.
      </div>
    );
  }

  return (
    <SingleKanbanBoard
      boardName={boardName}
      boardId={currentBoard.id}
      boardEmoji={currentBoard.emoji}
      onTaskOpen={onTaskOpen}
      onTaskClose={onTaskClose}
      onSubtaskOpen={onSubtaskOpen}
    />
  );
}

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}
