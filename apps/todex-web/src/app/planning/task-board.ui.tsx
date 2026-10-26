"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import {
  formatEstimation,
  formatTaskRecurrence,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { formatDuration } from "../execution/execution-time";
import {
  CalendarIcon,
  ChevronIcon,
  ClockIcon,
  RepeatIcon,
} from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { boardDropId, type BoardDropData } from "./task-board-dnd";
import { TaskContextMenu } from "./task-context-menu";
import { isToggleClick, orderedTaskIds } from "./task-selection";
import { useTasks } from "./tasks-provider";
import { useStageName } from "./board-axes";

import {
  formatTaskDay,
  STATUS_LABEL,
  STATUS_ORDER,
  type NestedTask,
} from "./task-helpers";

export function BoardDropZone({
  status,
  index,
  kind,
  spaceId,
  combinedOpen,
  taskId,
  compact,
  className,
  children,
}: {
  status: Task["status"];
  index: number | null;
  kind: BoardDropData["kind"];
  spaceId?: string;
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
    spaceId,
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
    overData.spaceId === spaceId &&
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
            kind === "gap"
              ? "top-1/2 -translate-y-1/2"
              : "bottom-0 translate-y-1/2",
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
  spaceNameById,
  showBoardName,
  depth = 0,
  expanded = false,
  onToggleExpanded,
  onToggleDone,
  onCreateSubtask,
  statusDrop,
  spaceId,
}: {
  node: NestedTask;
  spaceNameById: Map<string, string>;
  showBoardName: boolean;
  depth?: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  statusDrop?: boolean;
  spaceId?: string;
}) {
  const {
    state: { selectedTaskIds },
    actions: { selectTask, updateTask },
  } = useTasks();
  const hasChildren = node.children.length > 0;
  const selected = selectedTaskIds.has(node.id);

  function selectFromPointer(event: MouseEvent<HTMLElement>) {
    selectTask(
      node.id,
      {
        shift: event.shiftKey,
        toggle: isToggleClick(event, navigator.platform),
      },
      orderedTaskIds(event.currentTarget.closest("[data-task-surface]")),
    );
  }

  const row = (
    <TaskContextMenu taskId={node.id}>
      <div
        data-task-id={node.id}
        aria-selected={selected}
        className={cn(
          "group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-surface",
          node.status === TaskStatus.DONE &&
            "bg-black/30 text-muted-foreground",
          node.status === TaskStatus.CANCELLED &&
            "text-muted-foreground line-through",
          selected && "bg-surface text-foreground",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` } as CSSProperties}
        onMouseDown={(event) => {
          if (event.shiftKey) event.preventDefault();
        }}
        onClick={selectFromPointer}
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
        <PriorityMenu
          priority={node.priority}
          onSelect={(priority) => updateTask(node.id, { priority })}
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {node.taskKey}
        </span>
        <InlineTitle
          value={node.summary}
          className="flex-1"
          onSave={(summary) => updateTask(node.id, { summary })}
        />
        {showBoardName ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {spaceNameById.get(node.spaceId)}
          </span>
        ) : null}
        <TaskFacts task={node} />
        <button
          type="button"
          data-no-dnd=""
          className="invisible rounded-md px-1.5 text-xs text-muted-foreground group-hover:visible hover:text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onCreateSubtask(node.id);
          }}
        >
          +
        </button>
      </div>
    </TaskContextMenu>
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
      spaceId={spaceId}
    >
      {draggable}
    </BoardDropZone>
  );
}

export function TextMenu({
  label,
  trigger,
  ariaLabel,
  options,
  onSelect,
  className,
}: {
  label?: string;
  trigger?: ReactNode;
  ariaLabel: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground",
            className,
          )}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {trigger ?? label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        onClick={(event) => event.stopPropagation()}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InlineTitle({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  function save() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === value) {
      setDraft(value);
      return;
    }
    onSave(next);
  }

  if (editing) {
    return (
      <input
        autoFocus
        aria-label="Title"
        value={draft}
        className={cn(
          "min-w-0 bg-transparent text-left text-sm text-foreground outline-none",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        onBlur={save}
        onChange={(event) => setDraft(event.target.value)}
      />
    );
  }

  return (
    <button
      type="button"
      data-no-dnd=""
      className={cn(
        "min-w-0 truncate text-left text-sm transition-colors duration-150 hover:text-foreground",
        className,
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
    </button>
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
    | "scheduleDate"
    | "dueDate"
    | "estimation"
    | "actualTime"
    | "recurrence"
    | "progressStageId"
  >;
  className?: string;
}) {
  const schedule = formatTaskDay(task.scheduleDate);
  const due = formatTaskDay(task.dueDate);
  const estimate = formatEstimation(task.estimation);
  const executed = task.actualTime > 0 ? formatDuration(task.actualTime) : null;
  const recurrence = task.recurrence
    ? formatTaskRecurrence(task.recurrence)
    : null;
  const stageName = useStageName(task.progressStageId);
  if (
    !schedule &&
    !due &&
    !estimate &&
    !executed &&
    !recurrence &&
    !stageName
  ) {
    return null;
  }
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
          Estimate {estimate}
        </span>
      ) : null}
      {executed ? (
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={12} />
          Executed {executed}
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

export function TasksBreadcrumb({
  spaceName,
  boardHref,
  taskKey,
  epicName,
  trailing,
  className,
}: {
  spaceName?: string;
  boardHref?: string;
  taskKey?: string;
  epicName?: string;
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
        Planning
      </Link>
      {spaceName ? (
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
                {spaceName}
              </Link>
            ) : (
              <span className="truncate">{spaceName}</span>
            )}
          </span>
        </>
      ) : null}
      {epicName ? (
        <>
          <span className="shrink-0 text-muted-foreground">›</span>
          <span className="truncate">{epicName}</span>
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

export function PriorityMenu({
  priority,
  onSelect,
}: {
  priority: Task["priority"];
  onSelect: (priority: Task["priority"]) => void;
}) {
  return (
    <TextMenu
      ariaLabel="Priority"
      className="px-0.5"
      trigger={<PriorityGlyph priority={priority} />}
      options={PRIORITY_MENU_OPTIONS}
      onSelect={(value) => onSelect(value as Task["priority"])}
    />
  );
}

export function StatusMenu({
  status,
  onSelect,
}: {
  status: Task["status"];
  onSelect: (status: Task["status"]) => void;
}) {
  return (
    <TextMenu
      ariaLabel="Status"
      className="px-0.5"
      trigger={<StatusGlyph status={status} />}
      options={STATUS_MENU_OPTIONS}
      onSelect={(value) => onSelect(value as Task["status"])}
    />
  );
}

export function StageMark() {
  return <span className="h-3.5 w-3.5 rounded-full border border-current" />;
}

export function AreaMark() {
  return <span className="h-3 w-3 rounded-sm border border-current" />;
}

export function BoardMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 5v14" />
    </svg>
  );
}

export function ParentMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="8" cy="7" r="2.25" />
      <circle cx="16" cy="17" r="2.25" />
      <path d="M9.5 8.5 14.5 15" />
    </svg>
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
  [TaskStatus.CANCELLED]: { mark: "—", className: "text-zinc-400" },
};

export const PRIORITY_ICON: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "🔵",
  [TaskPriority.MEDIUM]: "🟡",
  [TaskPriority.HIGH]: "🔴",
  [TaskPriority.CRITICAL]: "🟣",
};

const PRIORITY_MENU_LABEL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

const PRIORITY_MENU_OPTIONS = (
  Object.keys(PRIORITY_MENU_LABEL) as Task["priority"][]
).map((priority) => ({
  value: priority,
  label: PRIORITY_MENU_LABEL[priority],
}));

const STATUS_MENU_OPTIONS = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_LABEL[status],
}));
