"use client";

import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { Folder, TaskBoard } from "@/types/workspace";

interface WorkspaceContextValue {
  folders: Folder[];
  taskBoards: TaskBoard[];
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
