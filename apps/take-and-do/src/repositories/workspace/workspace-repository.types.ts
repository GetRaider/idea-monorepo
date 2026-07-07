import type { Dispatch, SetStateAction } from "react";

import type { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import type { TaskPriority, TaskStatus } from "@/types/task";
import type { Folder, TaskBoard } from "@/types/workspace";

export interface WorkspaceRepository {
  useLocalWorkspace: boolean;
  folders: Folder[];
  taskBoards: TaskBoard[];
  tasks: Task[];
  isFoldersLoading: boolean;
  isBoardsLoading: boolean;
  isTasksLoading: boolean;
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  setTaskBoards: Dispatch<SetStateAction<TaskBoard[]>>;
  createFolder: (params: {
    name: string;
    emoji?: string | null;
  }) => Promise<Folder | null>;
  updateFolder: (params: {
    id: string;
    updates: WorkspaceFolderUpdate;
  }) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<void>;
  createTaskBoard: (
    payload: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ) => Promise<TaskBoard | null>;
  updateTaskBoard: (params: {
    id: string;
    updates: WorkspaceTaskBoardUpdate;
  }) => Promise<TaskBoard | null>;
  deleteTaskBoard: (id: string) => Promise<void>;
  changeBoardVisibility: (params: {
    board: TaskBoard;
    toPublic: boolean;
  }) => Promise<TaskBoard | null>;
  createTask: (
    payload: Omit<Task, "id"> & { taskBoardName?: string },
  ) => Promise<Task | null>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<null>;
  createSubtask: (
    parentTaskId: string,
    input: WorkspaceSubtaskInput,
  ) => Promise<Task | null>;
  afterMutation: () => Promise<void>;
}

export interface WorkspaceFolderUpdate {
  name?: string;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}

export interface WorkspaceTaskBoardUpdate {
  name?: string;
  folderId?: string | null;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}

export interface WorkspaceSubtaskInput {
  summary: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface WorkspaceTaskFilter {
  taskBoardId?: string;
  date?: Date;
}
