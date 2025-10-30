import { Task } from "@/components/KanbanBoard/KanbanBoard";

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskBoard {
  id: string;
  name: string;
  folderId?: string | null; // nullable if board not in a folder
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledTasksResponse {
  today: Task[];
  tomorrow: Task[];
}
