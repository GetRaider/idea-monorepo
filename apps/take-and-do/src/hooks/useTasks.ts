import { useEffect, useRef, useState } from "react";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { apiServices } from "@/services/api";

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
}

interface UseTasksParams {
  date?: Date;
  taskBoardId?: string;
}

export function useTasks({
  date,
  taskBoardId,
}: UseTasksParams): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const dateTimestamp = date ? date.getTime() : undefined;

  useEffect(() => {
    requestIdRef.current += 1;
    const localRequestId = requestIdRef.current;
    const fetchTasks = async () => {
      try {
        const tasksResult = await getTasks({
          dateTimestamp,
          taskBoardId,
        });
        if (localRequestId !== requestIdRef.current) return;
        setTasks(tasksResult);
      } catch (error) {
        if (localRequestId !== requestIdRef.current) return;
        console.error("[useTasks] Failed to fetch tasks:", error);
        setTasks([]);
      } finally {
        if (localRequestId !== requestIdRef.current) return;
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [dateTimestamp, taskBoardId]);

  return { tasks, isLoading };
}

async function getTasks({
  dateTimestamp,
  taskBoardId,
}: UseTasksParams & { dateTimestamp?: number } = {}): Promise<
  Task[]
> {
  if (dateTimestamp) return apiServices.tasks.getByDate(new Date(dateTimestamp));
  if (taskBoardId) return apiServices.tasks.getByBoardId(taskBoardId);

  return apiServices.tasks.getAll();
}
