"use client";

import { useState } from "react";

import { Task, TaskStatus } from "@/components/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import { apiServices } from "@/services/api";
import { ScheduleType, tasksHelper } from "@/helpers/task.helper";
import { ScheduleOptimizationModal } from "./AIPlanningOptimizationModal";
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
  Loading,
  ScheduleSelectContainer,
} from "./TimelinePlanning.styles";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useCustomDateTasks } from "@/hooks/useCustomDate";

interface TimelinePlanningProps {
  todayTasks: Task[];
  tomorrowTasks: Task[];
}

export function TimelinePlanning({
  todayTasks,
  tomorrowTasks,
}: TimelinePlanningProps) {
  const [customDate, setCustomDate] = useState<string>("");
  const { customDateTasks, isLoadingCustomDate, setSchedule, schedule } =
    useCustomDateTasks(customDate);
  const { recentTasks, isLoadingRecent } = useRecentTasks();
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const currentTasks = tasksHelper.sortScheduledTasksByStatus(
    schedule,
    recentTasks,
    todayTasks,
    tomorrowTasks,
    customDateTasks,
  );
  const firstFiveTasks = currentTasks.slice(0, 5);
  const isLoading = schedule === "new" ? isLoadingRecent : isLoadingCustomDate;

  const handleOpenOptimizationModal = async () => {
    try {
      const fetchedTasks = await apiServices.tasks.getAll();
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
        <ScheduleSelectContainer>
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
        </ScheduleSelectContainer>
      </SectionHeader>
      {isLoading ? (
        <Loading>Loading...</Loading>
      ) : firstFiveTasks.length > 0 ? (
        <TaskList>
          <TaskListHeader>
            <HeaderCell>Task</HeaderCell>
            <HeaderCell>Schedule</HeaderCell>
            <HeaderCell>Due Date</HeaderCell>
            <HeaderCell>Est.</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </TaskListHeader>
          {firstFiveTasks.map((task: Task) => (
            <TaskItem key={task.id}>
              <TaskContent>
                <TaskLeft>
                  <PriorityIcon>
                    {tasksHelper.priority.getIconLabel(task.priority)}
                  </PriorityIcon>
                  <TaskSummaryText>{task.summary}</TaskSummaryText>
                </TaskLeft>
              </TaskContent>
              <TaskCell>
                {task.scheduleDate
                  ? tasksHelper.date.formatForSchedule(task.scheduleDate)
                  : "—"}
              </TaskCell>
              <TaskCell>
                {task.dueDate
                  ? tasksHelper.date.formatForSchedule(task.dueDate)
                  : "—"}
              </TaskCell>
              <TaskCellMuted>
                {task.estimation
                  ? tasksHelper.estimation.hours(task.estimation)
                  : "—"}
              </TaskCellMuted>
              <StatusContainer>
                <StatusIcon $status={task.status}>
                  {tasksHelper.status.getIcon(task.status)}
                </StatusIcon>
                <StatusText $status={task.status}>{task.status}</StatusText>
              </StatusContainer>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState
          title="You have no tasks"
          message={`No tasks scheduled for ${tasksHelper.getScheduleLabel(schedule, customDate)}`}
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
