import { useCallback, useEffect, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksIntoStatusColumns } from "@/components/Boards/KanbanBoard/shared/tasksIntoStatusColumns";
import { apiServices } from "@/services/api";
import type { TaskBoard, TaskBoardWithTasks } from "@/types/workspace";

function taskBoardFallback(id: string): TaskBoard {
  const t = new Date(0);
  return {
    id,
    isPublic: false,
    name: id,
    emoji: null,
    folderId: null,
    createdAt: t,
    updatedAt: t,
  };
}

export function useMultipleKanbanBoardData(
  scheduleDate: Date | undefined,
  folderId: string | undefined,
) {
  const [boardsWithTasks, setBoardsWithTasks] = useState<TaskBoardWithTasks[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBoardIds, setExpandedBoardIds] = useState<Set<string>>(
    new Set(),
  );

  const fetchBoards = useCallback(async (): Promise<TaskBoardWithTasks[]> => {
    const taskBoards = await apiServices.taskBoards.getAll();
    const boardById = new Map(taskBoards.map((b) => [b.id, b]));

    if (scheduleDate) {
      const scheduledTasks = await apiServices.tasks.getByDate(scheduleDate);
      const tasksByBoardId = new Map<string, Task[]>();
      for (const task of scheduledTasks) {
        if (!task.taskBoardId) continue;
        const list = tasksByBoardId.get(task.taskBoardId) ?? [];
        list.push(task);
        tasksByBoardId.set(task.taskBoardId, list);
      }
      return [...tasksByBoardId.entries()].map(([boardId, boardTasks]) => ({
        ...(boardById.get(boardId) ?? taskBoardFallback(boardId)),
        tasks: tasksIntoStatusColumns(boardTasks),
      }));
    }

    if (folderId) {
      const boards: TaskBoardWithTasks[] = [];
      for (const board of taskBoards.filter((tb) => tb.folderId === folderId)) {
        const boardTasks = await apiServices.taskBoards.getTasks(board.id);
        if (boardTasks.length === 0) continue;
        boards.push({
          ...board,
          tasks: tasksIntoStatusColumns(boardTasks),
        });
      }
      return boards;
    }

    return [];
  }, [scheduleDate, folderId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const boards = await fetchBoards();
        if (cancelled) return;
        setBoardsWithTasks(boards);
        if (boards.length > 0) {
          setExpandedBoardIds(new Set(boards.map((b) => b.id)));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch tasks:", error);
          setBoardsWithTasks([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchBoards]);

  const toggleBoardExpanded = useCallback((taskBoardId: string) => {
    setExpandedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskBoardId)) next.delete(taskBoardId);
      else next.add(taskBoardId);
      return next;
    });
  }, []);

  return {
    boardsWithTasks,
    setBoardsWithTasks,
    isLoading,
    fetchBoards,
    expandedBoardIds,
    toggleBoardExpanded,
  };
}
