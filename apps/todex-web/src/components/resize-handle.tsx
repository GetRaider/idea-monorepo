"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import { clampPanelWidth } from "@/helpers/panel-layout";

export function ResizeHandle({
  label,
  edge,
  width,
  min,
  max,
  onWidth,
  onCommit,
}: ResizeHandleProps) {
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    let latest = startWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(move: PointerEvent) {
      const delta = move.clientX - startX;
      latest = clampPanelWidth(
        edge === "trailing" ? startWidth + delta : startWidth - delta,
        min,
        max,
      );
      onWidth(latest);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      onCommit(latest);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function nudge(direction: -1 | 1) {
    const signed = edge === "trailing" ? direction : -direction;
    const next = clampPanelWidth(width + signed * 16, min, max);
    onWidth(next);
    onCommit(next);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          nudge(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          nudge(1);
        }
      }}
      className={
        edge === "leading"
          ? "absolute -left-1 top-0 z-30 h-full w-2 cursor-col-resize touch-none hover:bg-foreground/15"
          : "absolute -right-1 top-0 z-30 h-full w-2 cursor-col-resize touch-none hover:bg-foreground/15"
      }
    />
  );
}

interface ResizeHandleProps {
  label: string;
  edge: "leading" | "trailing";
  width: number;
  min: number;
  max: number;
  onWidth: (width: number) => void;
  onCommit: (width: number) => void;
}
