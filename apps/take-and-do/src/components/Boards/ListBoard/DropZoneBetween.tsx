"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

import { cn } from "@/lib/styles/utils";

import { TaskStatus } from "../KanbanBoard/types";
import { reorderDroppableId, type ReorderDroppableData } from "./listDnd";

interface DropZoneBetweenProps {
  status: TaskStatus;
  /** Where the dragged task should be inserted in the target status array. */
  index: number;
  /**
   * "default": a thin between-row strip with a horizontal indicator line.
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
          "rounded-2xl px-1 py-1 transition-colors",
          showIndicator &&
            "bg-focus-ring/[0.08] ring-2 ring-inset ring-focus-ring/50",
        )}
      >
        {children}
      </div>
    );
  }

  // Layout height stays small (12px), but the negative margin extends the
  // bounding rect 4px into each adjacent row. That gives dnd-kit a forgiving
  // ~20px hit area for "drop before/after" without changing the visual gap —
  // and the custom collision detection in `ListBoard` prefers reorder zones
  // over the surrounding subtask zones so this overlap is unambiguous.
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className="pointer-events-none relative -my-1 h-5 w-full"
    >
      {showIndicator ? (
        <span className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.18)]" />
      ) : null}
    </div>
  );
}
