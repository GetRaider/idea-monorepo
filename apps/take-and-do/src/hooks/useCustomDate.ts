import { useEffect, useState } from "react";

import { Task } from "@/components/KanbanBoard/types";
import { tasksService } from "@/services/api";
import { ScheduleType, tasksUtils } from "@/utils/task.utils";

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
    const date = tasksUtils.date.formatCustomDate(customDate);
    const fetchTasksByDate = async () => {
      setIsLoadingCustomDate(true);
      try {
        const tasks = await tasksService.getByDate(date);
        if (isMounted) setCustomDateTasks(tasks);
      } catch (error) {
        console.error(error);
        if (isMounted) setCustomDateTasks([]);
      } finally {
        if (isMounted) setIsLoadingCustomDate(false);
      }
    };

    if (schedule === "custom" && customDate) {
      fetchTasksByDate();
    }
  }, [schedule, customDate]);

  return {
    customDateTasks,
    isLoadingCustomDate,
    setSchedule,
    schedule,
  };
}
