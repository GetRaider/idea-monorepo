"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { GUEST_STORE_UPDATED_EVENT } from "@/stores/guest/constants";
import { guestStoreHelper } from "@/stores/guest";
import { clientServices } from "@/services";
import { Folder, TaskBoard } from "@/types/workspace";

interface UseWorkspacesReturn {
  folders: Folder[];
  taskBoards: TaskBoard[];
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
}

export function useWorkspaces(): UseWorkspacesReturn {
  const isAnonymous = useIsAnonymous();
  const queryClient = useQueryClient();

  const [guestFolders, setGuestFolders] = useState<Folder[]>([]);
  const [guestBoards, setGuestBoards] = useState<TaskBoard[]>([]);

  const foldersQuery = useQuery({
    queryKey: queryKeys.folders,
    queryFn: () => clientServices.folders.getAll(),
    enabled: !isAnonymous,
  });

  const boardsQuery = useQuery({
    queryKey: queryKeys.taskBoards.all,
    queryFn: () => clientServices.taskBoards.getAll(),
    enabled: !isAnonymous,
  });

  useEffect(() => {
    if (isAnonymous) {
      const sync = () => {
        setGuestFolders(guestStoreHelper.getFolders());
        setGuestBoards(guestStoreHelper.getTaskBoards());
      };
      sync();
      window.addEventListener(GUEST_STORE_UPDATED_EVENT, sync);
      return () => window.removeEventListener(GUEST_STORE_UPDATED_EVENT, sync);
    }
  }, [isAnonymous]);

  const folders = isAnonymous ? guestFolders : (foldersQuery.data ?? []);
  const taskBoards = isAnonymous ? guestBoards : (boardsQuery.data ?? []);

  const isFoldersLoading = isAnonymous ? false : foldersQuery.isPending;
  const isBoardsLoading = isAnonymous ? false : boardsQuery.isPending;

  const setFolders = useCallback(
    (updater: SetStateAction<Folder[]>) => {
      if (isAnonymous) {
        setGuestFolders((prev) =>
          typeof updater === "function" ? updater(prev) : updater,
        );
        return;
      }
      queryClient.setQueryData<Folder[]>(queryKeys.folders, (previous) => {
        const prev = previous ?? [];
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    [isAnonymous, queryClient],
  );

  const setTaskBoards = useCallback(
    (updater: SetStateAction<TaskBoard[]>) => {
      if (isAnonymous) {
        setGuestBoards((prev) =>
          typeof updater === "function" ? updater(prev) : updater,
        );
        return;
      }
      queryClient.setQueryData<TaskBoard[]>(
        queryKeys.taskBoards.all,
        (previous) => {
          const prev = previous ?? [];
          return typeof updater === "function" ? updater(prev) : updater;
        },
      );
    },
    [isAnonymous, queryClient],
  );

  return {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  };
}
