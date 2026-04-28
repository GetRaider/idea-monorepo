import type { TaskStatus } from "@/types/task";

/**
 * Droppable / draggable metadata for Kanban view. Each `useDroppable` registers
 * {@link KanbanReorderDroppableData} so `onDragEnd` can resolve column + index.
 */
export interface KanbanReorderDroppableData {
  type: "reorder";
  status: TaskStatus;
  /** Insertion index in the destination column's task array. */
  index: number;
}

export type KanbanDroppableData = KanbanReorderDroppableData;

export interface KanbanCardDraggableData {
  type: "card";
  taskId: string;
  currentStatus: TaskStatus;
}

export type KanbanDraggableData = KanbanCardDraggableData;

export const kanbanReorderDroppableId = (
  status: TaskStatus,
  index: number,
): string => `kanban-reorder:${status}:${index}`;
