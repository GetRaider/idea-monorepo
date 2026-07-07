"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { guestTasksRecent } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";

interface UseRecentTasksReturn {
  recentTasks: Task[];
  isLoadingRecent: boolean;
}

export function useRecentTasks(tasksNumber: number = 7): UseRecentTasksReturn {
  const { useLocalWorkspace, tasks } = useWorkspaceRepository();

  const dbQuery = useQuery({
    queryKey: queryKeys.tasks.recent(tasksNumber),
    queryFn: () => clientServices.tasks.getRecent(tasksNumber),
    enabled: !useLocalWorkspace,
  });

  const recentTasks = useMemo(() => {
    if (useLocalWorkspace) return guestTasksRecent(tasks, tasksNumber);
    return dbQuery.data ?? [];
  }, [dbQuery.data, tasks, tasksNumber, useLocalWorkspace]);

  const isLoadingRecent = useLocalWorkspace ? false : dbQuery.isPending;

  return { recentTasks, isLoadingRecent };
}
