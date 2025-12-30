"use client";

import { useState } from "react";
import { Task } from "@/components/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import {
  Section,
  SectionHeader,
  SectionTitle,
  ScheduleSelect,
  TaskList,
  TaskItem,
  TaskSummary,
  TaskSummaryText,
  TaskStatusBadge,
  ViewAllLink,
} from "./TodayTasks.styles";

interface ScheduledTasksProps {
  todayTasks: Task[];
  tomorrowTasks: Task[];
}

function ScheduledTasks({ todayTasks, tomorrowTasks }: ScheduledTasksProps) {
  const [schedule, setSchedule] = useState<"today" | "tomorrow">("today");
  const tasks = schedule === "today" ? todayTasks : tomorrowTasks;
  const isCompact = tasks.length > 5;

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>📅 Scheduled Tasks</SectionTitle>
        <ScheduleSelect
          value={schedule}
          onChange={(e) => setSchedule(e.target.value as "today" | "tomorrow")}
        >
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
        </ScheduleSelect>
      </SectionHeader>
      {tasks.length > 0 ? (
        <TaskList $compact={isCompact}>
          {tasks.map((task) => (
            <TaskItem key={task.id} $compact={isCompact}>
              <TaskSummary $compact={isCompact}>
                <TaskSummaryText $compact={isCompact}>
                  {task.summary}
                </TaskSummaryText>
                <TaskStatusBadge $status={task.status} $compact={isCompact}>
                  {task.status}
                </TaskStatusBadge>
              </TaskSummary>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState
          title="You have no tasks"
          message={`No tasks scheduled for ${schedule === "today" ? "today" : "tomorrow"}`}
        />
      )}
      <ViewAllLink href="/tasks">View all tasks →</ViewAllLink>
    </Section>
  );
}

export default ScheduledTasks;
