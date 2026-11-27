"use client";

import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@repo/ui";
import type { Counter } from "@repo/api/todex";

import { CounterRow } from "./counter-row";

/** A row that can be dragged by its name, and dropped onto to go before it. */
export function DraggableCounterRow({
  groupId,
  counter,
  color,
  selectedDate,
}: {
  groupId: string;
  counter: Counter;
  color: string | null;
  selectedDate?: string;
}) {
  const draggable = useDraggable({ id: counter.id });
  const droppable = useDroppable({
    id: `row:${counter.id}`,
    data: { groupId, beforeId: counter.id } satisfies CounterDrop,
  });
  const isTarget = droppable.isOver && !draggable.isDragging;

  return (
    <CounterRow
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      counter={counter}
      color={color}
      selectedDate={selectedDate}
      handleProps={draggable.listeners}
      className={cn(
        draggable.isDragging && "opacity-40",
        // The line marks where the dragged Counter will go.
        isTarget &&
          "relative before:absolute before:inset-x-3 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-foreground",
      )}
    />
  );
}

/** Dropping on a header puts the Counter at the end of that section. */
export function SectionHeaderZone({
  groupId,
  children,
}: {
  groupId: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useSectionEnd("header", groupId);
  return (
    <div ref={setNodeRef} className={cn("rounded-xl", isOver && "bg-surface")}>
      {children}
    </div>
  );
}

/**
 * The space under a section, which also takes a drop at its end. It is always
 * there, so a drag never shifts the rows.
 */
export function SectionEndZone({
  groupId,
  isEmpty,
}: {
  groupId: string;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useSectionEnd("end", groupId);
  if (isEmpty) {
    return (
      <p
        ref={setNodeRef}
        className={cn(
          "mb-4 rounded-xl border border-dashed border-border py-3 text-center text-xs text-muted-foreground",
          isOver && "bg-surface text-foreground",
        )}
      >
        Drop here
      </p>
    );
  }
  return (
    <div ref={setNodeRef} className="flex h-4 items-center px-3">
      {isOver ? (
        <span className="h-0.5 w-full rounded-full bg-foreground" />
      ) : null}
    </div>
  );
}

function useSectionEnd(place: "header" | "end", groupId: string) {
  return useDroppable({
    id: `${place}:${groupId}`,
    data: { groupId, beforeId: null } satisfies CounterDrop,
  });
}

export interface CounterDrop {
  groupId: string;
  beforeId: string | null;
}
