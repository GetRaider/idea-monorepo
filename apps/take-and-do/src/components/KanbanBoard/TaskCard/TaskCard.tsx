"use client";

import { useRef } from "react";
import { Task, TaskPriority } from "../types";
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

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({
  task: {
    id,
    taskKey,
    summary,
    status,
    priority,
    labels = [],
    dueDate,
    estimation = 0,
    subtasks = [],
  },
}: TaskCardProps) {
  const getPriorityIcon = () => {
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
  };

  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
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
    if (cardRef.current) {
      cardRef.current.style.opacity = "1";
      cardRef.current.style.transform = "scale(1)";
      cardRef.current.style.transition =
        "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      cardRef.current.style.cursor = "grab";
    }
  };

  return (
    <Card
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Header>
        <PriorityIcon>{getPriorityIcon()}</PriorityIcon>
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="2"
                y="3"
                width="10"
                height="9"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M2 5h10M5 2v2M9 2v2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <span>{dueDate?.toLocaleDateString()}</span>
          </DateTime>
        )}
        <DateTime>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M7 4v3l2 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <span>{estimation}h</span>
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
