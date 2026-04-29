import type { Task } from "@/components/Boards/KanbanBoard/types";
import type { Folder, TaskBoard } from "@/types/workspace";

/** Matches persisted order in `useTasksSidebarOrder` — guest users. */
export type GuestSidebarOrder = {
  topLevelIds: string[];
  boardsInFolder: Record<string, string[]>;
};

export type GuestStore = {
  tasks: Task[];
  folders: Folder[];
  taskBoards: TaskBoard[];
  expiresAt: string;
  sidebarOrder?: GuestSidebarOrder;
};
