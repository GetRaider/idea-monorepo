"use client";

import { useRef, useState } from "react";
import { CalendarIcon, ClockIcon } from "@/components/Icons";
import { Task } from "../types";
import {
  Card,
  Header,
  PriorityIcon,
  Id,
  Subtasks,
  Title,
  Meta,
  DateTime,
  Labels,
  Tag,
  TagDot,
} from "./TaskCard.styles";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskPriority } from "@/components/KanbanBoard/types";

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

export default function TaskCard({ task, onTaskClick }: TaskCardProps) {
  const {
    id,
    taskKey,
    summary,
    status,
    priority,
    labels = [],
    dueDate,
    estimation = 0,
    subtasks = [],
  } = task;
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ taskId: id }));
    if (cardRef.current) {
      cardRef.current.style.opacity = "0.4";
      cardRef.current.style.transform = "scale(0.98)";
      cardRef.current.style.transition =
        "opacity 0.2s ease, transform 0.2s ease";
      cardRef.current.style.cursor = "grabbing";
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.style.opacity = "1";
      cardRef.current.style.transform = "scale(1)";
      cardRef.current.style.transition =
        "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      cardRef.current.style.cursor = "grab";
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't open modal if user is dragging
    if (isDragging) return;
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <Card
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <Header>
        <PriorityIcon>{getPriorityIconLabel(priority)}</PriorityIcon>
        <Id>{taskKey || id}</Id>
        {!!subtasks.length && (
          <Subtasks>
            <img
              src="/subtask.svg"
              alt="Subtasks"
              width={18}
              height={18}
              style={{ marginRight: 2, color: "#666" }}
            />
            <span>{subtasks.length}</span>
          </Subtasks>
        )}
      </Header>

      <Title $status={status}>{summary}</Title>

      <Meta>
        {!!dueDate && (
          <DateTime>
            <CalendarIcon size={14} />
            <span>{dueDate?.toLocaleDateString()}</span>
          </DateTime>
        )}
        <DateTime>
          <ClockIcon size={14} />
          <span>{tasksHelper.estimation.format(estimation)}</span>
        </DateTime>
      </Meta>

      <Labels>
        {labels.map((label, index) => (
          <Tag key={index}>
            <TagDot />
            {label}
          </Tag>
        ))}
      </Labels>
    </Card>
  );
}

export function getPriorityIconLabel(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return "🔵";
    case TaskPriority.MEDIUM:
      return "🟡";
    case TaskPriority.HIGH:
      return "🔴";
    case TaskPriority.CRITICAL:
      return "🟣";
    default:
      return "🚫";
  }
}
