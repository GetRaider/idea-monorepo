"use client";

import { useEffect, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
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
  const [isLoadingCustomDate, setIsLoadingCustomDate] = useState(false);
  const [customDateTasks, setCustomDateTasks] = useState<Task[]>([]);

  useEffect(() => {
    let isMounted = true;

    if (schedule !== "custom" || !customDate) {
      setCustomDateTasks([]);
      setIsLoadingCustomDate(false);
      return;
    }

    const date =
      tasksHelper.date.parseCalendarDay(customDate) ??
      tasksHelper.date.parse(customDate);
    if (!date) {
      setCustomDateTasks([]);
      setIsLoadingCustomDate(false);
      return;
    }

    if (isAnonymous) {
      setIsLoadingCustomDate(true);
      setCustomDateTasks(guestTasksForScheduleDate(guestTasks, date));
      setIsLoadingCustomDate(false);
      return;
    }

    const fetchTasksByDate = async () => {
      setIsLoadingCustomDate(true);
      try {
        const tasks = await clientServices.tasks.getByDate(date);
        if (isMounted) setCustomDateTasks(tasks);
      } finally {
        if (isMounted) setIsLoadingCustomDate(false);
      }
    };

    void fetchTasksByDate();
    return () => {
      isMounted = false;
    };
  }, [schedule, customDate, isAnonymous, guestTasks]);

  return {
    customDateTasks,
    isLoadingCustomDate,
    setSchedule,
    schedule,
  };
}
