import { useEffect, useState } from "react";

import { Task } from "@/components/KanbanBoard/types";
import { tasksService } from "@/services/api";

interface UseRecentTasksReturn {
  recentTasks: Task[];
  isLoadingRecent: boolean;
}

export function useRecentTasks(tasksNumber: number = 7): UseRecentTasksReturn {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentTasks = async () => {
      setIsLoadingRecent(true);
      try {
        const tasks = await tasksService.getRecent(tasksNumber);
        if (isMounted) setRecentTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch recent tasks:", error);
        if (isMounted) setRecentTasks([]);
      } finally {
        if (isMounted) setIsLoadingRecent(false);
      }
    };

    fetchRecentTasks();
  }, [tasksNumber]);

  return { recentTasks, isLoadingRecent };
}
