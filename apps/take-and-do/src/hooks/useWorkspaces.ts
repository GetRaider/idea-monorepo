import { useEffect, useState } from "react";

import { apiServices } from "@/services/api";
import { Folder, TaskBoard } from "@/types/workspace";

interface UseWorkspacesReturn {
  folders: Folder[];
  taskBoards: TaskBoard[];
  areFoldersLoading: boolean;
  areBoardsLoading: boolean;
  setTaskBoards: (taskBoards: TaskBoard[]) => void;
  setFolders: (folders: Folder[]) => void;
}

export function useWorkspaces(): UseWorkspacesReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [areFoldersLoading, setAreFoldersLoading] = useState(true);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>([]);
  const [areBoardsLoading, setAreBoardsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const [folders, taskBoards] = await Promise.all([
        apiServices.folders.getAll(),
        apiServices.taskBoards.getAll(),
      ]);
      setFolders(folders);
      setTaskBoards(taskBoards);
      setAreFoldersLoading(false);
      setAreBoardsLoading(false);
    };
    fetchWorkspaces();
  }, []);

  return {
    folders,
    taskBoards,
    areFoldersLoading,
    areBoardsLoading,
    setTaskBoards,
    setFolders,
  };
}
