"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@repo/ui";
import type { Counter } from "@repo/api/todex";

import { ChevronIcon } from "@components/icons";

import { useTasks } from "../tasks-provider";
import {
  counterMove,
  groupBySpace,
  type CounterGroup,
} from "./counter-helpers";
import { CounterRow } from "./counter-row";
import {
  DraggableCounterRow,
  SectionEndZone,
  SectionHeaderZone,
  type CounterDrop,
} from "./draggable-counter-row";
import { useMoveCounter } from "./use-counters";

/** Counter rows under a collapsible header per space. */
export function CounterSections({
  counters,
  selectedColumn = null,
  renderAction,
}: {
  counters: Counter[];
  /** Narrows the rows to Counters scheduled on this day of their week. */
  selectedColumn?: number | null;
  /** Replaces the day strip; such rows cannot be dragged. */
  renderAction?: (counter: Counter) => ReactNode;
}) {
  const {
    state: { boards },
  } = useTasks();
  const move = useMoveCounter();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const sensors = useSensors(
    // A short distance keeps a click on a name a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const isDragging = draggedId !== null;
  const dragged = counters.find((counter) => counter.id === draggedId);
  const sections = groupBySpace(counters, boards, { includeEmpty: true })
    .map((group) => ({ ...group, shown: shownIn(group) }))
    // Empty sections appear during a drag, so a Counter can be moved into them.
    .filter((section) => isDragging || section.shown.length > 0)
    // They go last, so starting a drag moves nothing already on screen.
    .sort(
      (left, right) =>
        Number(left.shown.length === 0) - Number(right.shown.length === 0),
    );

  function toggle(groupId: string, open: boolean) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (open) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function drop(event: DragEndEvent) {
    setDraggedId(null);
    const target = event.over?.data.current as CounterDrop | undefined;
    const group = sections.find((item) => item.id === target?.groupId);
    if (!target || !group) return;
    const counterId = String(event.active.id);
    const change = counterMove(group, counterId, target.beforeId);
    if (change) move.mutate({ counterId, ...change });
  }

  function shownIn(group: CounterGroup) {
    if (selectedColumn === null) return group.counters;
    return group.counters.filter(
      (counter) => counter.week[selectedColumn]?.tracked,
    );
  }

  function renderRow(counter: Counter, group: CounterGroup) {
    if (renderAction) {
      return (
        <CounterRow
          key={counter.id}
          counter={counter}
          color={group.color}
          action={renderAction(counter)}
        />
      );
    }
    return (
      <DraggableCounterRow
        key={counter.id}
        groupId={group.id}
        counter={counter}
        color={group.color}
        selectedDate={
          selectedColumn === null
            ? undefined
            : counter.week[selectedColumn]?.date
        }
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => setDraggedId(String(event.active.id))}
      onDragCancel={() => setDraggedId(null)}
      onDragEnd={drop}
    >
      <div>
        {sections.map((section) => {
          const open = !collapsed.has(section.id);
          return (
            <Collapsible
              key={section.id}
              open={open}
              onOpenChange={(next) => toggle(section.id, next)}
            >
              <SectionHeaderZone groupId={section.id}>
                <CollapsibleTrigger className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ChevronIcon
                    size={12}
                    className={cn("text-muted-foreground", open && "rotate-90")}
                  />
                  {section.name}
                  <span className="font-normal text-muted-foreground">
                    {section.shown.length}
                  </span>
                </CollapsibleTrigger>
              </SectionHeaderZone>
              <CollapsibleContent>
                <ul className="flex flex-col gap-2">
                  {section.shown.map((counter) => renderRow(counter, section))}
                </ul>
              </CollapsibleContent>
              <SectionEndZone
                groupId={section.id}
                isEmpty={section.shown.length === 0}
              />
            </Collapsible>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {dragged ? (
          <p className="w-fit max-w-xs cursor-grabbing truncate rounded-xl border border-border bg-popover px-4 py-3 text-sm font-medium shadow-md">
            {dragged.name}
          </p>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
