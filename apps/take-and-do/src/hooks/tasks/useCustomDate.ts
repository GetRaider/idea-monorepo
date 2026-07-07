"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { guestTasksForScheduleDate } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import { ScheduleType, tasksHelper } from "@/helpers/task.helper";

interface UseCustomDateReturn {
  customDateTasks: Task[];
  isLoadingCustomDate: boolean;
  schedule: ScheduleType;
  setSchedule: (schedule: ScheduleType) => void;
}

export function useCustomDateTasks(customDate: string): UseCustomDateReturn {
  const { useLocalWorkspace, tasks } = useWorkspaceRepository();
  const [schedule, setSchedule] = useState<ScheduleType>("new");

  const parsedDate = useMemo(() => {
    if (schedule !== "custom" || !customDate) return undefined;
    return (
      tasksHelper.date.parseCalendarDay(customDate) ??
      tasksHelper.date.parse(customDate)
    );
  }, [schedule, customDate]);

  const dateIso = parsedDate
    ? tasksHelper.date.formatForAPI(parsedDate)
    : undefined;

  const dbQuery = useQuery({
    queryKey: dateIso
      ? queryKeys.tasks.byDate(dateIso)
      : (["tasks", "custom-date", "idle"] as const),
    queryFn: () =>
      parsedDate
        ? clientServices.tasks.getByDate(parsedDate)
        : Promise.resolve([]),
    enabled:
      !useLocalWorkspace && schedule === "custom" && parsedDate !== undefined,
  });

  const localCustomTasks = useMemo(() => {
    if (!parsedDate) return [];
    return guestTasksForScheduleDate(tasks, parsedDate);
  }, [parsedDate, tasks]);

  const customDateTasks = useMemo(() => {
    if (schedule !== "custom" || !parsedDate) return [];
    if (useLocalWorkspace) return localCustomTasks;
    return dbQuery.data ?? [];
  }, [dbQuery.data, localCustomTasks, parsedDate, schedule, useLocalWorkspace]);

  const isLoadingCustomDate = useMemo(() => {
    if (schedule !== "custom" || !parsedDate) return false;
    if (useLocalWorkspace) return false;
    return dbQuery.isPending;
  }, [dbQuery.isPending, parsedDate, schedule, useLocalWorkspace]);

  return {
    customDateTasks,
    isLoadingCustomDate,
    setSchedule,
    schedule,
  };
}
