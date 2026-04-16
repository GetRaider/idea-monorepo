"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { Task, type TaskStatus } from "@/components/Boards/KanbanBoard/types";
import { tasksIntoStatusColumns } from "@/components/Boards/KanbanBoard/shared/tasksIntoStatusColumns";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { GUEST_STORE_UPDATED_EVENT } from "@/stores/guest/constants";
import { guestStoreHelper } from "@/stores/guest";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import type { TaskBoardWithTasks } from "@/types/workspace";

function countTasksInColumns(tasks: Record<TaskStatus, Task[]>): number {
  let total = 0;
  for (const column of Object.values(tasks)) {
    total += column.length;
  }
  return total;
}

function buildGuestBoardsWithTasks(
  scheduleDate: Date | undefined,
  folderId: string | undefined,
): TaskBoardWithTasks[] {
  const taskBoards = guestStoreHelper.getTaskBoards();

  if (scheduleDate) {
    const scheduledTasks = guestTasksForScheduleDate(
      guestStoreHelper.getTasks(),
      scheduleDate,
    );
    const tasksByBoardId = new Map<string, Task[]>();
    for (const task of scheduledTasks) {
      if (!task.taskBoardId) continue;
      const list = tasksByBoardId.get(task.taskBoardId) ?? [];
      list.push(task);
      tasksByBoardId.set(task.taskBoardId, list);
    }
    return taskBoards
      .map((board) => ({
        ...board,
        tasks: tasksIntoStatusColumns(tasksByBoardId.get(board.id) ?? []),
      }))
      .filter((board) => countTasksInColumns(board.tasks) > 0);
  }

  if (folderId) {
    const boards: TaskBoardWithTasks[] = [];
    for (const board of taskBoards.filter((tb) => tb.folderId === folderId)) {
      const boardTasks = guestTasksForBoard(
        guestStoreHelper.getTasks(),
        board.id,
      );
      if (boardTasks.length === 0) continue;
      boards.push({
        ...board,
        tasks: tasksIntoStatusColumns(boardTasks),
      });
    }
    return boards;
  }

  return [];
}

async function loadAuthenticatedBoardsWithTasks(
  scheduleDate: Date | undefined,
  folderId: string | undefined,
): Promise<TaskBoardWithTasks[]> {
  const taskBoards = await clientServices.taskBoards.getAll();

  if (scheduleDate) {
    const scheduledTasks = await clientServices.tasks.getByDate(scheduleDate);
    const tasksByBoardId = new Map<string, Task[]>();
    for (const task of scheduledTasks) {
      if (!task.taskBoardId) continue;
      const list = tasksByBoardId.get(task.taskBoardId) ?? [];
      list.push(task);
      tasksByBoardId.set(task.taskBoardId, list);
    }
    return taskBoards
      .map((board) => ({
        ...board,
        tasks: tasksIntoStatusColumns(tasksByBoardId.get(board.id) ?? []),
      }))
      .filter((board) => countTasksInColumns(board.tasks) > 0);
  }

  if (folderId) {
    const boards: TaskBoardWithTasks[] = [];
    for (const board of taskBoards.filter((tb) => tb.folderId === folderId)) {
      const boardTasks = await clientServices.tasks.getByBoardId(board.id);
      if (boardTasks.length === 0) continue;
      boards.push({
        ...board,
        tasks: tasksIntoStatusColumns(boardTasks),
      });
    }
    return boards;
  }

  return [];
}

export function useMultipleKanbanBoardData(
  scheduleDate: Date | undefined,
  folderId: string | undefined,
) {
  const isAnonymous = useIsAnonymous();

  const scheduleKey = scheduleDate?.getTime();

  const query = useQuery({
    queryKey: queryKeys.kanbanMulti(
      scheduleKey !== undefined ? String(scheduleKey) : undefined,
      folderId,
    ),
    queryFn: () => loadAuthenticatedBoardsWithTasks(scheduleDate, folderId),
    enabled: !isAnonymous && (!!scheduleDate || !!folderId),
  });

  const [boardsWithTasks, setBoardsWithTasks] = useState<TaskBoardWithTasks[]>(
    [],
  );
  const [expandedBoardIds, setExpandedBoardIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (isAnonymous) {
      const boards = buildGuestBoardsWithTasks(scheduleDate, folderId);
      setBoardsWithTasks(boards);
      if (boards.length > 0) {
        setExpandedBoardIds(new Set(boards.map((b) => b.id)));
      }
    }
  }, [isAnonymous, scheduleDate, folderId]);

  useEffect(() => {
    if (isAnonymous) return;
    const data = query.data;
    if (data === undefined) return;
    setBoardsWithTasks(data);
    if (data.length > 0) {
      setExpandedBoardIds(new Set(data.map((b) => b.id)));
    }
  }, [isAnonymous, query.data]);

  useEffect(() => {
    const onGuestStoreUpdated = () => {
      if (!isAnonymous) return;
      const boards = buildGuestBoardsWithTasks(scheduleDate, folderId);
      setBoardsWithTasks(boards);
      if (boards.length > 0) {
        setExpandedBoardIds(new Set(boards.map((b) => b.id)));
      }
    };
    if (isAnonymous) {
      window.addEventListener(GUEST_STORE_UPDATED_EVENT, onGuestStoreUpdated);
    }
    return () => {
      window.removeEventListener(
        GUEST_STORE_UPDATED_EVENT,
        onGuestStoreUpdated,
      );
    };
  }, [isAnonymous, scheduleDate, folderId]);

  const fetchBoards = useCallback(async (): Promise<TaskBoardWithTasks[]> => {
    if (isAnonymous) {
      const boards = buildGuestBoardsWithTasks(scheduleDate, folderId);
      setBoardsWithTasks(boards);
      return boards;
    }
    const result = await query.refetch();
    return result.data ?? [];
  }, [isAnonymous, scheduleDate, folderId, query]);

  const isLoading = isAnonymous ? false : query.isPending;

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
