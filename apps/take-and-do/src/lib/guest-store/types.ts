import type { Task } from "@/components/Boards/KanbanBoard/types";
import type { Folder, TaskBoard } from "@/types/workspace";

export type GuestStore = {
  tasks: Task[];
  folders: Folder[];
  taskBoards: TaskBoard[];
  expiresAt: string;
};
