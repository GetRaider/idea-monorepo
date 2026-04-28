import type { TaskStatus } from "@/types/task";

/**
 * Droppable / draggable metadata for List view. Each `useDroppable` registers
 * {@link ListDroppableData} so `onDragEnd` can branch without parsing DOM ids.
 */
export interface ReorderDroppableData {
  type: "reorder";
  status: TaskStatus;
  index: number;
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

export const subtaskDroppableId = (taskId: string): string =>
  `list-subtask-of:${taskId}`;
