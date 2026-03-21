"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter, notFound } from "next/navigation";

import {
  SingleKanbanBoard,
  type SingleKanbanBoardRef,
} from "@/components/Boards/KanbanBoard/SingleKanbanBoard";
import {
  parseBoardPath,
  buildBoardUrl,
} from "../../../../helpers/tasks-routing.helper";
import { BoardLoadingWrapper, BoardLoadingLabel } from "./BoardPage.styles";
import { Spinner } from "@/components/Boards/KanbanBoard/KanbanBoard.styles";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function BoardPage({ params }: BoardPageProps) {
  const { boardPath } = use(params);
  const router = useRouter();
  const { taskBoards, isFoldersLoading, isBoardsLoading } = useWorkspace();

  const parsedBoardPath = parseBoardPath(boardPath);
  if (!parsedBoardPath) notFound();

  const [isBoardReady, setIsBoardReady] = useState(false);
  const boardRef = useRef<SingleKanbanBoardRef>(null);
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

  const handleTaskDelete = () => {
    boardRef.current?.refetch();
    router.push(buildBoardUrl(boardName));
  };

  if (!isBoardReady) {
    return (
      <BoardLoadingWrapper>
        <Spinner />
        <BoardLoadingLabel>Loading board...</BoardLoadingLabel>
      </BoardLoadingWrapper>
    );
  }

  if (!taskBoards.find((board) => board.name === boardName)) {
    return (
      <div style={{ padding: "40px", color: "#888" }}>
        Board &quot;{boardName}&quot; not found.
      </div>
    );
  }

  return (
    <SingleKanbanBoard
      ref={boardRef}
      workspaceTitle={boardName}
      boardId={taskBoards.find((tb) => tb.name === boardName)?.id ?? ""}
      boardName={boardName}
      onTaskOpen={handleTaskOpen}
      onTaskClose={handleTaskClose}
      onSubtaskOpen={handleSubtaskOpen}
    />
  );
}

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}
