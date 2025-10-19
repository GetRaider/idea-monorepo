"use client";

import { Task, TaskPriority } from "../KanbanBoard";
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

  return (
    <Card>
      <Header>
        <PriorityIcon>{getPriorityIcon()}</PriorityIcon>
        <Id>{id}</Id>
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

      <Title>{summary}</Title>

      <Meta>
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
        <Tag $isCategory>
          <TagDot $isCategory />
          {status}
        </Tag>
      </Labels>
    </Card>
  );
}
