"use client";

import { formatEstimation } from "@repo/api/todex";
import type { ExecutionQueueItem } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { STATUS_LABEL } from "../planning/task-helpers";

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
    <ol className="flex flex-col gap-2">
      {queue.map((item, index) => (
        <QueueRow
          key={item.id}
          item={item}
          index={index}
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
  index,
  selected,
  onSelect,
  onRemove,
}: {
  item: ExecutionQueueItem;
  index: number;
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
        "flex items-center gap-2 rounded-md border border-[#1f1f1f] bg-[#181818] px-2 py-2 hover:bg-white/10",
        selected && "border-white/25 bg-white/10",
      )}
    >
      <GripIcon />
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
        <span className="block truncate text-sm font-medium text-[#f2f2f0]">
          {index + 1}. {task.summary}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[#8f8f8c]">
          [{task.spaceName}]{" "}
          {task.isDefaultSection ? "General" : task.sectionName} ·{" "}
          {STATUS_LABEL[task.status]}
        </span>
      </button>
      <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#cfcfcc]">
        {formatEstimation(task.estimation) || "—"}
      </span>
      <button
        type="button"
        aria-label={`Remove ${task.summary} from the queue`}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#a3a3a0] hover:bg-white/10 hover:text-[#f2f2f0]"
        onClick={() => onRemove(item.taskId)}
      >
        <CloseIcon />
      </button>
    </li>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-[#6f6f6c]" aria-hidden>
      <circle cx="6" cy="4" r="1" fill="currentColor" />
      <circle cx="10" cy="4" r="1" fill="currentColor" />
      <circle cx="6" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="10" cy="12" r="1" fill="currentColor" />
    </svg>
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
