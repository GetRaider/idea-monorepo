"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import { apiServices } from "@/services/api";
import { ScheduleType, tasksHelper } from "@/helpers/task.helper";
import { AIPlanningOptimizationDialog } from "./AIPlanningOptimizationModal/AIPlanningOptimizationModal";
import { OptimizeButton } from "./AIPlanningOptimizationModal/AIPlanningOptimizationModal.styles";
import {
  Section,
  SectionHeader,
  SectionTitle,
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
  ScheduleSelectContainer,
} from "./TimelinePlanning.styles";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useCustomDateTasks } from "@/hooks/useCustomDate";
import { LoadingContainer, Spinner } from "../page.styles";
import { buildTasksUrl } from "@/helpers/tasks-routing.helper";
import { Dropdown } from "@/components/Dropdown";
import { toast } from "sonner";

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
  const router = useRouter();

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
    setIsOptimizationModalOpen(true);
  };

  const handleTaskClick = async (task: Task) => {
    try {
      const taskBoard = await apiServices.taskBoards.getById(task.taskBoardId);
      router.push(
        buildTasksUrl({
          type: "board",
          boardName: taskBoard.name,
          taskKey: task.taskKey,
        }),
      );
    } catch (error) {
      console.error("[TimelinePlanning] Failed to open task:", error);
      toast.error("Failed to open task board.");
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>⏳ Timeline Planning</SectionTitle>
        <ScheduleSelectContainer>
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
          <Dropdown
            options={[
              { label: "New", value: "new" },
              { label: "Today", value: "today" },
              { label: "Tomorrow", value: "tomorrow" },
              { label: "Custom Date", value: "custom" },
            ]}
            value={schedule}
            onChange={(value) => setSchedule(value as ScheduleType)}
          />
          <OptimizeButton onClick={handleOpenOptimizationModal}>
            ✨ Explore AI Optimization
          </OptimizeButton>
        </ScheduleSelectContainer>
      </SectionHeader>
      {isLoading ? (
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
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
            <TaskItem key={task.id} onClick={() => handleTaskClick(task)}>
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
        <AIPlanningOptimizationDialog
          onClose={() => setIsOptimizationModalOpen(false)}
        />
      )}
    </Section>
  );
}
