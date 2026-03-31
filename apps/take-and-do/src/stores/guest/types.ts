import type { Task } from "@/components/Boards/KanbanBoard/types";
import type { Folder, TaskBoard } from "@/types/workspace";

/** Matches `OrderState` in `useTasksSidebarOrder` — persisted for guest users. */
export type GuestSidebarOrder = {
  folderIds: string[];
  rootBoardIds: string[];
  boardsInFolder: Record<string, string[]>;
};

export type GuestStore = {
  tasks: Task[];
  folders: Folder[];
  taskBoards: TaskBoard[];
  expiresAt: string;
  sidebarOrder?: GuestSidebarOrder;
};
