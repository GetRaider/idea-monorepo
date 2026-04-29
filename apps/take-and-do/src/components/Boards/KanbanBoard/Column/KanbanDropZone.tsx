"use client";

import { cn } from "@/lib/styles/utils";
import {
  kanbanReorderDroppableId,
  type KanbanReorderDroppableData,
  useDroppable,
} from "@/lib/board-dnd";

import { TaskStatus } from "../types";

interface KanbanDropZoneProps {
  status: TaskStatus;
  /** Insertion index when this zone is dropped on. */
  index: number;
  /**
   * "between": thin horizontal indicator between cards.
   * "empty":   invisible full-height droppable when the column has no tasks
   *            (insert at index 0; no placeholder UI).
   * "fill":    grows to fill the rest of the column body so the user can drop
   *            onto any empty space below the last card and have it land at
   *            the end of the list.
   */
  variant?: "between" | "empty" | "fill";
}

export function KanbanDropZone({
  status,
  index,
  variant = "between",
}: KanbanDropZoneProps) {
  const data: KanbanReorderDroppableData = { type: "reorder", status, index };
  const { setNodeRef, isOver, active } = useDroppable({
    id: kanbanReorderDroppableId(status, index),
    data,
  });
  const showIndicator = isOver && !!active;

  if (variant === "empty") {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "relative w-full min-w-0 flex-1 min-h-[80px] rounded-xl transition-colors duration-150",
          showIndicator && "bg-focus-ring/[0.04]",
        )}
        aria-label={`Drop here to add a task to ${status}`}
      >
        {showIndicator ? (
          <span className="pointer-events-none absolute inset-x-1 top-[18%] h-[2px] rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
        ) : null}
      </div>
    );
  }

  if (variant === "fill") {
    // Grows to fill remaining vertical space in the column so users can drop
    // anywhere below the last card and have it land at the end of the list.
    // `min-h` keeps it usable in non-scrolling (multi-board) layouts.
    return (
      <div
        ref={setNodeRef}
        aria-hidden
        className={cn(
          "relative -mt-1.5 min-h-[80px] flex-1 rounded-xl transition-colors duration-150",
          showIndicator && "bg-focus-ring/[0.04]",
        )}
      >
        {showIndicator ? (
          <span className="pointer-events-none absolute inset-x-1 top-1.5 h-[2px] -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
        ) : null}
      </div>
    );
  }

  // The wrapper keeps the visual gap at ~12px (h-3) while extending its
  // bounding rect 6px into the cards above and below via negative margin —
  // this gives the droppable a forgiving 24px hit area for dnd-kit's
  // `pointerWithin` collision check without changing the layout. Cards are
  // draggables, not droppables, so the overlap doesn't interfere with their
  // own collision logic.
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "pointer-events-none relative w-full transition-[height,margin] duration-150",
        // Default gap: visually ~12px, but hit rect is ~24px via -my.
        "h-6 -my-1.5",
        // When actively hovered, expand the gap so surrounding cards shift and
        // the user gets the expected \"items move out of the way\" behaviour.
        showIndicator && "h-12 -my-3",
      )}
    >
      {showIndicator ? (
        <span className="absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
      ) : null}
    </div>
  );
}
