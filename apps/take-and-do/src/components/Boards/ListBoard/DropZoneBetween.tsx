"use client";

import type { ReactNode } from "react";

import {
  reorderDroppableId,
  type ReorderDroppableData,
  useDroppable,
} from "@/lib/board-dnd";
import { cn } from "@/lib/styles/utils";

import { TaskStatus } from "../KanbanBoard/types";

interface DropZoneBetweenProps {
  status: TaskStatus;
  /** Where the dragged task should be inserted in the target status array. */
  index: number;
  /**
   * "default": a thin between-row strip with a horizontal indicator line (also
   * used after the last task — same rhythm as gaps between rows).
   * "empty-section": a larger drop area used when a section has no rows.
   */
  variant?: "default" | "empty-section";
  children?: ReactNode;
}

export function DropZoneBetween({
  status,
  index,
  variant = "default",
  children,
}: DropZoneBetweenProps) {
  const data: ReorderDroppableData = { type: "reorder", status, index };
  const { setNodeRef, isOver, active } = useDroppable({
    id: reorderDroppableId(status, index),
    data,
  });

  const showIndicator = isOver && !!active;

  if (variant === "empty-section") {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          // The parent `ListSection` draws the active purple ring; keep this
          // drop target visually neutral to avoid a "double highlight" effect.
          "relative rounded-2xl px-1 py-1",
        )}
      >
        {children}
        {showIndicator ? (
          <span className="pointer-events-none absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
        ) : null}
      </div>
    );
  }

  // Layout height stays small (12px), but the negative margin extends the
  // bounding rect 4px into each adjacent row. That gives dnd-kit a forgiving
  // ~20px hit area for "drop before/after" without changing the visual gap.
  // `listBoardCollisionDetection` in `@/lib/board-dnd` prefers reorder zones
  // over subtask zones when both overlap the pointer.
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "pointer-events-none relative w-full transition-[height,margin] duration-150",
        // Default: small visual gap but forgiving hit rect via -my.
        "h-6 -my-1.5",
        // While hovered, expand so surrounding rows shift and the user gets
        // predictable before/after placement.
        showIndicator && "h-12 -my-3",
      )}
    >
      {showIndicator ? (
        <span className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
      ) : null}
    </div>
  );
}
