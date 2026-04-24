"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { guestTasksRecent } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";

interface UseRecentTasksReturn {
  recentTasks: Task[];
  isLoadingRecent: boolean;
}

export function useRecentTasks(tasksNumber: number = 7): UseRecentTasksReturn {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();

  const dbQuery = useQuery({
    queryKey: queryKeys.tasks.recent(tasksNumber),
    queryFn: () => clientServices.tasks.getRecent(tasksNumber),
    enabled: !isAnonymous,
  });

  const recentTasks = useMemo(() => {
    if (isAnonymous) return guestTasksRecent(guestTasks, tasksNumber);
    return dbQuery.data ?? [];
  }, [isAnonymous, guestTasks, tasksNumber, dbQuery.data]);

  const isLoadingRecent = isAnonymous ? false : dbQuery.isPending;

  return { recentTasks, isLoadingRecent };
}
