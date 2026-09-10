"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@repo/ui";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  CalendarIcon,
  ChevronIcon,
  StatusDoneIcon,
  StatusInProgressIcon,
  StatusTodoIcon,
} from "@components/icons";

import {
  PRIORITY_LABEL,
  dateInputToLocalDayStartIso,
  formatScheduleLabel,
  isoToDateInput,
  type NestedTask,
} from "./task-helpers";

export function statusDroppableId(status: Task["status"]): string {
  return `status:${status}`;
}

export function parseStatusDroppableId(
  id: string | number,
): Task["status"] | null {
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
      className={cn(className, isOver && "bg-white/[0.04]")}
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
  onSelect,
  onToggleDone,
  onCreateSubtask,
  onPriorityChange,
  onScheduleChange,
}: {
  node: NestedTask;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  depth?: number;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  onPriorityChange: (taskId: string, priority: Task["priority"]) => void;
  onScheduleChange: (taskId: string, scheduleDate: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
  });

  return (
    <li>
      <div
        ref={setNodeRef}
        className={cn(
          "group grid min-w-[560px] cursor-grab items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-surface active:cursor-grabbing",
          "grid-cols-[16px_18px_22px_minmax(0,1fr)_minmax(6.5rem,7.5rem)]",
          selectedTaskId === node.id && "bg-surface",
          node.status === TaskStatus.DONE && "opacity-70",
          isDragging && "pointer-events-none cursor-grabbing opacity-0",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` } as CSSProperties}
        onClick={() => {
          if (isDragging) return;
          onSelect(node.id);
        }}
        {...listeners}
        {...attributes}
      >
        <Checkbox
          checked={node.status === TaskStatus.DONE}
          onClick={stopRowEvent}
          onPointerDown={stopRowEvent}
          onCheckedChange={() => onToggleDone(node)}
        />
        {hasChildren ? (
          <button
            type="button"
            className="flex h-[18px] w-[18px] items-center justify-center text-muted-foreground"
            aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
            onPointerDown={stopRowEvent}
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded((current) => !current);
            }}
          >
            <ChevronIcon
              size={12}
              className={cn(
                "transition-transform",
                isExpanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span />
        )}
        <PriorityMenu
          priority={node.priority}
          onChange={(priority) => onPriorityChange(node.id, priority)}
        />
        <div className="min-w-0 text-left text-sm">
          <span className="mr-2 font-mono text-xs text-muted-foreground">
            {node.taskKey}
          </span>
          <span
            className={cn(
              node.status === TaskStatus.DONE && "line-through",
            )}
          >
            {node.summary}
          </span>
          {showBoardName ? (
            <span className="ml-2 text-xs text-muted-foreground">
              {boardNameById.get(node.taskBoardId)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="invisible rounded-md px-1.5 text-xs text-muted-foreground group-hover:visible hover:text-foreground"
            onPointerDown={stopRowEvent}
            onClick={(event) => {
              event.stopPropagation();
              onCreateSubtask(node.id);
            }}
          >
            +
          </button>
          <ScheduleCell
            scheduleDate={node.scheduleDate}
            onChange={(next) => onScheduleChange(node.id, next)}
          />
        </div>
      </div>
      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <TaskRow
              key={child.id}
              node={child}
              selectedTaskId={selectedTaskId}
              boardNameById={boardNameById}
              showBoardName={showBoardName}
              depth={depth + 1}
              onSelect={onSelect}
              onToggleDone={onToggleDone}
              onCreateSubtask={onCreateSubtask}
              onPriorityChange={onPriorityChange}
              onScheduleChange={onScheduleChange}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function PriorityMenu({
  priority,
  onChange,
}: {
  priority: Task["priority"];
  onChange: (priority: Task["priority"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-[22px] w-[22px] items-center justify-center"
          aria-label={`Priority ${PRIORITY_LABEL[priority]}`}
          onPointerDown={stopRowEvent}
          onClick={stopRowEvent}
        >
          <span
            className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[priority])}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup
          value={priority}
          onValueChange={(value) => onChange(value as Task["priority"])}
        >
          {Object.values(TaskPriority).map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span
                className={cn(
                  "mr-2 h-2 w-2 rounded-full",
                  PRIORITY_DOT[value],
                )}
              />
              {PRIORITY_LABEL[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ScheduleCell({
  scheduleDate,
  onChange,
}: {
  scheduleDate: string | null;
  onChange: (scheduleDate: string | null) => void;
}) {
  const label = formatScheduleLabel(scheduleDate) ?? "Schedule";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 justify-self-end text-xs text-muted-foreground hover:text-foreground",
            !scheduleDate && "opacity-0 group-hover:opacity-100",
          )}
          onPointerDown={stopRowEvent}
          onClick={stopRowEvent}
        >
          <CalendarIcon size={12} />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Input
          type="date"
          value={isoToDateInput(scheduleDate)}
          onChange={(event) =>
            onChange(dateInputToLocalDayStartIso(event.target.value))
          }
        />
        {scheduleDate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function StatusGlyph({ status }: { status: Task["status"] }) {
  if (status === TaskStatus.DONE)
    return <StatusDoneIcon size={14} className="text-emerald-400" />;
  if (status === TaskStatus.IN_PROGRESS)
    return <StatusInProgressIcon size={14} className="text-yellow-400" />;
  return <StatusTodoIcon size={14} className="text-muted-foreground" />;
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

export const PRIORITY_DOT: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "bg-neutral-500",
  [TaskPriority.MEDIUM]: "bg-yellow-400",
  [TaskPriority.HIGH]: "bg-orange-500",
  [TaskPriority.CRITICAL]: "bg-red-500",
};

function stopRowEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
