import { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await getTasks({ date, taskBoardId });
      setTasks(tasks);
      setIsLoading(false);
    };
    fetchTasks();
  }, [date, taskBoardId]);

  return { tasks, isLoading };
}

async function getTasks({ date, taskBoardId }: UseTasksParams = {}): Promise<
  Task[]
> {
  if (date) return apiServices.tasks.getByDate(date);
  if (taskBoardId) return apiServices.tasks.getByBoardId(taskBoardId);

  return apiServices.tasks.getAll();
}
