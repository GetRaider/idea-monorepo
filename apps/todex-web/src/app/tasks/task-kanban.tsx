"use client";

import type { HTMLAttributes, ReactNode, Ref } from "react";
import { useDraggable } from "@dnd-kit/core";
import { formatEstimation, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import { Checkbox, cn } from "@repo/ui";

import { CalendarIcon, ClockIcon } from "@components/icons";

import { useTasks } from "./tasks-provider";
import {
  PRIORITY_DOT,
  StatusDroppable,
  StatusGlyph,
} from "./task-board.ui";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  formatScheduleLabel,
  type NestedTask,
} from "./task-helpers";

export function TaskKanban({
  groups,
  boardNameById,
  showBoardName,
  todoTopSlot,
}: {
  groups: Record<Task["status"], NestedTask[]>;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  todoTopSlot?: ReactNode;
}) {
  const {
    state: { selectedTaskId },
    actions: { setSelectedTaskId, updateTaskStatus },
  } = useTasks();

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto">
      {STATUS_ORDER.map((status) => {
        const nodes = groups[status] ?? [];
        return (
          <StatusDroppable
            key={status}
            status={status}
            className="flex min-h-0 min-w-[320px] flex-1 flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <StatusGlyph status={status} />
              <span>{STATUS_LABEL[status]}</span>
              <span className="flex h-5 min-w-6 items-center justify-center rounded-[10px] bg-surface px-1.5 text-xs font-medium text-muted-foreground">
                {nodes.length}
              </span>
            </div>
            <ul className="flex min-h-[100px] flex-1 flex-col gap-2 overflow-auto rounded-lg border border-border bg-panel p-2">
              {status === TaskStatus.TODO && todoTopSlot ? (
                <li className="shrink-0">{todoTopSlot}</li>
              ) : null}
              {nodes.map((node) => (
                <li key={node.id}>
                  <KanbanCard
                    node={node}
                    selectedTaskId={selectedTaskId}
                    boardNameById={boardNameById}
                    showBoardName={showBoardName}
                    onSelect={setSelectedTaskId}
                    onToggleDone={() =>
                      updateTaskStatus(
                        node.id,
                        node.status === TaskStatus.DONE
                          ? TaskStatus.TODO
                          : TaskStatus.DONE,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </StatusDroppable>
        );
      })}
    </div>
  );
}

export function KanbanCardView({
  node,
  selectedTaskId,
  boardNameById,
  showBoardName,
  className,
  onSelect,
  onToggleDone,
  ref,
  onClick,
  ...rest
}: KanbanCardViewProps) {
  const scheduleLabel = formatScheduleLabel(node.scheduleDate);
  const estimationLabel = formatEstimation(node.estimation);

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left outline-none hover:border-ring",
        selectedTaskId === node.id && "border-ring",
        className,
      )}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        onSelect?.(node.id);
      }}
    >
      <div className="flex items-center gap-2">
        {onToggleDone ? (
          <Checkbox
            checked={node.status === TaskStatus.DONE}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={onToggleDone}
          />
        ) : null}
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[node.priority])}
        />
        <span className="font-mono text-xs text-muted-foreground">
          {node.taskKey}
        </span>
        {node.children.length > 0 ? (
          <span className="ml-auto text-xs text-muted-foreground">
            {node.children.length}
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "text-sm font-medium leading-snug",
          node.status === TaskStatus.DONE && "text-muted-foreground line-through",
        )}
      >
        {node.summary}
      </span>
      {showBoardName || scheduleLabel || estimationLabel ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {showBoardName ? (
            <span>{boardNameById.get(node.taskBoardId)}</span>
          ) : null}
          {scheduleLabel ? (
            <span className="flex items-center gap-1">
              <CalendarIcon size={12} />
              {scheduleLabel}
            </span>
          ) : null}
          {estimationLabel ? (
            <span className="flex items-center gap-1">
              <ClockIcon size={12} />
              {estimationLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function KanbanCard({
  node,
  selectedTaskId,
  boardNameById,
  showBoardName,
  onSelect,
  onToggleDone,
}: {
  node: NestedTask;
  selectedTaskId: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onSelect: (taskId: string) => void;
  onToggleDone: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
  });
  return (
    <KanbanCardView
      ref={setNodeRef}
      node={node}
      selectedTaskId={selectedTaskId}
      boardNameById={boardNameById}
      showBoardName={showBoardName}
      onToggleDone={onToggleDone}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "pointer-events-none opacity-0",
      )}
      onClick={() => {
        if (isDragging) return;
        onSelect(node.id);
      }}
      {...listeners}
      {...attributes}
    />
  );
}

interface KanbanCardViewProps extends HTMLAttributes<HTMLDivElement> {
  node: NestedTask;
  selectedTaskId?: string | null;
  boardNameById: Map<string, string>;
  showBoardName: boolean;
  onSelect?: (taskId: string) => void;
  onToggleDone?: () => void;
  ref?: Ref<HTMLDivElement>;
}
