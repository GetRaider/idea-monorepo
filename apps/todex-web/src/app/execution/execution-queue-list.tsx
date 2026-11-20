"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { formatEstimation } from "@repo/api/todex";
import type { ExecutionQueueItem } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { STATUS_LABEL } from "../planning/task-helpers";
import { PriorityGlyph, StatusGlyph } from "../planning/task-board.ui";
import { moveQueueItem } from "./execution-queue-order";

export function ExecutionQueueList({
  queue,
  selectedTaskIds,
  onSelect,
  onRemove,
  onReorder,
}: {
  queue: ExecutionQueueItem[];
  selectedTaskIds: string[];
  onSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  onRemove: (taskId: string) => void;
  onReorder: (taskIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const ignoreClick = useRef(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const active = queue.find((item) => item.taskId === activeTaskId) ?? null;

  function finishDrag(event: DragEndEvent) {
    ignoreClick.current = true;
    setActiveTaskId(null);
    const overTaskId = taskIdFromDrop(event.over?.id);
    if (!overTaskId) return;
    const next = moveQueueItem(
      queue.map((item) => item.taskId),
      String(event.active.id),
      overTaskId,
    );
    if (
      sameOrder(
        next,
        queue.map((item) => item.taskId),
      )
    )
      return;
    onReorder(next);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveTaskId(String(event.active.id))}
      onDragCancel={() => {
        ignoreClick.current = true;
        setActiveTaskId(null);
      }}
      onDragEnd={finishDrag}
    >
      <ol className="flex flex-col gap-2">
        {queue.map((item) => (
          <QueueRow
            key={item.id}
            item={item}
            selected={selectedTaskIds.includes(item.taskId)}
            ignoreClick={ignoreClick}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </ol>
      <DragOverlay>
        {active ? <QueueCard item={active} selected dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function QueueRow({
  item,
  selected,
  ignoreClick,
  onSelect,
  onRemove,
}: {
  item: ExecutionQueueItem;
  selected: boolean;
  ignoreClick: { current: boolean };
  onSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  onRemove: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.taskId,
  });
  const drop = useDroppable({ id: dropId(item.taskId) });

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        drop.setNodeRef(node);
      }}
      className={cn(
        isDragging && "opacity-40",
        drop.isOver && "rounded-md ring-1 ring-white/30",
      )}
      {...listeners}
      {...attributes}
      onMouseDown={(event) => {
        if (event.shiftKey) event.preventDefault();
      }}
      onClick={(event) => {
        if (ignoreClick.current) {
          ignoreClick.current = false;
          return;
        }
        onSelect(item.taskId, {
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        });
      }}
    >
      <QueueCard
        item={item}
        selected={selected}
        onRemove={() => onRemove(item.taskId)}
      />
    </li>
  );
}

function QueueCard({
  item,
  selected,
  dragging = false,
  onRemove,
}: {
  item: ExecutionQueueItem;
  selected: boolean;
  dragging?: boolean;
  onRemove?: () => void;
}) {
  const task = item.task;

  return (
    <div
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md border border-[#1f1f1f] bg-[#181818] px-2 py-2 active:cursor-grabbing",
        selected && "border-white/25 bg-white/10",
        dragging && "shadow-lg",
      )}
    >
      <div className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#f2f2f0]">
          <StatusGlyph status={task.status} />
          <PriorityGlyph priority={task.priority} />
          <span className="truncate">{task.summary}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#8f8f8c]">
          [{task.spaceName}]{" "}
          {task.isDefaultSection ? "General" : task.sectionName} ·{" "}
          {STATUS_LABEL[task.status]}
        </span>
      </div>
      <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#cfcfcc]">
        {formatEstimation(task.estimation) || "—"}
      </span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${task.summary} from the queue`}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#a3a3a0] hover:bg-white/10 hover:text-[#f2f2f0]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

function dropId(taskId: string) {
  return `queue-drop:${taskId}`;
}

function taskIdFromDrop(id: string | number | undefined) {
  return typeof id === "string" && id.startsWith("queue-drop:")
    ? id.slice("queue-drop:".length)
    : null;
}

function sameOrder(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
