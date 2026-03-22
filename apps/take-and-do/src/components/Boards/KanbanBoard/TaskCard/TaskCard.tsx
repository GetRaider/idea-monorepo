"use client";

import Image from "next/image";
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
import { getLabelAccent } from "@/helpers/label-color.helper";

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
        <PriorityIcon>
          {tasksHelper.priority.getIconLabel(priority)}
        </PriorityIcon>
        <Id>{taskKey || id}</Id>
        {!!subtasks.length && (
          <Subtasks>
            <Image
              src="/subtask.svg"
              alt="Subtasks"
              width={18}
              height={18}
              style={{ marginRight: 2 }}
            />
            <span>{subtasks.length}</span>
          </Subtasks>
        )}
      </Header>

      <Title $status={status}>{summary}</Title>

      <Meta>
        {!!scheduleDate && (
          <DateTime>
            <CalendarIcon size={14} />
            <span>{tasksHelper.date.formatForSchedule(scheduleDate)}</span>
          </DateTime>
        )}
        {!!estimation && (
          <DateTime>
            <ClockIcon size={14} />
            <span>{tasksHelper.estimation.format(estimation)}</span>
          </DateTime>
        )}
      </Meta>

      <Labels>
        {labels.map((label) => {
          const accent = getLabelAccent(label);
          return (
            <Tag key={label} $tintBg={accent.tintBg}>
              <TagDot $color={accent.dot} />
              {label}
            </Tag>
          );
        })}
      </Labels>
    </Card>
  );
}
