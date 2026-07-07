"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";
import { queryKeys } from "@/lib/query-keys";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";

import type { WorkspaceTaskFilter } from "./workspace-repository.types";

/**
 * Resolves a filtered task view for {@link useWorkspaceRepository}. Returns
 * `null` when no filter is passed so the caller falls back to the canonical
 * (all tasks) state from the provider. Hooks run unconditionally to satisfy
 * the rules of hooks; the query is gated via `enabled`.
 */
export function useWorkspaceTasksFilter(
  useLocalWorkspace: boolean,
  allTasks: Task[],
  filter: WorkspaceTaskFilter | undefined,
): FilteredTasks | null {
  const dateTimestamp = filter?.date ? filter.date.getTime() : undefined;
  const taskBoardId = filter?.taskBoardId;

  const localFilteredTasks = useMemo(() => {
    if (!useLocalWorkspace) return [];
    if (dateTimestamp !== undefined) {
      return guestTasksForScheduleDate(allTasks, new Date(dateTimestamp));
    }
    if (taskBoardId) {
      return guestTasksForBoard(allTasks, taskBoardId);
    }
    return allTasks;
  }, [allTasks, dateTimestamp, taskBoardId, useLocalWorkspace]);

  const dateKey =
    dateTimestamp !== undefined
      ? tasksHelper.date.formatForAPI(new Date(dateTimestamp))
      : undefined;

  const listQuery = useQuery({
    queryKey:
      dateKey !== undefined
        ? queryKeys.tasks.byDate(dateKey)
        : taskBoardId
          ? queryKeys.tasks.byBoard(taskBoardId)
          : queryKeys.tasks.all,
    queryFn: () => getTasksFromApi({ dateTimestamp, taskBoardId }),
    enabled: !useLocalWorkspace && filter !== undefined,
  });

  if (filter === undefined) return null;

  return {
    tasks: useLocalWorkspace ? localFilteredTasks : (listQuery.data ?? []),
    isTasksLoading: useLocalWorkspace ? false : listQuery.isPending,
  };
}

async function getTasksFromApi({
  dateTimestamp,
  taskBoardId,
}: {
  dateTimestamp?: number;
  taskBoardId?: string;
}): Promise<Task[]> {
  if (dateTimestamp)
    return clientServices.tasks.getByDate(new Date(dateTimestamp));
  if (taskBoardId) return clientServices.tasks.getByBoardId(taskBoardId);

  return clientServices.tasks.getAll();
}

interface FilteredTasks {
  tasks: Task[];
  isTasksLoading: boolean;
}
