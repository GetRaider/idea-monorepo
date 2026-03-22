import { useEffect, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { apiServices } from "@/services/api";
import { ScheduleType, tasksHelper } from "@/helpers/task.helper";

interface UseCustomDateReturn {
  customDateTasks: Task[];
  isLoadingCustomDate: boolean;
  schedule: ScheduleType;
  setSchedule: (schedule: ScheduleType) => void;
}

export function useCustomDateTasks(customDate: string): UseCustomDateReturn {
  const [schedule, setSchedule] = useState<ScheduleType>("new");
  const [isLoadingCustomDate, setIsLoadingCustomDate] = useState(false);
  const [customDateTasks, setCustomDateTasks] = useState<Task[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTasksByDate = async (date: Date) => {
      setIsLoadingCustomDate(true);
      try {
        const tasks = await apiServices.tasks.getByDate(date);
        if (isMounted) setCustomDateTasks(tasks);
      } catch (error) {
        console.error(error);
        if (isMounted) setCustomDateTasks([]);
      } finally {
        if (isMounted) setIsLoadingCustomDate(false);
      }
    };

    if (schedule === "custom" && customDate) {
      const date =
        tasksHelper.date.parseCalendarDay(customDate) ??
        tasksHelper.date.parse(customDate);
      if (date) fetchTasksByDate(date);
      else {
        setCustomDateTasks([]);
        setIsLoadingCustomDate(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [schedule, customDate]);

  return {
    customDateTasks,
    isLoadingCustomDate,
    setSchedule,
    schedule,
  };
}
