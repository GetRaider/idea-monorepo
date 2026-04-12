import type { Dispatch, SetStateAction } from "react";

import type { Folder, TaskBoard } from "@/types/workspace";

export type TasksSidebarProps = {
  isOpen: boolean;
  widthPx: number;
  onWidthPxChange: (width: number) => void;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onCreateTaskBoard?: () => void;
  folders: Folder[];
  taskBoards: TaskBoard[];
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
};
