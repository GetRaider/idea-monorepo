"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { Checkbox, cn } from "@repo/ui";
import {
  formatEstimation,
  formatTaskRecurrence,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  CalendarIcon,
  ChevronIcon,
  ClockIcon,
  RepeatIcon,
} from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { boardDropId, type BoardDropData } from "./task-board-dnd";
import { useTasks } from "./tasks-provider";
import { useStageName } from "./board-axes";

import { formatTaskDay, type NestedTask } from "./task-helpers";

export function BoardDropZone({
  status,
  index,
  kind,
  boardId,
  combinedOpen,
  taskId,
  compact,
  className,
  children,
}: {
  status: Task["status"];
  index: number | null;
  kind: BoardDropData["kind"];
  boardId?: string;
  combinedOpen?: boolean;
  taskId?: string;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const data: BoardDropData = {
    type: "reorder",
    status,
    index,
    kind,
    boardId,
    combinedOpen,
  };
  const { setNodeRef, isOver } = useDroppable({
    id: boardDropId({ ...data, taskId }),
    data,
  });
  const { active, over } = useDndContext();
  const overData = over?.data.current as BoardDropData | undefined;
  const sameSlot =
    overData?.type === "reorder" &&
    overData.status === status &&
    overData.index === index &&
    overData.boardId === boardId &&
    Boolean(overData.combinedOpen) === Boolean(combinedOpen);
  const showIndicator =
    Boolean(active) &&
    kind !== "card" &&
    (isOver || (kind === "gap" && sameSlot));
  const seamTarget = compact && (kind === "gap" || kind === "fill");
  return (
    <div
      ref={seamTarget ? undefined : setNodeRef}
      className={cn(
        kind === "gap" &&
          "pointer-events-none relative w-full shrink-0 transition-[height,margin] duration-150",
        kind === "gap" && (compact ? "h-0" : "h-3"),
        kind === "empty" && (compact ? "relative" : "relative min-h-16 flex-1"),
        kind === "fill" &&
          (compact ? "relative h-0 shrink-0" : "relative mt-1 min-h-16 flex-1"),
        kind === "column" && "relative",
        showIndicator && kind === "gap" && "my-1 h-14",
        showIndicator &&
          compact &&
          (kind === "fill" || kind === "empty") &&
          "min-h-14",
        className,
      )}
    >
      {seamTarget ? (
        <div
          ref={setNodeRef}
          className={cn(
            "pointer-events-none absolute inset-x-0 h-6",
            kind === "gap" ? "top-1/2 -translate-y-1/2" : "bottom-0 translate-y-1/2",
          )}
        />
      ) : null}
      {showIndicator ? (
        <span
          className={cn(
            "pointer-events-none absolute z-10 rounded-lg border border-dotted border-muted-foreground/80 bg-transparent",
            kind === "column" && "inset-1",
            kind === "gap" && "inset-x-1 inset-y-1",
            kind !== "column" && kind !== "gap" && "inset-x-1 top-1 h-12",
          )}
        />
      ) : null}
      {children}
    </div>
  );
}

export function DraggableTask({
  taskId,
  className,
  children,
}: {
  taskId: string;
  className?: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: taskId,
    data: { taskId },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        className,
        isDragging && "opacity-0",
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

export function TaskRow({
  node,
  selectedTaskId,
  boardNameById,
  showBoardName,
  depth = 0,
  expanded = false,
  onToggleExpanded,
  onSelect,
  onToggleDone,
  onCreateSubtask,
  statusDrop,
  boardId,
}: {
  node: NestedTask;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  depth?: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  statusDrop?: boolean;
  boardId?: string;
}) {
  const hasChildren = node.children.length > 0;
  const row = (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-surface",
        node.status === TaskStatus.DONE && "bg-black/30 text-muted-foreground",
        selectedTaskId === node.id && "bg-surface text-foreground",
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` } as CSSProperties}
    >
      {hasChildren ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
          data-no-dnd=""
          className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpanded?.();
          }}
        >
          <ChevronIcon
            size={12}
            className={cn("transition-transform", expanded && "rotate-90")}
          />
        </button>
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}
      <Checkbox
        data-no-dnd=""
        checked={node.status === TaskStatus.DONE}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={() => onToggleDone(node)}
      />
      <PriorityGlyph priority={node.priority} />
      <button
        type="button"
        className="min-w-0 flex-1 text-left text-sm"
        onClick={() => onSelect(node.id)}
      >
        <span className="mr-2 font-mono text-xs text-muted-foreground">
          {node.taskKey}
        </span>
        {node.summary}
        {showBoardName ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {boardNameById.get(node.taskBoardId)}
          </span>
        ) : null}
      </button>
      <TaskFacts task={node} />
      <button
        type="button"
        data-no-dnd=""
        className="invisible rounded-md px-1.5 text-xs text-muted-foreground group-hover:visible hover:text-foreground"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onCreateSubtask(node.id)}
      >
        +
      </button>
    </div>
  );
  if (depth > 0) return row;
  const draggable = <DraggableTask taskId={node.id}>{row}</DraggableTask>;
  if (!statusDrop) return draggable;
  return (
    <BoardDropZone
      kind="row"
      status={node.status}
      index={null}
      taskId={node.id}
      boardId={boardId}
    >
      {draggable}
    </BoardDropZone>
  );
}

export function TaskProgressBar({
  done,
  total,
  className,
}: {
  done: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;
  const percent = Math.round((done / total) * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="shrink-0 tabular-nums">{percent}%</span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function TaskFacts({
  task,
  className,
}: {
  task: Pick<
    Task,
    "scheduleDate" | "dueDate" | "estimation" | "recurrence" | "progressStageId"
  >;
  className?: string;
}) {
  const schedule = formatTaskDay(task.scheduleDate);
  const due = formatTaskDay(task.dueDate);
  const estimate = formatEstimation(task.estimation);
  const recurrence = task.recurrence
    ? formatTaskRecurrence(task.recurrence)
    : null;
  const stageName = useStageName(task.progressStageId);
  if (!schedule && !due && !estimate && !recurrence && !stageName) return null;
  return (
    <span
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {stageName ? <span>{stageName}</span> : null}
      {schedule ? (
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size={12} />
          Schedule {schedule}
        </span>
      ) : null}
      {due ? (
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size={12} />
          Due {due}
        </span>
      ) : null}
      {estimate ? (
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={12} />
          {estimate}
        </span>
      ) : null}
      {recurrence ? (
        <span className="inline-flex items-center gap-1">
          <RepeatIcon size={12} />
          {recurrence}
        </span>
      ) : null}
    </span>
  );
}

export function TaskSearchField() {
  const {
    state: { search },
    actions: { setSearch },
  } = useTasks();
  return (
    <input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search"
      aria-label="Search"
      className="h-9 w-40 rounded-md border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
    />
  );
}

export function TasksBreadcrumb({
  boardName,
  boardHref,
  taskKey,
  trailing,
  className,
}: {
  boardName?: string;
  boardHref?: string;
  taskKey?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  const {
    actions: { setSelectedTaskId },
  } = useTasks();
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Link
        href={tasksUrlHelper.routing.buildRootUrl()}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        Tasks
      </Link>
      {boardName ? (
        <>
          <span className="shrink-0 text-muted-foreground">›</span>
          <span className="flex min-w-0 items-center gap-2 truncate">
            {trailing}
            {boardHref ? (
              <Link
                href={boardHref}
                className="truncate text-muted-foreground hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedTaskId(null);
                }}
              >
                {boardName}
              </Link>
            ) : (
              <span className="truncate">{boardName}</span>
            )}
          </span>
        </>
      ) : null}
      {taskKey ? (
        <>
          <span className="shrink-0 text-muted-foreground">›</span>
          <span className="truncate">{taskKey}</span>
        </>
      ) : null}
    </div>
  );
}

export function StatusGlyph({ status }: { status: Task["status"] }) {
  const glyph = STATUS_GLYPH[status];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-3.5 w-3.5 items-center justify-center text-sm leading-none",
        glyph.className,
      )}
    >
      {glyph.mark}
    </span>
  );
}

export function PriorityGlyph({ priority }: { priority: Task["priority"] }) {
  return (
    <span aria-hidden className="inline-flex text-xs leading-none">
      {PRIORITY_ICON[priority]}
    </span>
  );
}

export function BoardGlyph() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface text-muted-foreground">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M10 5v14M4 10h16" />
      </svg>
    </span>
  );
}

const STATUS_GLYPH: Record<
  Task["status"],
  { mark: string; className: string }
> = {
  [TaskStatus.TODO]: { mark: "◯", className: "text-[#888]" },
  [TaskStatus.IN_PROGRESS]: { mark: "◐", className: "text-amber-500" },
  [TaskStatus.DONE]: { mark: "✓", className: "text-emerald-500" },
};

export const PRIORITY_ICON: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "🔵",
  [TaskPriority.MEDIUM]: "🟡",
  [TaskPriority.HIGH]: "🔴",
  [TaskPriority.CRITICAL]: "🟣",
};
