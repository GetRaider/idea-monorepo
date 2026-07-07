"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, type SetStateAction } from "react";

import type { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { applyTaskScheduleToPersistedCalendar } from "@/hooks/calendar/task-calendar-local-sync";
import { useUser } from "@/contexts/UserContext";
import {
  changeGuestBoardVisibility,
  createGuestFolder,
  createGuestTask,
  createGuestTaskBoard,
  deleteGuestFolder,
  deleteGuestTask,
  deleteGuestTaskBoard,
  updateGuestFolder,
  updateGuestTask,
  updateGuestTaskBoard,
} from "@/hooks/workspace/guest-workspace.actions";
import { useGuestWorkspace } from "@/hooks/workspace/useGuestWorkspace";
import {
  invalidateTaskDataQueries,
  invalidateWorkspaceQueries,
} from "@/lib/invalidate-app-queries";
import { queryKeys } from "@/lib/query-keys";
import { clientServices } from "@/services";
import { guestStoreHelper } from "@/stores/guest";
import type { Folder, TaskBoard } from "@/types/workspace";

import type {
  WorkspaceFolderUpdate,
  WorkspaceRepository,
  WorkspaceSubtaskInput,
  WorkspaceTaskBoardUpdate,
} from "./workspace-repository.types";

export function useWorkspaceRepositoryValue(): WorkspaceRepository {
  const { isGuest } = useUser();
  const queryClient = useQueryClient();
  const guestWorkspace = useGuestWorkspace();
  const useLocalWorkspace = isGuest;

  const foldersQuery = useQuery({
    queryKey: queryKeys.folders,
    queryFn: () => clientServices.folders.getAll(),
    enabled: !useLocalWorkspace,
  });

  const boardsQuery = useQuery({
    queryKey: queryKeys.taskBoards.all,
    queryFn: () => clientServices.taskBoards.getAll(),
    enabled: !useLocalWorkspace,
  });

  const allTasksQuery = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => clientServices.tasks.getAll(),
    enabled: !useLocalWorkspace,
  });

  const folders = useLocalWorkspace
    ? guestWorkspace.folders
    : (foldersQuery.data ?? []);
  const taskBoards = useLocalWorkspace
    ? guestWorkspace.taskBoards
    : (boardsQuery.data ?? []);
  const tasks = useLocalWorkspace
    ? guestWorkspace.tasks
    : (allTasksQuery.data ?? []);

  const isFoldersLoading = useLocalWorkspace ? false : foldersQuery.isPending;
  const isBoardsLoading = useLocalWorkspace ? false : boardsQuery.isPending;
  const isTasksLoading = useLocalWorkspace ? false : allTasksQuery.isPending;

  const afterRegisteredMutation = useCallback(async () => {
    if (useLocalWorkspace) return;
    await invalidateWorkspaceQueries(queryClient);
  }, [queryClient, useLocalWorkspace]);

  const afterTaskMutation = useCallback(async () => {
    if (useLocalWorkspace) return;
    await invalidateTaskDataQueries(queryClient);
  }, [queryClient, useLocalWorkspace]);

  const afterMutation = afterRegisteredMutation;

  const setFolders = useCallback(
    (updater: SetStateAction<Folder[]>) => {
      if (useLocalWorkspace) return;
      queryClient.setQueryData<Folder[]>(queryKeys.folders, (previous) => {
        const previousFolders = previous ?? [];
        return typeof updater === "function"
          ? updater(previousFolders)
          : updater;
      });
    },
    [queryClient, useLocalWorkspace],
  );

  const setTaskBoards = useCallback(
    (updater: SetStateAction<TaskBoard[]>) => {
      if (useLocalWorkspace) return;
      queryClient.setQueryData<TaskBoard[]>(
        queryKeys.taskBoards.all,
        (previous) => {
          const previousBoards = previous ?? [];
          return typeof updater === "function"
            ? updater(previousBoards)
            : updater;
        },
      );
    },
    [queryClient, useLocalWorkspace],
  );

  const createFolder = useCallback(
    async (params: { name: string; emoji?: string | null }) => {
      if (useLocalWorkspace)
        return createGuestFolder(params.name, params.emoji);
      const folder = await clientServices.folders.create(params);
      if (folder) await afterRegisteredMutation();
      return folder;
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const updateFolder = useCallback(
    async ({ id, updates }: { id: string; updates: WorkspaceFolderUpdate }) => {
      if (useLocalWorkspace) {
        return updateGuestFolder(id, {
          name: updates.name,
          emoji: updates.emoji,
          isPublic: updates.isPublic,
        });
      }
      const folder = await clientServices.folders.update({ id, updates });
      if (folder) await afterRegisteredMutation();
      return folder;
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (useLocalWorkspace) {
        deleteGuestFolder(id);
        return;
      }
      await clientServices.folders.deleteFolder(id);
      await afterRegisteredMutation();
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const createTaskBoard = useCallback(
    async (payload: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">) => {
      if (useLocalWorkspace) return createGuestTaskBoard(payload);
      const board = await clientServices.taskBoards.create(payload);
      if (board) await afterRegisteredMutation();
      return board;
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const updateTaskBoard = useCallback(
    async ({
      id,
      updates,
    }: {
      id: string;
      updates: WorkspaceTaskBoardUpdate;
    }) => {
      if (useLocalWorkspace) {
        return updateGuestTaskBoard(id, {
          name: updates.name,
          emoji: updates.emoji,
          folderId: updates.folderId,
          isPublic: updates.isPublic,
        });
      }
      const board = await clientServices.taskBoards.update({ id, updates });
      if (board) await afterRegisteredMutation();
      return board;
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const deleteTaskBoard = useCallback(
    async (id: string) => {
      if (useLocalWorkspace) {
        deleteGuestTaskBoard(id);
        return;
      }
      await clientServices.taskBoards.deleteBoard(id);
      await afterRegisteredMutation();
    },
    [afterRegisteredMutation, useLocalWorkspace],
  );

  const changeBoardVisibility = useCallback(
    async ({ board, toPublic }: { board: TaskBoard; toPublic: boolean }) => {
      if (useLocalWorkspace) return changeGuestBoardVisibility(board, toPublic);
      return clientServices.taskBoards.changeVisibility({
        id: board.id,
        toPublic,
        boardSnapshot: board,
      });
    },
    [useLocalWorkspace],
  );

  const createTask = useCallback(
    async (payload: Omit<Task, "id"> & { taskBoardName?: string }) => {
      if (useLocalWorkspace) return createGuestTask(payload);
      const task = await clientServices.tasks.create(payload);
      if (task) await afterTaskMutation();
      return task;
    },
    [afterTaskMutation, useLocalWorkspace],
  );

  const updateTask = useCallback(
    async (taskId: string, updates: TaskUpdate) => {
      if (useLocalWorkspace) {
        const result = updateGuestTask(taskId, updates);
        if (result && "scheduleDate" in updates) {
          applyTaskScheduleToPersistedCalendar({
            taskId: result.id,
            taskBoardId: result.taskBoardId,
            taskTitle: result.summary,
            scheduleDate: result.scheduleDate,
          });
        }
        return result;
      }
      const task = await clientServices.tasks.update({ taskId, updates });
      if (task) await afterTaskMutation();
      return task;
    },
    [afterTaskMutation, useLocalWorkspace],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (useLocalWorkspace) {
        deleteGuestTask(taskId);
        return null;
      }
      await clientServices.tasks.deleteById(taskId);
      await afterTaskMutation();
      return null;
    },
    [afterTaskMutation, useLocalWorkspace],
  );

  const createSubtask = useCallback(
    async (parentTaskId: string, input: WorkspaceSubtaskInput) => {
      if (useLocalWorkspace) {
        return guestStoreHelper.appendSubtask(parentTaskId, {
          summary: input.summary,
        });
      }
      const task = await clientServices.tasks.createSubtask(
        parentTaskId,
        input,
      );
      if (task) await afterTaskMutation();
      return task;
    },
    [afterTaskMutation, useLocalWorkspace],
  );

  return {
    useLocalWorkspace,
    folders,
    taskBoards,
    tasks,
    isFoldersLoading,
    isBoardsLoading,
    isTasksLoading,
    setFolders,
    setTaskBoards,
    createFolder,
    updateFolder,
    deleteFolder,
    createTaskBoard,
    updateTaskBoard,
    deleteTaskBoard,
    changeBoardVisibility,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    afterMutation,
  };
}
