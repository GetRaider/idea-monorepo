"use client";

import { formatEstimation } from "@repo/api/todex";
import type { ExecutionQueueItem } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { STATUS_LABEL } from "../tasks/task-helpers";

const PRIORITY_MARK = {
  low: "🔵",
  medium: "🟡",
  high: "🔴",
  critical: "🟣",
} as const;

export function ExecutionQueueList({
  queue,
  selectedTaskIds,
  onSelect,
  onRemove,
}: {
  queue: ExecutionQueueItem[];
  selectedTaskIds: string[];
  onSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  onRemove: (taskId: string) => void;
}) {
  return (
    <ol className="flex flex-col">
      {queue.map((item) => (
        <QueueRow
          key={item.id}
          item={item}
          selected={selectedTaskIds.includes(item.taskId)}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      ))}
    </ol>
  );
}

function QueueRow({
  item,
  selected,
  onSelect,
  onRemove,
}: {
  item: ExecutionQueueItem;
  selected: boolean;
  onSelect: (
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => void;
  onRemove: (taskId: string) => void;
}) {
  const task = item.task;

  return (
    <li
      className={cn(
        "group flex items-start gap-2 border-b border-border px-3 py-3 last:border-b-0",
        selected && "bg-surface",
      )}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        aria-pressed={selected}
        onMouseDown={(event) => {
          if (event.shiftKey) event.preventDefault();
        }}
        onClick={(event) =>
          onSelect(item.taskId, {
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
          })
        }
      >
        <span className="flex min-w-0 items-baseline gap-1.5 text-sm">
          <span aria-hidden className="shrink-0 text-xs leading-none">
            {PRIORITY_MARK[task.priority]}
          </span>
          <span className="truncate">{task.summary}</span>
          <span className="shrink-0 text-muted-foreground">
            ({formatEstimation(task.estimation)})
          </span>
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {task.boardName}
          {task.isDefaultArea ? "" : ` (${task.areaName})`} -{" "}
          {STATUS_LABEL[task.status]}
        </span>
      </button>
      <button
        type="button"
        className="text-xs text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
        onClick={() => onRemove(item.taskId)}
      >
        Remove
      </button>
    </li>
  );
}
