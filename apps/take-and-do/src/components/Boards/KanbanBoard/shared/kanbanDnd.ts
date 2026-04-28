import type { TaskStatus } from "../types";

/**
 * dnd-kit droppable / draggable shapes for the Kanban view. Each `useDroppable`
 * registers a {@link KanbanReorderDroppableData} so the global `onDragEnd`
 * handler can compute the destination column + index without inspecting DOM ids.
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
