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
    const fetchWorkspaces = async () => {
      const [fetchedFolders, fetchedBoards] = await Promise.all([
        apiServices.folders.getAll(),
        apiServices.taskBoards.getAll(),
      ]);
      setFolders(fetchedFolders);
      setTaskBoards(fetchedBoards);
      setIsFoldersLoading(false);
      setIsBoardsLoading(false);
    };
    fetchWorkspaces();
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
