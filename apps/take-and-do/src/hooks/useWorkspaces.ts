import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { apiServices } from "@/services/api";
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [isBoardsLoading, setIsBoardsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkspaces = async () => {
      try {
        const [fetchedFolders, fetchedBoards] = await Promise.all([
          apiServices.folders.getAll(),
          apiServices.taskBoards.getAll(),
        ]);
        if (!isMounted) return;
        setFolders(fetchedFolders);
        setTaskBoards(fetchedBoards);
      } catch (error) {
        if (!isMounted) return;
        console.error("[useWorkspaces] Failed to fetch workspaces:", error);
        setFolders([]);
        setTaskBoards([]);
      } finally {
        if (!isMounted) return;
        setIsFoldersLoading(false);
        setIsBoardsLoading(false);
      }
    };

    fetchWorkspaces();
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    folders,
    taskBoards,
    isFoldersLoading,
    isBoardsLoading,
    setFolders,
    setTaskBoards,
  };
}
