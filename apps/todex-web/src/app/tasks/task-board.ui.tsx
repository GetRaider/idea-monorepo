"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Checkbox, cn } from "@repo/ui";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { ChevronIcon } from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useTasks } from "./tasks-provider";

import type { NestedTask } from "./task-helpers";

export function statusDroppableId(status: Task["status"]): string {
  return `status:${status}`;
}

export function parseStatusDroppableId(id: string | number): Task["status"] | null {
  if (id === statusDroppableId(TaskStatus.TODO)) return TaskStatus.TODO;
  if (id === statusDroppableId(TaskStatus.IN_PROGRESS))
    return TaskStatus.IN_PROGRESS;
  if (id === statusDroppableId(TaskStatus.DONE)) return TaskStatus.DONE;
  return null;
}

export function StatusDroppable({
  status,
  className,
  children,
}: {
  status: Task["status"];
  className?: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusDroppableId(status),
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-surface")}
    >
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
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: taskId });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isDragging && "opacity-60")}
      style={
        transform
          ? ({
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            } as CSSProperties)
          : undefined
      }
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
}) {
  const hasChildren = node.children.length > 0;
  return (
    <DraggableTask taskId={node.id}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-surface",
          selectedTaskId === node.id && "bg-surface",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` } as CSSProperties}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
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
          checked={node.status === TaskStatus.DONE}
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
        <button
          type="button"
          className="invisible rounded-md px-1.5 text-xs text-muted-foreground group-hover:visible hover:text-foreground"
          onClick={() => onCreateSubtask(node.id)}
        >
          +
        </button>
      </div>
    </DraggableTask>
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
