"use client";

import { useCallback, useRef, type PointerEvent } from "react";

import { clampTasksSidebarWidthPx } from "@/helpers/tasks-sidebar-layout";
import { cn } from "@/lib/utils";

export function TasksSidebarResizeHandle({
  widthPx,
  onWidthPxChange,
}: TasksSidebarResizeHandleProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = {
        startX: event.clientX,
        startWidth: widthPx,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [widthPx],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!dragRef.current) return;
      const delta = event.clientX - dragRef.current.startX;
      onWidthPxChange(
        clampTasksSidebarWidthPx(dragRef.current.startWidth + delta),
      );
    },
    [onWidthPxChange],
  );

  const endDrag = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  }, []);

  return (
    <button
      type="button"
      aria-label={`Resize tasks sidebar, ${widthPx} pixels wide`}
      className={cn(
        "absolute right-0 top-1/2 z-[95] -translate-y-1/2 translate-x-1/2",
        "flex h-7 w-7 touch-none cursor-ew-resize items-center justify-center rounded-full",
        "border border-border-app bg-nav-sidebar-bg text-text-secondary shadow-md",
        "hover:border-focus-ring hover:text-text-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span
        className="h-0.5 w-2 rounded-full bg-current opacity-70"
        aria-hidden
      />
    </button>
  );
}

interface TasksSidebarResizeHandleProps {
  widthPx: number;
  onWidthPxChange: (width: number) => void;
}
