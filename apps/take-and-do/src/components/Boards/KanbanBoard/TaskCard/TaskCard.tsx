"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import { CalendarIcon, ClockIcon } from "@/components/Icons";
import { Task, TaskStatus } from "../types";
import { tasksHelper } from "@/helpers/task.helper";
import { getLabelAccent } from "@/helpers/label-color.helper";
import { cn } from "@/lib/styles/utils";
import type { KanbanCardDraggableData } from "../shared/kanbanDnd";

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

/**
 * Draggable Kanban card.
 *
 * The dragged copy is rendered separately by `KanbanColumns` inside a
 * `<DragOverlay>` (see {@link TaskCardView}); this component keeps the
 * original in its slot but hides it (`opacity-0`) so the user only sees the
 * floating preview. We avoid applying the dnd-kit transform here because the
 * overlay already follows the cursor — translating the original would also
 * push it out of its column's `overflow: auto` viewport, which made cards
 * appear to disappear mid-drag.
 */
export function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const draggableData: KanbanCardDraggableData = {
    type: "card",
    taskId: task.id,
    currentStatus: task.status,
  };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: draggableData,
  });

  const handleClick = () => {
    if (isDragging) return;
    onTaskClick?.(task);
  };

  const viewTransitionStyle: CSSProperties = {
    // Stable identity for the View Transitions API so completion / status
    // changes animate smoothly across columns. Browsers without support just
    // ignore the property.
    viewTransitionName: `kanban-card-${task.id}`,
  };

  return (
    <TaskCardView
      task={task}
      ref={setNodeRef}
      style={viewTransitionStyle}
      className={cn(
        "cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring/70 active:cursor-grabbing",
        // The DragOverlay shows a fully-opaque clone that follows the cursor,
        // so we hide the original entirely (still occupying its slot) instead
        // of leaving a faded duplicate that confuses the eye.
        isDragging && "pointer-events-none opacity-0 focus-visible:ring-0",
      )}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    />
  );
}

interface TaskCardViewProps {
  task: Task;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Pure presentation of a Kanban card. Used directly inside `<DragOverlay>` and
 * via {@link TaskCard} as the in-column rendering.
 */
export function TaskCardView({
  task,
  className,
  style,
  onClick,
  ref,
  ...rest
}: TaskCardViewProps & React.HTMLAttributes<HTMLDivElement>) {
  const {
    taskKey,
    summary,
    status,
    priority,
    labels = [],
    estimation = 0,
    subtasks = [],
    scheduleDate,
  } = task;

  return (
    <div
      ref={ref}
      style={style}
      onClick={onClick}
      className={cn(
        // `outline-none` suppresses the user-agent focus outline (often blue
        // on macOS / Chrome) — our own purple ring is applied via classes when
        // the card is focused or hovered as a drag preview.
        "flex flex-col gap-3 rounded-xl border border-border-app bg-background-primary p-4 outline-none transition-[border-color] duration-200 ease-out hover:border-[#3a3a3a]",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center text-xl leading-none">
          {tasksHelper.priority.getIconLabel(priority)}
        </span>
        <span className="text-xs font-medium text-[#888]">
          {taskKey || task.id}
        </span>
        {!!subtasks.length && (
          <div className="ml-auto flex items-center gap-1 text-sm text-[#666]">
            <Image
              src="/subtask.svg"
              alt="Subtasks"
              width={18}
              height={18}
              className="mr-0.5"
            />
            <span>{subtasks.length}</span>
          </div>
        )}
      </div>

      <h3
        className={cn(
          "m-0 text-sm font-medium leading-snug",
          status === TaskStatus.DONE
            ? "text-[#888] line-through"
            : "text-white no-underline",
        )}
      >
        {summary}
      </h3>

      <div className="flex items-center gap-3">
        {!!scheduleDate && (
          <div className="flex items-center gap-1 text-xs text-[#888]">
            <CalendarIcon size={14} />
            <span>{tasksHelper.date.formatForSchedule(scheduleDate)}</span>
          </div>
        )}
        {!!estimation && (
          <div className="flex items-center gap-1 text-xs text-[#888]">
            <ClockIcon size={14} />
            <span>{tasksHelper.estimation.format(estimation)}</span>
          </div>
        )}
      </div>

      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => {
            const accent = getLabelAccent(label);
            return (
              <span
                key={label}
                style={{ background: accent.tintBg }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#888]"
              >
                <span
                  style={{ background: accent.dot }}
                  className="h-1 w-1 shrink-0 rounded-full"
                />
                {label}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
