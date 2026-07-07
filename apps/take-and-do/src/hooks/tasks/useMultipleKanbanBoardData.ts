"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Task, type TaskStatus } from "@/components/Boards/KanbanBoard/types";
import { tasksIntoStatusColumns } from "@/components/Boards/KanbanBoard/shared/tasksIntoStatusColumns";
import { queryKeys } from "@/lib/query-keys";
import { useWorkspaceRepository } from "@/repositories/workspace";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import type { TaskBoard, TaskBoardWithTasks } from "@/types/workspace";

function countTasksInColumns(tasks: Record<TaskStatus, Task[]>): number {
  let total = 0;
  for (const column of Object.values(tasks)) {
    total += column.length;
  }
  return total;
}

function buildBoardsWithTasks(
  taskBoards: TaskBoard[],
  tasks: Task[],
  scheduleDate: Date | undefined,
  folderId: string | undefined,
): TaskBoardWithTasks[] {
  if (scheduleDate) {
    const scheduledTasks = guestTasksForScheduleDate(tasks, scheduleDate);
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
    for (const board of taskBoards.filter(
      (taskBoard) => taskBoard.folderId === folderId,
    )) {
      const boardTasks = guestTasksForBoard(tasks, board.id);
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

async function loadRemoteBoardsWithTasks(
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
    for (const board of taskBoards.filter(
      (taskBoard) => taskBoard.folderId === folderId,
    )) {
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
  const { useLocalWorkspace, taskBoards, tasks } = useWorkspaceRepository();
  const scheduleKey = scheduleDate?.getTime();

  const query = useQuery({
    queryKey: queryKeys.kanbanMulti(
      scheduleKey !== undefined ? String(scheduleKey) : undefined,
      folderId,
    ),
    queryFn: () => loadRemoteBoardsWithTasks(scheduleDate, folderId),
    enabled: !useLocalWorkspace && (!!scheduleDate || !!folderId),
  });

  const resolvedBoardsWithTasks = useMemo(() => {
    if (useLocalWorkspace) {
      return buildBoardsWithTasks(taskBoards, tasks, scheduleDate, folderId);
    }
    return query.data ?? [];
  }, [
    folderId,
    query.data,
    scheduleDate,
    taskBoards,
    tasks,
    useLocalWorkspace,
  ]);

  const [boardsWithTasks, setBoardsWithTasks] = useState<TaskBoardWithTasks[]>(
    [],
  );
  const [expandedBoardIds, setExpandedBoardIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    setBoardsWithTasks(resolvedBoardsWithTasks);
    if (resolvedBoardsWithTasks.length > 0) {
      setExpandedBoardIds(
        new Set(resolvedBoardsWithTasks.map((board) => board.id)),
      );
    }
  }, [resolvedBoardsWithTasks]);

  const fetchBoards = useCallback(async (): Promise<TaskBoardWithTasks[]> => {
    if (useLocalWorkspace) {
      return buildBoardsWithTasks(taskBoards, tasks, scheduleDate, folderId);
    }
    const result = await query.refetch();
    return result.data ?? [];
  }, [folderId, query, scheduleDate, taskBoards, tasks, useLocalWorkspace]);

  const isLoading = useLocalWorkspace ? false : query.isPending;

  const toggleBoardExpanded = useCallback((taskBoardId: string) => {
    setExpandedBoardIds((previous) => {
      const next = new Set(previous);
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
