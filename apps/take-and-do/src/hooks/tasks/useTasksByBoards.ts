"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { clientServices } from "@/services";
import { guestTasksForBoard } from "@/stores/guest/guest-task-filters";
import type { TaskBoard } from "@/types/workspace";

export function useTasksByBoards(boards: TaskBoard[]) {
  const { useLocalWorkspace, tasks } = useWorkspaceRepository();

  const taskQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: queryKeys.tasks.byBoard(board.id),
      queryFn: () => clientServices.tasks.getByBoardId(board.id),
      enabled: !useLocalWorkspace && boards.length > 0,
    })),
  });

  const tasksByBoardId = useMemo(() => {
    if (boards.length === 0) return {} as Record<string, Task[]>;

    if (useLocalWorkspace) {
      return Object.fromEntries(
        boards.map((board) => [board.id, guestTasksForBoard(tasks, board.id)]),
      );
    }

    return Object.fromEntries(
      boards.map((board, index) => [board.id, taskQueries[index]?.data ?? []]),
    );
  }, [boards, tasks, taskQueries, useLocalWorkspace]);

  const isLoading =
    !useLocalWorkspace &&
    boards.length > 0 &&
    taskQueries.some((query) => query.isPending);

  return { tasksByBoardId, isLoading };
}
