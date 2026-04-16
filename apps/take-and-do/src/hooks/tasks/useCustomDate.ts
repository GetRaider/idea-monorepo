"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
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
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
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
    enabled: !isAnonymous && schedule === "custom" && parsedDate !== undefined,
  });

  const guestCustom = useMemo(() => {
    if (!parsedDate) return [];
    return guestTasksForScheduleDate(guestTasks, parsedDate);
  }, [guestTasks, parsedDate]);

  const customDateTasks = useMemo(() => {
    if (schedule !== "custom" || !parsedDate) return [];
    if (isAnonymous) return guestCustom;
    return dbQuery.data ?? [];
  }, [schedule, parsedDate, isAnonymous, guestCustom, dbQuery.data]);

  const isLoadingCustomDate = useMemo(() => {
    if (schedule !== "custom" || !parsedDate) return false;
    if (isAnonymous) return false;
    return dbQuery.isPending;
  }, [schedule, parsedDate, isAnonymous, dbQuery.isPending]);

  return {
    customDateTasks,
    isLoadingCustomDate,
    setSchedule,
    schedule,
  };
}
