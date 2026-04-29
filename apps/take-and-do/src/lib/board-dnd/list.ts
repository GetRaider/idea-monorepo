import type { TaskStatus } from "@/types/task";

/**
 * Droppable / draggable metadata for List view. Each `useDroppable` registers
 * {@link ListDroppableData} so `onDragEnd` can branch without parsing DOM ids.
 */
export interface ReorderDroppableData {
  type: "reorder";
  status: TaskStatus;
  index: number;
  /** List board: drop target on a collapsed section header (resolve above following zones). */
  collapsedSectionHeader?: boolean;
}

export interface SubtaskDroppableData {
  type: "subtask";
  taskId: string;
}

export type ListDroppableData = ReorderDroppableData | SubtaskDroppableData;

export interface TaskDraggableData {
  type: "task";
  taskId: string;
  currentStatus: TaskStatus;
  hasChildren: boolean;
}

export interface SubtaskDraggableData {
  type: "subtask";
  taskId: string;
  parentTaskId: string;
  currentStatus: TaskStatus;
}

export type ListDraggableData = TaskDraggableData | SubtaskDraggableData;

export const reorderDroppableId = (status: TaskStatus, index: number): string =>
  `list-reorder:${status}:${index}`;

/** Collapsed list section header — separate id so it never conflicts with `reorderDroppableId(status, tasks.length)` when expanding/collapsing. */
export const collapsedSectionDroppableId = (status: TaskStatus): string =>
  `list-reorder-collapsed:${status}`;

export const subtaskDroppableId = (taskId: string): string =>
  `list-subtask-of:${taskId}`;
