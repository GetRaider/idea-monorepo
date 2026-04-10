"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CalendarIcon, ClockIcon } from "@/components/Icons";
import { Task, TaskStatus } from "../types";
import { tasksHelper } from "@/helpers/task.helper";
import { getLabelAccent } from "@/helpers/label-color.helper";
import { cn } from "@/lib/styles/utils";

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

export function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const {
    id,
    taskKey,
    summary,
    status,
    priority,
    labels = [],
    estimation = 0,
    subtasks = [],
    scheduleDate,
  } = task;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({ taskId: id }));
    if (cardRef.current) {
      cardRef.current.style.opacity = "0.4";
      cardRef.current.style.transform = "scale(0.98)";
      cardRef.current.style.transition =
        "opacity 0.2s ease, transform 0.2s ease";
      cardRef.current.style.cursor = "grabbing";
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.style.opacity = "1";
      cardRef.current.style.transform = "scale(1)";
      cardRef.current.style.transition =
        "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      cardRef.current.style.cursor = "grab";
    }
  };

  const handleClick = () => {
    if (isDragging) return;
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className="flex cursor-grab flex-col gap-3 rounded-xl border border-border-app bg-card-bg p-4 transition-[border-color] duration-200 ease-out hover:border-[#3a3a3a] active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center text-xl leading-none">
          {tasksHelper.priority.getIconLabel(priority)}
        </span>
        <span className="text-xs font-medium text-[#888]">{taskKey || id}</span>
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
    </div>
  );
}
