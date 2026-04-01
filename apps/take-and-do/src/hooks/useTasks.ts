"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services/client";

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  isGuest: boolean;
}

interface UseTasksParams {
  date?: Date;
  taskBoardId?: string;
}

export function useTasks({
  date,
  taskBoardId,
}: UseTasksParams = {}): UseTasksReturn {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [dbTasks, setDbTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const dateTimestamp = date ? date.getTime() : undefined;

  const guestFiltered = useMemo(() => {
    if (dateTimestamp !== undefined) {
      return guestTasksForScheduleDate(guestTasks, new Date(dateTimestamp));
    }
    if (taskBoardId) {
      return guestTasksForBoard(guestTasks, taskBoardId);
    }
    return guestTasks;
  }, [guestTasks, dateTimestamp, taskBoardId]);

  const tasks = isAnonymous ? guestFiltered : dbTasks;

  useEffect(() => {
    if (isAnonymous) {
      setIsLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const localRequestId = requestIdRef.current;
    setIsLoading(true);

    const fetchTasks = async () => {
      try {
        const tasksResult = await getTasksFromApi({
          dateTimestamp,
          taskBoardId,
        });
        if (localRequestId !== requestIdRef.current) return;
        setDbTasks(tasksResult);
      } finally {
        if (localRequestId !== requestIdRef.current) return;
        setIsLoading(false);
      }
    };

    void fetchTasks();
  }, [isAnonymous, dateTimestamp, taskBoardId]);

  return { tasks, isLoading, isGuest: isAnonymous };
}

async function getTasksFromApi({
  dateTimestamp,
  taskBoardId,
}: UseTasksParams & { dateTimestamp?: number } = {}): Promise<Task[]> {
  if (dateTimestamp)
    return clientServices.tasks.getByDate(new Date(dateTimestamp));
  if (taskBoardId) return clientServices.tasks.getByBoardId(taskBoardId);

  return clientServices.tasks.getAll();
}

export function useTaskActions() {
  const isAnonymous = useIsAnonymous();
  const { update, remove } = useGuestTasks();

  const createTask = useCallback(
    async (payload: Omit<Task, "id"> & { taskBoardName?: string }) => {
      return clientServices.tasks.create(payload);
    },
    [],
  );

  const updateTask = useCallback(
    async (taskId: string, patch: TaskUpdate) => {
      if (isAnonymous) {
        const result = update(taskId, patch);
        return result ?? null;
      }
      return clientServices.tasks.update({ taskId, updates: patch });
    },
    [isAnonymous, update],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (isAnonymous) {
        remove(taskId);
        return null;
      }
      return clientServices.tasks.deleteById(taskId);
    },
    [isAnonymous, remove],
  );

  return { createTask, updateTask, deleteTask, isGuest: isAnonymous };
}
