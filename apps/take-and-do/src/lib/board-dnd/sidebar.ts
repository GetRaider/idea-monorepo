/**
 * Tasks sidebar: reorder folders / boards and move boards between folders and root.
 * Used with {@link DndContext} from this package (separate context from board views).
 */

export type SidebarBoardDraggableData = {
  type: "sidebar-board";
  boardId: string;
  /** `null` = root boards */
  folderId: string | null;
};

export type SidebarFolderDraggableData = {
  type: "sidebar-folder";
  folderId: string;
};

export type SidebarDraggableData =
  | SidebarBoardDraggableData
  | SidebarFolderDraggableData;

export type SidebarRootDroppableData = { type: "sidebar-root" };

export type SidebarFolderTargetDroppableData = {
  type: "sidebar-folder-target";
  folderId: string;
};

export type SidebarBoardInsertDroppableData = {
  type: "sidebar-board-insert";
  /** `null` = root list (only when reordering among root boards on-row). */
  folderScope: string | null;
  targetBoardId: string;
};

/** Insert before this top-level row (folder id or root board id). */
export type SidebarTopInsertDroppableData = {
  type: "sidebar-top-insert";
  beforeId: string;
};

export type SidebarTopInsertEndDroppableData = {
  type: "sidebar-top-insert-end";
};

export type SidebarDroppableData =
  | SidebarRootDroppableData
  | SidebarFolderTargetDroppableData
  | SidebarBoardInsertDroppableData
  | SidebarTopInsertDroppableData
  | SidebarTopInsertEndDroppableData;

export const sidebarBoardDraggableId = (boardId: string) =>
  `sidebar-drag-board:${boardId}`;

export const sidebarFolderDraggableId = (folderId: string) =>
  `sidebar-drag-folder:${folderId}`;

export const sidebarRootDroppableId = () => "sidebar-drop-root";

export const sidebarFolderDroppableId = (folderId: string) =>
  `sidebar-drop-folder:${folderId}`;

export const sidebarBoardInsertDroppableId = (
  folderScope: string | null,
  targetBoardId: string,
) => `sidebar-drop-insert:${folderScope ?? "root"}:${targetBoardId}`;

export const sidebarTopInsertDroppableId = (beforeId: string) =>
  `sidebar-drop-top-before:${beforeId}`;

export const sidebarTopInsertEndDroppableId = () =>
  "sidebar-drop-top-insert-end";
