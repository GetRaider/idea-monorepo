"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { useIsAnonymous } from "@/hooks/use-is-anonymous";
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);

  useEffect(() => {
    if (isAnonymous) {
      const sync = () => {
        setFolders(guestStoreHelper.getFolders());
        setTaskBoards(guestStoreHelper.getTaskBoards());
      };
      sync();
      setIsFoldersLoading(false);
      setIsBoardsLoading(false);
      window.addEventListener(GUEST_STORE_UPDATED_EVENT, sync);
      return () => window.removeEventListener(GUEST_STORE_UPDATED_EVENT, sync);
    }

    let isMounted = true;

    const fetchWorkspaces = async () => {
      try {
        const [fetchedFolders, fetchedBoards] = await Promise.all([
          clientServices.folders.getAll(),
          clientServices.taskBoards.getAll(),
        ]);
        if (!isMounted) return;
        setFolders(fetchedFolders);
        setTaskBoards(fetchedBoards);
      } finally {
        if (!isMounted) return;
        setIsFoldersLoading(false);
        setIsBoardsLoading(false);
      }
    };

    void fetchWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [isAnonymous]);

  return {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  };
}
