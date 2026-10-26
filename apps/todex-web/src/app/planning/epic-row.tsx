"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatEstimation, TaskStatus } from "@repo/api/todex";
import type { Task, UpdateEpicBody } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { ChevronIcon, ClockIcon } from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { todexClient } from "@/lib/todex-client";

import type { BoardDropData } from "./task-board-dnd";
import {
  DraggableTask,
  InlineTitle,
  PriorityMenu,
  StatusMenu,
} from "./task-board.ui";
import { TaskComposer } from "./task-composer";
import { TaskContextMenu } from "./task-context-menu";
import { statusAfterDoneToggle, type EpicColumn } from "./task-helpers";
import { useTasks } from "./tasks-provider";

export function EpicRows({
  rows,
  spaceName,
  spaceId,
  allowTasks = true,
}: {
  rows: EpicColumn[];
  spaceName: string;
  spaceId: string;
  allowTasks?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <EpicRow
          key={row.epic.id}
          row={row}
          spaceName={spaceName}
          spaceId={spaceId}
          allowTasks={allowTasks}
        />
      ))}
    </div>
  );
}

function EpicRow({
  row,
  spaceName,
  spaceId,
  allowTasks,
}: {
  row: EpicColumn;
  spaceName: string;
  spaceId: string;
  allowTasks: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const {
    state: { tasks },
    actions: { createTask },
  } = useTasks();
  const { active } = useDndContext();
  const draggingSelf = active?.id === `epic:${row.epic.id}`;
  const draggable = useDraggable({
    id: `epic:${row.epic.id}`,
    data: { epicId: row.epic.id },
  });
  const dropData: BoardDropData = {
    type: "reorder",
    kind: "epic",
    status: row.epic.status,
    index: null,
    spaceId,
    epicId: row.epic.id,
  };
  const droppable = useDroppable({
    id: `drop-epic:${spaceId}:${row.epic.id}`,
    disabled: open || draggingSelf,
    data: dropData,
  });
  const updateEpic = useMutation({
    mutationFn: (body: UpdateEpicBody) =>
      todexClient.epics.update(row.epic.id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["epics", spaceId] });
      await queryClient.invalidateQueries({ queryKey: ["epic", row.epic.id] });
    },
  });
  const assigned = tasks.filter((task) => task.epicId === row.epic.id);
  const completedTasks = assigned.filter(
    (task) => task.status === TaskStatus.DONE,
  ).length;

  function setCardRef(node: HTMLDivElement | null) {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  }

  function openEpic() {
    router.push(tasksUrlHelper.routing.buildEpicUrl(spaceName, row.epic.id));
  }

  return (
    <div
      ref={setCardRef}
      className={cn(
        "rounded-lg border border-border px-3 py-2.5 transition-colors duration-150",
        draggable.isDragging && "opacity-40",
        droppable.isOver && "bg-surface",
      )}
      onClick={openEpic}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <div className="flex items-center gap-2">
        <EpicMark />
        <PriorityMenu
          priority={row.epic.priority}
          onSelect={(priority) => updateEpic.mutate({ priority })}
        />
        <InlineTitle
          value={row.epic.name}
          className="flex-1 text-sm font-medium"
          onSave={(name) => updateEpic.mutate({ name })}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Collapse epic" : "Expand epic"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <ChevronIcon
            size={14}
            className={cn(
              "transition-transform duration-150",
              open && "rotate-90",
            )}
          />
        </button>
      </div>
      <EpicProgress done={completedTasks} total={assigned.length} />
      {open && allowTasks ? (
        <div
          className="mt-3 flex flex-col gap-2"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {row.tasks.map((task) => (
            <EpicTaskCard key={task.id} task={task} />
          ))}
          <TaskComposer
            open={adding}
            defaultBoardId={spaceId}
            onOpenChange={setAdding}
            onCreate={(values) =>
              createTask(values.summary, null, {
                estimation: values.estimation,
                status: values.status,
                priority: values.priority,
                spaceId,
                sectionId: row.epic.sectionId,
                epicId: row.epic.id,
                scheduleDate: values.scheduleDate,
                dueDate: values.dueDate,
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export function EpicTaskCard({
  task,
  draggable = true,
  onOpen,
  onToggleDone,
  onRename,
  onPriority,
}: {
  task: Task;
  draggable?: boolean;
  onOpen?: () => void;
  onToggleDone?: () => void;
  onRename?: (summary: string) => void;
  onPriority?: (priority: Task["priority"]) => void;
}) {
  const {
    actions: { setSelectedTaskId, updateTask, updateTaskStatus },
  } = useTasks();
  const estimate = formatEstimation(task.estimation);
  const card = (
    <div
      data-task-id={task.id}
      className={cn(
        "rounded-lg border border-border px-3 py-2.5 transition-colors duration-150 hover:bg-surface",
        task.status === TaskStatus.CANCELLED && "text-muted-foreground",
      )}
      onClick={() => (onOpen ? onOpen() : setSelectedTaskId(task.id))}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          data-no-dnd=""
          checked={task.status === TaskStatus.DONE}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() =>
            onToggleDone
              ? onToggleDone()
              : updateTaskStatus(task.id, statusAfterDoneToggle(task.status))
          }
        />
        <PriorityMenu
          priority={task.priority}
          onSelect={(priority) =>
            onPriority
              ? onPriority(priority)
              : updateTask(task.id, { priority })
          }
        />
        <StatusMenu
          status={task.status}
          onSelect={(status) => updateTaskStatus(task.id, status)}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {task.taskKey}
        </span>
      </div>
      <InlineTitle
        value={task.summary}
        className={cn(
          "mt-2 block w-full text-sm font-medium",
          task.status === TaskStatus.CANCELLED && "line-through",
        )}
        onSave={(summary) =>
          onRename ? onRename(summary) : updateTask(task.id, { summary })
        }
      />
      {estimate ? (
        <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon size={12} />
          Estimate {estimate}
        </span>
      ) : null}
    </div>
  );

  if (!draggable) return card;
  return (
    <DraggableTask taskId={task.id}>
      <TaskContextMenu taskId={task.id}>{card}</TaskContextMenu>
    </DraggableTask>
  );
}

function EpicProgress({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="mt-2.5 flex items-center gap-3">
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {percent}%
      </span>
    </div>
  );
}

function EpicMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted-foreground"
    >
      <path d="M3.5 9.2 12 4.2l8.5 5-8.5 4.4-8.5-4.4Z" />
      <path d="M5.5 14.2h13" />
      <path d="M5.5 18h13" />
    </svg>
  );
}
