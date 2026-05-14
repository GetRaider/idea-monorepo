"use client";

import { use } from "react";
import { notFound } from "next/navigation";

import { SingleKanbanBoard } from "@/components/Boards/KanbanBoard/SingleKanbanBoard";
import {
  LoadingContainer,
  KanbanSpinner,
} from "@/components/Boards/KanbanBoard/KanbanBoard.ui";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useBoardTaskUrlSync } from "@/hooks/tasks/useKanbanTaskUrlSync";
import { useWorkspaceInitialLoadReady } from "@/hooks/tasks/useWorkspaceInitialLoadReady";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { TasksRouteRootShell } from "../../TasksRootShell";
import { TasksSubpageShell } from "../../TasksSubpageShell";

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
      <TasksRouteRootShell>
        <TasksSubpageShell>
          <LoadingContainer className="flex flex-col gap-3">
            <KanbanSpinner />
            <span className="text-sm text-[#888]">Loading board...</span>
          </LoadingContainer>
        </TasksSubpageShell>
      </TasksRouteRootShell>
    );
  }

  const currentBoard = taskBoards.find((board) => board.name === boardName);

  if (!currentBoard) {
    return (
      <TasksRouteRootShell>
        <TasksSubpageShell>
          <div className="p-10 text-[#888]">
            Board &quot;{boardName}&quot; not found.
          </div>
        </TasksSubpageShell>
      </TasksRouteRootShell>
    );
  }

  return (
    <TasksRouteRootShell>
      <TasksSubpageShell>
        <SingleKanbanBoard
          boardName={boardName}
          boardId={currentBoard.id}
          boardEmoji={currentBoard.emoji}
          embedInTasksShell
          onTaskOpen={onTaskOpen}
          onTaskClose={onTaskClose}
          onSubtaskOpen={onSubtaskOpen}
        />
      </TasksSubpageShell>
    </TasksRouteRootShell>
  );
}

interface BoardPageProps {
  params: Promise<{ boardPath: string[] }>;
}
