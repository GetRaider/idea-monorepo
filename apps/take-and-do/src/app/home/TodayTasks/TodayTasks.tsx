"use client";

import { Task } from "@/components/KanbanBoard/types";
import {
  Section,
  SectionTitle,
  TaskList,
  TaskItem,
  TaskSummary,
  TaskStatusBadge,
  EmptyState,
  ViewAllLink,
} from "./TodayTasks.styles";

interface TodayTasksProps {
  tasks: Task[];
  maxTasks?: number;
}

function TodayTasks({ tasks, maxTasks = 5 }: TodayTasksProps) {
  return (
    <Section>
      <SectionTitle>📝 Today&apos;s Tasks</SectionTitle>
      {tasks.length > 0 ? (
        <TaskList>
          {tasks.slice(0, maxTasks).map((task) => (
            <TaskItem key={task.id}>
              <TaskSummary>
                <strong>{task.summary}</strong>
                <TaskStatusBadge $status={task.status}>
                  {task.status}
                </TaskStatusBadge>
              </TaskSummary>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState>No tasks scheduled for today</EmptyState>
      )}
      <ViewAllLink href="/tasks">View all tasks →</ViewAllLink>
    </Section>
  );
}

export default TodayTasks;
