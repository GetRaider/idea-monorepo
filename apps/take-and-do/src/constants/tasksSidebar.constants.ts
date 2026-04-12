export const DRAG_BOARD_KEY = "application/x-task-board-id";
export const DRAG_REORDER_FOLDER_KEY =
  "application/x-tasks-sidebar-folder-reorder";
export const DRAG_REORDER_BOARD_KEY =
  "application/x-tasks-sidebar-board-reorder";
export const ROOT_DROP_ID = "__root__";

export const isRootDrop = (id: string) => id === ROOT_DROP_ID;
