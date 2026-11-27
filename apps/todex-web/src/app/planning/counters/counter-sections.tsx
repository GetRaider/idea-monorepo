"use client";

import { useRef, useState, type ReactNode } from "react";
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
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import type { Counter, CounterSection } from "@repo/api/todex";

import { ChevronIcon, EllipsisIcon } from "@components/icons";

import {
  DraggableCounterRow,
  SectionEndZone,
  SectionHeader,
  type CounterDrag,
  type CounterDrop,
} from "./counter-drag";
import {
  counterMove,
  groupBySection,
  NO_SECTION_ID,
  sectionMove,
  type CounterGroup,
} from "./counter-helpers";
import { CounterRow } from "./counter-row";
import { SectionNameDialog } from "./section-name-dialog";
import { useMoveCounter, useSectionActions } from "./use-counters";

/** Counter rows under the user's own collapsible sections. */
export function CounterSections({
  counters,
  sections,
  selectedColumn = null,
  renderAction,
}: {
  counters: Counter[];
  sections: CounterSection[];
  /** Narrows the rows to Counters scheduled on this day of their week. */
  selectedColumn?: number | null;
  /** Replaces the day strip; such rows cannot be dragged. */
  renderAction?: (counter: Counter) => ReactNode;
}) {
  const move = useMoveCounter();
  const sectionActions = useSectionActions();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [drag, setDrag] = useState<{ id: string; data: CounterDrag }>();
  const [renaming, setRenaming] = useState<CounterGroup>();
  const renameAfterClose = useRef<CounterGroup | null>(null);
  const sensors = useSensors(
    // A short distance keeps a click on a name a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  // The user's empty sections show unless the list is narrowed.
  const showsEmpty = !renderAction && selectedColumn === null;
  const groups = groupBySection(counters, sections).map((group) => ({
    ...group,
    shown: shownIn(group),
  }));
  const isIdleVisible = (group: (typeof groups)[number]) =>
    group.shown.length > 0 || (showsEmpty && group.sectionId !== null);
  const visible = groups.filter(isIdleVisible);
  // Hidden sections join at the bottom, so starting a drag moves nothing.
  if (drag) visible.push(...groups.filter((group) => !isIdleVisible(group)));

  function toggle(groupId: string, open: boolean) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (open) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function drop(event: DragEndEvent) {
    setDrag(undefined);
    const dragged = event.active.data.current as CounterDrag;
    const target = event.over?.data.current as CounterDrop | undefined;
    const group = groups.find((item) => item.id === target?.groupId);
    if (!target || !group) return;
    if (dragged.kind === "section") {
      const { sectionId } = dragged;
      if (group.id === sectionId) return;
      const targetId = group.id === NO_SECTION_ID ? null : group.id;
      const position = sectionMove(sections, sectionId, targetId);
      if (position !== null) {
        sectionActions.move.mutate({ sectionId, position });
      }
      return;
    }
    const counterId = String(event.active.id);
    const change = counterMove(group, counterId, target.beforeId);
    if (change) move.mutate({ counterId, ...change });
  }

  // The rename dialog opens once the menu is gone, or the menu takes focus back.
  function openRenameAfterClose(event: Event) {
    const group = renameAfterClose.current;
    if (!group) return;
    renameAfterClose.current = null;
    event.preventDefault();
    setRenaming(group);
  }

  function shownIn(group: CounterGroup) {
    if (selectedColumn === null) return group.counters;
    return group.counters.filter(
      (counter) => counter.week[selectedColumn]?.tracked,
    );
  }

  function dragLabel() {
    if (!drag) return null;
    if (drag.data.kind === "section") {
      const { sectionId } = drag.data;
      return sections.find((section) => section.id === sectionId)?.name;
    }
    return counters.find((counter) => counter.id === drag.id)?.name;
  }

  function renderRow(counter: Counter, groupId: string) {
    if (renderAction) {
      return (
        <CounterRow
          key={counter.id}
          counter={counter}
          action={renderAction(counter)}
        />
      );
    }
    return (
      <DraggableCounterRow
        key={counter.id}
        groupId={groupId}
        counter={counter}
        selectedDate={
          selectedColumn === null
            ? undefined
            : counter.week[selectedColumn]?.date
        }
      />
    );
  }

  function sectionMenu(group: CounterGroup) {
    if (renderAction || group.sectionId === null) return null;
    const sectionId = group.sectionId;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            aria-label={`Actions for ${group.name}`}
          >
            <EllipsisIcon size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={openRenameAfterClose}
        >
          <DropdownMenuItem
            onSelect={() => {
              renameAfterClose.current = group;
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={sectionActions.remove.isPending}
            onSelect={() => sectionActions.remove.mutate(sectionId)}
          >
            Delete section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) =>
        setDrag({
          id: String(event.active.id),
          data: event.active.data.current as CounterDrag,
        })
      }
      onDragCancel={() => setDrag(undefined)}
      onDragEnd={drop}
    >
      <div>
        {visible.map((group) => {
          const open = !collapsed.has(group.id);
          return (
            <Collapsible
              key={group.id}
              open={open}
              onOpenChange={(next) => toggle(group.id, next)}
            >
              <SectionHeader
                groupId={group.id}
                sectionId={renderAction ? null : group.sectionId}
                menu={sectionMenu(group)}
              >
                <CollapsibleTrigger className="flex min-w-0 items-center gap-2 py-1 text-sm font-semibold">
                  <ChevronIcon
                    size={12}
                    className={cn("text-muted-foreground", open && "rotate-90")}
                  />
                  <span className="truncate">{group.name}</span>
                  <span className="font-normal text-muted-foreground">
                    {group.shown.length}
                  </span>
                </CollapsibleTrigger>
              </SectionHeader>
              <CollapsibleContent>
                <ul className="flex flex-col gap-2">
                  {group.shown.map((counter) => renderRow(counter, group.id))}
                </ul>
              </CollapsibleContent>
              <SectionEndZone
                groupId={group.id}
                isEmpty={group.shown.length === 0}
              />
            </Collapsible>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {drag ? (
          <p className="w-fit max-w-xs cursor-grabbing truncate rounded-xl border border-border bg-popover px-4 py-3 text-sm font-medium shadow-md">
            {dragLabel()}
          </p>
        ) : null}
      </DragOverlay>
      {renaming?.sectionId ? (
        <SectionNameDialog
          initialName={renaming.name}
          isPending={sectionActions.rename.isPending}
          onClose={() => setRenaming(undefined)}
          onSubmit={(name) =>
            sectionActions.rename.mutate(
              { sectionId: renaming.id, name },
              { onSuccess: () => setRenaming(undefined) },
            )
          }
        />
      ) : null}
    </DndContext>
  );
}
