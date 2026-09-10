"use client";

import type { CSSProperties, ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Checkbox, cn } from "@repo/ui";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  StatusDoneIcon,
  StatusInProgressIcon,
  StatusTodoIcon,
} from "@components/icons";

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
      className={cn(className, isOver && "bg-white/[0.04]")}
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
  onSelect,
  onToggleDone,
  onCreateSubtask,
}: {
  node: NestedTask;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  depth?: number;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
}) {
  return (
    <DraggableTask taskId={node.id}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-surface",
          selectedTaskId === node.id && "bg-surface",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` } as CSSProperties}
      >
        <Checkbox
          checked={node.status === TaskStatus.DONE}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() => onToggleDone(node)}
        />
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            PRIORITY_DOT[node.priority],
          )}
        />
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
