"use client";

import { useCallback, useEffect, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksIntoStatusColumns } from "@/components/Boards/KanbanBoard/shared/tasksIntoStatusColumns";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import { guestStoreHelper } from "@/lib/guest-store";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/lib/guest-store/guest-task-filters";
import { apiServices } from "@/services/api";
import type { TaskBoardWithTasks } from "@/types/workspace";

export function useMultipleKanbanBoardData(
  scheduleDate: Date | undefined,
  folderId: string | undefined,
) {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();

  const [boardsWithTasks, setBoardsWithTasks] = useState<TaskBoardWithTasks[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBoardIds, setExpandedBoardIds] = useState<Set<string>>(
    new Set(),
  );

  const fetchBoards = useCallback(async (): Promise<TaskBoardWithTasks[]> => {
    const taskBoards = isAnonymous
      ? guestStoreHelper.getTaskBoards()
      : await apiServices.taskBoards.getAll();

    if (scheduleDate) {
      const scheduledTasks = isAnonymous
        ? guestTasksForScheduleDate(guestStoreHelper.getTasks(), scheduleDate)
        : await apiServices.tasks.getByDate(scheduleDate);
      const tasksByBoardId = new Map<string, Task[]>();
      for (const task of scheduledTasks) {
        if (!task.taskBoardId) continue;
        const list = tasksByBoardId.get(task.taskBoardId) ?? [];
        list.push(task);
        tasksByBoardId.set(task.taskBoardId, list);
      }
      return taskBoards.map((board) => ({
        ...board,
        tasks: tasksIntoStatusColumns(tasksByBoardId.get(board.id) ?? []),
      }));
    }

    if (folderId) {
      const boards: TaskBoardWithTasks[] = [];
      for (const board of taskBoards.filter((tb) => tb.folderId === folderId)) {
        const boardTasks = isAnonymous
          ? guestTasksForBoard(guestStoreHelper.getTasks(), board.id)
          : await apiServices.taskBoards.getTasks(board.id);
        if (boardTasks.length === 0) continue;
        boards.push({
          ...board,
          tasks: tasksIntoStatusColumns(boardTasks),
        });
      }
      return boards;
    }

    return [];
  }, [scheduleDate, folderId, isAnonymous]);

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
  }, [fetchBoards, guestTasks]);

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
