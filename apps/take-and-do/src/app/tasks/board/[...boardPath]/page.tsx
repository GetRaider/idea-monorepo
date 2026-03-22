"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { SingleKanbanBoard } from "@/components/Boards/KanbanBoard/SingleKanbanBoard";
import { BoardLoadingWrapper, BoardLoadingLabel } from "./page.styles";
import { Spinner } from "@/components/Boards/KanbanBoard/KanbanBoard.styles";
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
      <BoardLoadingWrapper>
        <Spinner />
        <BoardLoadingLabel>Loading board...</BoardLoadingLabel>
      </BoardLoadingWrapper>
    );
  }

  const currentBoard = taskBoards.find((board) => board.name === boardName);

  if (!currentBoard) {
    return (
      <div style={{ padding: "40px", color: "#888" }}>
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
