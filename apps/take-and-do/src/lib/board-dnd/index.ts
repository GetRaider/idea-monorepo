/**
 * Single entry point for app drag-and-drop (@dnd-kit): task boards (Kanban/List)
 * and tasks sidebar workspace tree.
 */
export {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
export type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
export { CSS } from "@dnd-kit/utilities";

export {
  BOARD_AUTO_SCROLL,
  BOARD_DROP_MEASURING,
  BOARD_POINTER_DRAG_DISTANCE_PX,
  useBoardPointerSensors,
} from "./config";
export { listBoardCollisionDetection } from "./collision";
export { sidebarCollisionDetection } from "./sidebarCollision";
export * from "./kanban";
export * from "./list";
export * from "./sidebar";
