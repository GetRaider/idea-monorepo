"use client";

import { useEffect, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import { guestTasksRecent } from "@/lib/guest-store/guest-task-filters";
import { apiServices } from "@/services/api";

interface UseRecentTasksReturn {
  recentTasks: Task[];
  isLoadingRecent: boolean;
}

export function useRecentTasks(tasksNumber: number = 7): UseRecentTasksReturn {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    if (isAnonymous) {
      setRecentTasks(guestTasksRecent(guestTasks, tasksNumber));
      setIsLoadingRecent(false);
      return;
    }

    let isMounted = true;
    const fetchRecentTasks = async () => {
      setIsLoadingRecent(true);
      try {
        const tasks = await apiServices.tasks.getRecent(tasksNumber);
        if (isMounted) setRecentTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch recent tasks:", error);
        if (isMounted) setRecentTasks([]);
      } finally {
        if (isMounted) setIsLoadingRecent(false);
      }
    };

    void fetchRecentTasks();
    return () => {
      isMounted = false;
    };
  }, [tasksNumber, isAnonymous, guestTasks]);

  return { recentTasks, isLoadingRecent };
}
