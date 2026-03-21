"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";

import { SingleKanbanBoard } from "@/components/Boards/KanbanBoard/SingleKanbanBoard";
import {
  parseBoardPath,
  buildBoardUrl,
} from "../../../../helpers/tasks-routing.helper";
import { BoardLoadingWrapper, BoardLoadingLabel } from "./page.styles";
import { Spinner } from "@/components/Boards/KanbanBoard/KanbanBoard.styles";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function BoardPage({ params }: BoardPageProps) {
  const { boardPath } = use(params);
  const { taskBoards, isFoldersLoading, isBoardsLoading } = useWorkspace();

  const parsedBoardPath = parseBoardPath(boardPath);
  if (!parsedBoardPath) notFound();

  const [isBoardReady, setIsBoardReady] = useState(false);
  const { boardName } = parsedBoardPath;

  useEffect(() => {
    if (!isBoardsLoading && !isFoldersLoading) setIsBoardReady(true);
  }, [isBoardsLoading, isFoldersLoading]);

  const handleTaskOpen = (task: { taskKey?: string }) => {
    if (task.taskKey)
      window.history.replaceState(
        null,
        "",
        buildBoardUrl(boardName, task.taskKey),
      );
  };

  const handleTaskClose = () => {
    window.history.replaceState(null, "", buildBoardUrl(boardName));
  };

  const handleSubtaskOpen = (
    parentTask: { taskKey?: string },
    subtask: { taskKey?: string },
  ) => {
    if (parentTask.taskKey && subtask.taskKey) {
      window.history.replaceState(
        null,
        "",
        buildBoardUrl(boardName, parentTask.taskKey, subtask.taskKey),
      );
    }
  };

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
      workspaceTitle={boardName}
      boardId={currentBoard.id}
      boardEmoji={currentBoard.emoji}
      onTaskOpen={handleTaskOpen}
      onTaskClose={handleTaskClose}
      onSubtaskOpen={handleSubtaskOpen}
    />
  );
}

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}
