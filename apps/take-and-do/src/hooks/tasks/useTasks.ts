"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";
import { invalidateTaskDataQueries } from "@/lib/invalidate-app-queries";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import {
  guestTasksForBoard,
  guestTasksForScheduleDate,
} from "@/stores/guest/guest-task-filters";
import { guestStoreHelper } from "@/stores/guest";
import { clientServices } from "@/services";

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

  const dateKey =
    dateTimestamp !== undefined
      ? tasksHelper.date.formatForAPI(new Date(dateTimestamp))
      : undefined;

  const listQuery = useQuery({
    queryKey:
      dateKey !== undefined
        ? queryKeys.tasks.byDate(dateKey)
        : taskBoardId
          ? queryKeys.tasks.byBoard(taskBoardId)
          : queryKeys.tasks.all,
    queryFn: () => getTasksFromApi({ dateTimestamp, taskBoardId }),
    enabled: !isAnonymous,
  });

  const tasks = isAnonymous ? guestFiltered : (listQuery.data ?? []);
  const isLoading = isAnonymous ? false : listQuery.isPending;

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
  const queryClient = useQueryClient();

  const runAfterTaskMutation = useCallback(async () => {
    await invalidateTaskDataQueries(queryClient);
  }, [queryClient]);

  const createTask = useMutation({
    mutationFn: (payload: Omit<Task, "id"> & { taskBoardName?: string }) =>
      clientServices.tasks.create(payload),
    onSuccess: () => {
      void runAfterTaskMutation();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: TaskUpdate;
    }) => clientServices.tasks.update({ taskId, updates }),
    onSuccess: () => {
      void runAfterTaskMutation();
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: ({
      parentTaskId,
      input,
    }: {
      parentTaskId: string;
      input: { summary: string };
    }) => clientServices.tasks.createSubtask(parentTaskId, input),
    onSuccess: () => {
      void runAfterTaskMutation();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => clientServices.tasks.deleteById(taskId),
    onSuccess: () => {
      void runAfterTaskMutation();
    },
  });

  const updateTask = useCallback(
    async (taskId: string, patch: TaskUpdate) => {
      if (isAnonymous) {
        const result = update(taskId, patch);
        return result ?? null;
      }
      return updateTaskMutation.mutateAsync({ taskId, updates: patch });
    },
    [isAnonymous, update, updateTaskMutation],
  );

  const createTaskFn = useCallback(
    async (payload: Omit<Task, "id"> & { taskBoardName?: string }) => {
      return createTask.mutateAsync(payload);
    },
    [createTask],
  );

  const createSubtask = useCallback(
    async (parentTaskId: string, input: { summary: string }) => {
      if (isAnonymous) {
        return guestStoreHelper.appendSubtask(parentTaskId, input);
      }
      return createSubtaskMutation.mutateAsync({ parentTaskId, input });
    },
    [isAnonymous, createSubtaskMutation],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (isAnonymous) {
        remove(taskId);
        return null;
      }
      return deleteTaskMutation.mutateAsync(taskId);
    },
    [isAnonymous, remove, deleteTaskMutation],
  );

  return {
    createTask: createTaskFn,
    createSubtask,
    updateTask,
    deleteTask,
    isGuest: isAnonymous,
  };
}
