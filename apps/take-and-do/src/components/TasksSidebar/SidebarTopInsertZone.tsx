"use client";

import { cn } from "@/lib/styles/utils";
import {
  sidebarTopInsertDroppableId,
  sidebarTopInsertEndDroppableId,
  type SidebarTopInsertDroppableData,
  type SidebarTopInsertEndDroppableData,
  useDroppable,
} from "@/lib/board-dnd";

type SidebarTopInsertZoneProps = {
  beforeId: string;
  isActive: boolean;
};

/** Hit strip between top-level folder/root rows — reorder folders & root boards. */
export function SidebarTopInsertZone({
  beforeId,
  isActive,
}: SidebarTopInsertZoneProps) {
  const data: SidebarTopInsertDroppableData = {
    type: "sidebar-top-insert",
    beforeId,
  };
  const { setNodeRef, isOver, active } = useDroppable({
    id: sidebarTopInsertDroppableId(beforeId),
    data,
  });
  const show = (isActive || isOver) && !!active;

  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "relative w-full shrink-0 transition-[height,margin,background-color] duration-150",
        "h-1 -my-0.5",
        show &&
          "h-2 -my-0.5 rounded-md bg-[rgba(114,85,193,0.22)] shadow-[inset_0_0_0_1px_rgba(114,85,193,0.35)]",
      )}
    >
      {show ? (
        <span className="pointer-events-none absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.22)]" />
      ) : null}
    </div>
  );
}

type SidebarTopInsertEndZoneProps = { isActive: boolean };

export function SidebarTopInsertEndZone({
  isActive,
}: SidebarTopInsertEndZoneProps) {
  const data: SidebarTopInsertEndDroppableData = {
    type: "sidebar-top-insert-end",
  };
  const { setNodeRef, isOver, active } = useDroppable({
    id: sidebarTopInsertEndDroppableId(),
    data,
  });
  const show = (isActive || isOver) && !!active;

  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "relative mt-0 min-h-[6px] w-full shrink-0 rounded-md transition-[min-height,background-color] duration-150",
        show &&
          "min-h-[12px] bg-[rgba(114,85,193,0.2)] shadow-[inset_0_0_0_1px_rgba(114,85,193,0.35)]",
      )}
    >
      {show ? (
        <span className="pointer-events-none absolute inset-x-1 bottom-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-focus-ring shadow-[0_0_0_2px_rgba(114,85,193,0.22)]" />
      ) : null}
    </div>
  );
}
