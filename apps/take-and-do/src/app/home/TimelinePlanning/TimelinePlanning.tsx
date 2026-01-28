"use client";

import { useState } from "react";

import { Task, TaskStatus } from "@/components/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import { tasksService } from "@/services/api/tasks.service";
import { ScheduleType, tasksUtils } from "@/utils/task.utils";
import { getPriorityIconLabel } from "@/components/KanbanBoard/TaskCard/TaskCard";
import { getStatusIcon } from "@/components/KanbanBoard/Column/Column";
import ScheduleOptimizationModal from "./AIPlanningOptimizationModal";
import { OptimizeButton } from "./AIPlanningOptimizationModal.styles";
import {
  Section,
  SectionHeader,
  SectionTitle,
  ScheduleSelect,
  DateInput,
  DateInputWrapper,
  TaskList,
  TaskListHeader,
  HeaderCell,
  TaskItem,
  TaskContent,
  TaskLeft,
  TaskCell,
  TaskCellMuted,
  PriorityIcon,
  TaskSummaryText,
  StatusContainer,
  StatusIcon,
  StatusText,
  ViewAllLink,
} from "./TimelinePlanning.styles";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useCustomDateTasks } from "@/hooks/useCustomDate";

interface TimelinePlanningProps {
  todayTasks: Task[];
  tomorrowTasks: Task[];
}

function TimelinePlanning({
  todayTasks,
  tomorrowTasks,
}: TimelinePlanningProps) {
  const [customDate, setCustomDate] = useState<string>("");
  const { customDateTasks, isLoadingCustomDate, setSchedule, schedule } =
    useCustomDateTasks(customDate);
  const { recentTasks, isLoadingRecent } = useRecentTasks();
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "—";
    return tasksUtils.date.formatForSchedule(date);
  };

  const formatEstimation = (hours: number | undefined): string => {
    if (!hours) return "—";
    return `${hours}h`;
  };

  const currentTasks = tasksUtils.sortScheduledTasksByStatus(
    schedule,
    recentTasks,
    todayTasks,
    tomorrowTasks,
    customDateTasks,
  );
  const tasks = currentTasks.slice(0, 5);
  const isLoading = schedule === "new" ? isLoadingRecent : isLoadingCustomDate;

  const handleOpenOptimizationModal = async () => {
    try {
      const fetchedTasks = await tasksService.getAll();
      setAllTasks(fetchedTasks);
      setIsOptimizationModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch tasks for optimization:", error);
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>⏳ Timeline Planning</SectionTitle>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <ScheduleSelect
            value={schedule}
            onChange={(e) => {
              const newSchedule = e.target.value as ScheduleType;
              setSchedule(newSchedule);
              if (newSchedule !== "custom") setCustomDate("");
            }}
          >
            <option value="new">New</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="custom">Custom Date</option>
          </ScheduleSelect>
          {schedule === "custom" && (
            <DateInputWrapper>
              <DateInput
                type="date"
                value={customDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomDate(e.target.value)
                }
                onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                  e.currentTarget.showPicker?.()
                }
              />
            </DateInputWrapper>
          )}
          <OptimizeButton onClick={handleOpenOptimizationModal}>
            ✨ Explore AI Optimization
          </OptimizeButton>
        </div>
      </SectionHeader>
      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading...
        </div>
      ) : tasks.length > 0 ? (
        <TaskList>
          <TaskListHeader>
            <HeaderCell>Task</HeaderCell>
            <HeaderCell>Schedule</HeaderCell>
            <HeaderCell>Due Date</HeaderCell>
            <HeaderCell>Est.</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </TaskListHeader>
          {tasks.map((task: Task) => (
            <TaskItem key={task.id}>
              <TaskContent>
                <TaskLeft>
                  <PriorityIcon>
                    {getPriorityIconLabel(task.priority)}
                  </PriorityIcon>
                  <TaskSummaryText>{task.summary}</TaskSummaryText>
                </TaskLeft>
              </TaskContent>
              <TaskCell>{formatDate(task.scheduleDate)}</TaskCell>
              <TaskCell>{formatDate(task.dueDate)}</TaskCell>
              <TaskCellMuted>{formatEstimation(task.estimation)}</TaskCellMuted>
              <StatusContainer>
                <StatusIcon $status={task.status}>
                  {getStatusIconForString(task.status)}
                </StatusIcon>
                <StatusText $status={task.status}>{task.status}</StatusText>
              </StatusContainer>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState
          title="You have no tasks"
          message={`No tasks scheduled for ${tasksUtils.getScheduleLabel(schedule, customDate)}`}
        />
      )}
      <ViewAllLink href="/tasks">View all tasks →</ViewAllLink>

      {isOptimizationModalOpen && (
        <ScheduleOptimizationModal
          onClose={() => setIsOptimizationModalOpen(false)}
          tasks={allTasks}
        />
      )}
    </Section>
  );
}

export default TimelinePlanning;

function getStatusIconForString(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return getStatusIcon(TaskStatus.TODO);
    case TaskStatus.IN_PROGRESS:
      return getStatusIcon(TaskStatus.IN_PROGRESS);
    case TaskStatus.DONE:
      return getStatusIcon(TaskStatus.DONE);
    default:
      return getStatusIcon(TaskStatus.TODO);
  }
}
