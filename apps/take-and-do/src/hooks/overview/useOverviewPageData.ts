"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { Task } from "@/components/Boards/KanbanBoard/types";
import type { TaskStats } from "@/app/overview";
import { deriveGuestTaskStats } from "@/helpers/guest-stats.helper";
import { queryKeys } from "@/lib/query-keys";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { guestTasksBySchedule } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";

export function useOverviewPageData() {
  const { useLocalWorkspace, tasks } = useWorkspaceRepository();

  const scheduledStatsAndWorkspace = useQueries({
    queries: [
      {
        queryKey: queryKeys.tasks.schedule,
        queryFn: () => clientServices.tasks.getBySchedule(),
        enabled: !useLocalWorkspace,
      },
      {
        queryKey: queryKeys.stats("month"),
        queryFn: () => clientServices.stats.getByTimeframe("month"),
        enabled: !useLocalWorkspace,
      },
      {
        queryKey: queryKeys.stats("all"),
        queryFn: () => clientServices.stats.getByTimeframe("all"),
        enabled: !useLocalWorkspace,
      },
    ],
  });

  const [scheduledQuery, statsQuery, workspaceStatsQuery] =
    scheduledStatsAndWorkspace;

  const isLoading =
    !useLocalWorkspace &&
    (scheduledQuery.isPending ||
      statsQuery.isPending ||
      workspaceStatsQuery.isPending);

  const scheduledTasks =
    !useLocalWorkspace && scheduledQuery.data
      ? scheduledQuery.data
      : { today: [] as Task[], tomorrow: [] as Task[] };

  const taskStats: TaskStats | null = useMemo(() => {
    if (useLocalWorkspace) {
      return tasks.length > 0 ? deriveGuestTaskStats(tasks) : null;
    }
    return statsQuery.data !== undefined ? statsQuery.data : null;
  }, [statsQuery.data, tasks, useLocalWorkspace]);

  const localSchedule = useLocalWorkspace
    ? guestTasksBySchedule(tasks)
    : { today: [] as Task[], tomorrow: [] as Task[] };

  const todayTasks = [
    ...scheduledTasks.today,
    ...(useLocalWorkspace ? localSchedule.today : []),
  ];
  const tomorrowTasks = [
    ...scheduledTasks.tomorrow,
    ...(useLocalWorkspace ? localSchedule.tomorrow : []),
  ];

  const statsToastShown = useRef(false);
  useEffect(() => {
    if (
      useLocalWorkspace ||
      !statsQuery.isSuccess ||
      statsQuery.data !== null ||
      statsQuery.isFetching
    ) {
      return;
    }
    if (statsToastShown.current) return;
    statsToastShown.current = true;
    toast.error("Can't load dashboard stats");
  }, [
    statsQuery.data,
    statsQuery.isFetching,
    statsQuery.isSuccess,
    useLocalWorkspace,
  ]);

  const hasWorkspaceTaskData = deriveHasWorkspaceTaskData({
    useLocalWorkspace,
    localTaskCount: tasks.length,
    workspaceTaskTotal: useLocalWorkspace
      ? undefined
      : workspaceStatsQuery.data?.total,
  });

  return {
    isLoading,
    taskStats,
    todayTasks,
    tomorrowTasks,
    hasWorkspaceTaskData,
  };
}

function deriveHasWorkspaceTaskData({
  useLocalWorkspace,
  localTaskCount,
  workspaceTaskTotal,
}: DeriveHasWorkspaceTaskDataInput): boolean {
  if (useLocalWorkspace) return localTaskCount > 0;
  return (workspaceTaskTotal ?? 0) > 0;
}

interface DeriveHasWorkspaceTaskDataInput {
  useLocalWorkspace: boolean;
  localTaskCount: number;
  workspaceTaskTotal: number | null | undefined;
}
