import type { Task, TaskStatus } from "@/components/Boards/KanbanBoard/types";

export interface Folder {
  id: string;
  name: string;
  emoji?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskBoard {
  id: string;
  isPublic: boolean;
  name: string;
  emoji?: string | null;
  folderId?: string | null; // nullable if board not in a folder
  createdAt: Date;
  updatedAt: Date;
}

export type TaskBoardWithTasks = TaskBoard & {
  tasks: Record<TaskStatus, Task[]>;
};

export interface ScheduledTasksResponse {
  today: Task[];
  tomorrow: Task[];
}
