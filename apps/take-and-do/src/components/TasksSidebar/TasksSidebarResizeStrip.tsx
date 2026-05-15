"use client";

import { useCallback, useRef, type PointerEvent } from "react";

import { clampTasksSidebarWidthPx } from "@/helpers/tasks-sidebar-layout";
import { cn } from "@/lib/styles/utils";

export function TasksSidebarResizeStrip({
  widthPx,
  onWidthPxChange,
}: TasksSidebarResizeStripProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
    (event: PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const delta = event.clientX - dragRef.current.startX;
      onWidthPxChange(
        clampTasksSidebarWidthPx(dragRef.current.startWidth + delta),
      );
    },
    [onWidthPxChange],
  );

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  }, []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize tasks sidebar, ${widthPx} pixels wide`}
      className={cn(
        "absolute right-0 top-0 z-[94] h-full w-2.5 touch-none cursor-ew-resize",
        "hover:bg-white/[0.04]",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}

interface TasksSidebarResizeStripProps {
  widthPx: number;
  onWidthPxChange: (width: number) => void;
}
