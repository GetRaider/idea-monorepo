"use client";

import type { ReactNode } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@repo/ui";
import type { Counter } from "@repo/api/todex";

import { CounterRow } from "./counter-row";

/** A row that can be dragged by its name, and dropped onto to go before it. */
export function DraggableCounterRow({
  groupId,
  counter,
  selectedDate,
}: {
  groupId: string;
  counter: Counter;
  selectedDate?: string;
}) {
  const isSectionDrag = useDragKind() === "section";
  const draggable = useDraggable({
    id: counter.id,
    data: { kind: "counter" } satisfies CounterDrag,
  });
  const droppable = useDroppable({
    id: `row:${counter.id}`,
    data: { groupId, beforeId: counter.id } satisfies CounterDrop,
    disabled: isSectionDrag,
  });
  const isTarget = droppable.isOver && !draggable.isDragging;

  return (
    <CounterRow
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      counter={counter}
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

/**
 * A section heading. A Counter dropped on it goes to the section's end; the
 * user's own sections can be dragged by it onto one another.
 */
export function SectionHeader({
  groupId,
  sectionId,
  children,
  menu,
}: {
  groupId: string;
  /** Null for the "No section" heading, which stays last. */
  sectionId: string | null;
  children: ReactNode;
  menu?: ReactNode;
}) {
  const draggable = useDraggable({
    id: `section:${groupId}`,
    data: { kind: "section", sectionId: groupId } satisfies CounterDrag,
    disabled: sectionId === null,
  });
  const droppable = useSectionEnd("header", groupId, false);

  return (
    <div
      ref={(node) => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      className={cn(
        "mb-2 flex items-center gap-1 rounded-xl",
        droppable.isOver && !draggable.isDragging && "bg-surface",
        draggable.isDragging && "opacity-40",
      )}
    >
      {/* The menu stays outside, so using it never starts a drag. */}
      <div {...draggable.listeners} className="flex min-w-0 items-center">
        {children}
      </div>
      {menu}
    </div>
  );
}

/**
 * The space under a section, which also takes a Counter at its end. It is
 * always there, so a drag never shifts the rows.
 */
export function SectionEndZone({
  groupId,
  isEmpty,
}: {
  groupId: string;
  isEmpty: boolean;
}) {
  const isSectionDrag = useDragKind() === "section";
  const { setNodeRef, isOver } = useSectionEnd("end", groupId, isSectionDrag);
  if (isEmpty) {
    return (
      <p
        ref={setNodeRef}
        className={cn(
          "mb-4 rounded-xl border border-dashed border-border py-3 text-center text-xs text-muted-foreground",
          isOver && "bg-surface text-foreground",
        )}
      >
        Drop counters here
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

function useSectionEnd(
  place: "header" | "end",
  groupId: string,
  disabled: boolean,
) {
  return useDroppable({
    id: `${place}:${groupId}`,
    data: { groupId, beforeId: null } satisfies CounterDrop,
    disabled,
  });
}

function useDragKind() {
  const { active } = useDndContext();
  return (active?.data.current as CounterDrag | undefined)?.kind;
}

export type CounterDrag =
  | { kind: "counter" }
  | { kind: "section"; sectionId: string };

export interface CounterDrop {
  groupId: string;
  beforeId: string | null;
}
