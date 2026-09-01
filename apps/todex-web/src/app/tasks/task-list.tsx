"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@repo/ui";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  ChevronIcon,
  PlusIcon,
  StatusDoneIcon,
  StatusInProgressIcon,
  StatusTodoIcon,
} from "@components/icons";

import { STATUS_LABEL, STATUS_ORDER, type NestedTask } from "./task-helpers";
import { useTasks } from "./tasks-provider";

export function TaskList() {
  const {
    state: { groups, selectedTaskId, createBoardId, view, selectedBoard },
    actions: { setSelectedTaskId, createTask, updateTask },
    meta: { createInputRef },
  } = useTasks();
  const [createSummary, setCreateSummary] = useState("");
  const [open, setOpen] = useState<Record<Task["status"], boolean>>({
    [TaskStatus.TODO]: true,
    [TaskStatus.IN_PROGRESS]: true,
    [TaskStatus.DONE]: false,
  });

  const title =
    view.kind === "schedule"
      ? view.schedule === "today"
        ? "Today"
        : "Tomorrow"
      : (selectedBoard?.name ?? "Select a board");

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!createSummary.trim() || !createBoardId) return;
    createTask(createSummary.trim());
    setCreateSummary("");
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight">
          <span className="text-muted">Tasks</span>
          <span className="text-muted">›</span>
          <span className="flex min-w-0 items-center gap-2 truncate">
            {view.kind === "board" ? <BoardGlyph /> : null}
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SearchField />
          <Button
            size="sm"
            onClick={() => createInputRef.current?.focus()}
            disabled={!createBoardId}
          >
            <PlusIcon size={16} />
            Create Task
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-panel p-3">
        <form onSubmit={submitCreate} className="mb-2">
          <input
            ref={createInputRef}
            value={createSummary}
            onChange={(event) => setCreateSummary(event.target.value)}
            placeholder="+ Create a new task"
            disabled={!createBoardId}
            className="h-9 w-full bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-neutral-600"
          />
        </form>
        {STATUS_ORDER.map((status) => {
          const nodes = groups[status];
          return (
            <Collapsible
              key={status}
              open={open[status]}
              onOpenChange={(nextOpen) =>
                setOpen((current) => ({ ...current, [status]: nextOpen }))
              }
            >
              <section className="border-b border-border py-1 last:border-b-0">
                <CollapsibleTrigger className="flex items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold hover:bg-white/[0.04]">
                  <ChevronIcon
                    size={14}
                    className={cn(
                      "text-muted transition-transform",
                      open[status] && "rotate-90",
                    )}
                  />
                  <StatusGlyph status={status} />
                  <span>{STATUS_LABEL[status]}</span>
                  <span className="text-muted">{nodes.length}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {nodes.length === 0 ? (
                    <p className="px-8 py-2 text-sm text-muted">No tasks</p>
                  ) : (
                    <TaskTree
                      nodes={nodes}
                      selectedTaskId={selectedTaskId}
                      onSelect={setSelectedTaskId}
                      onToggleDone={(task) =>
                        updateTask(task.id, {
                          status:
                            task.status === TaskStatus.DONE
                              ? TaskStatus.TODO
                              : TaskStatus.DONE,
                        })
                      }
                      onCreateSubtask={(parentTaskId) =>
                        createTask("New subtask", parentTaskId)
                      }
                    />
                  )}
                </CollapsibleContent>
              </section>
            </Collapsible>
          );
        })}
      </div>
    </section>
  );
}

function SearchField() {
  const {
    state: { search },
    actions: { setSearch },
  } = useTasks();
  return (
    <input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search"
      className="h-9 w-40 rounded-md border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted"
    />
  );
}

function TaskTree({
  nodes,
  selectedTaskId,
  onSelect,
  onToggleDone,
  onCreateSubtask,
  depth = 0,
}: {
  nodes: NestedTask[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
  onToggleDone: (task: NestedTask) => void;
  onCreateSubtask: (parentTaskId: string) => void;
  depth?: number;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
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
              <span className="mr-2 font-mono text-xs text-muted">
                {node.taskKey}
              </span>
              {node.summary}
            </button>
            <button
              type="button"
              className="invisible rounded-md px-1.5 text-xs text-muted group-hover:visible hover:text-foreground"
              onClick={() => onCreateSubtask(node.id)}
            >
              +
            </button>
          </div>
          {node.children.length > 0 ? (
            <TaskTree
              nodes={node.children}
              selectedTaskId={selectedTaskId}
              onSelect={onSelect}
              onToggleDone={onToggleDone}
              onCreateSubtask={onCreateSubtask}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function StatusGlyph({ status }: { status: Task["status"] }) {
  if (status === TaskStatus.DONE)
    return <StatusDoneIcon size={14} className="text-emerald-400" />;
  if (status === TaskStatus.IN_PROGRESS)
    return <StatusInProgressIcon size={14} className="text-yellow-400" />;
  return <StatusTodoIcon size={14} className="text-muted" />;
}

function BoardGlyph() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface text-muted">
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

const PRIORITY_DOT: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "bg-neutral-500",
  [TaskPriority.MEDIUM]: "bg-yellow-400",
  [TaskPriority.HIGH]: "bg-orange-500",
  [TaskPriority.CRITICAL]: "bg-red-500",
};
