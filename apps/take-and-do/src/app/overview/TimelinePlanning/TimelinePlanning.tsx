"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Task } from "@/components/Boards/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { guestStoreHelper } from "@/stores/guest";
import { clientServices } from "@/services";
import { ScheduleType, tasksHelper } from "@/helpers/task.helper";
import { AiGate } from "@/components/ai-gate";
import { AIPlanningOptimizationDialog } from "./AIPlanningOptimizationDialog/AIPlanningOptimizationDialog";
import { OptimizeButton } from "./AIPlanningOptimizationDialog/AIPlanningOptimizationDialog.ui";
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
} from "./TimelinePlanning.ui";
import { useRecentTasks } from "@/hooks/useRecentTasks";
import { useCustomDateTasks } from "@/hooks/useCustomDate";
import { SpinnerRing } from "@/components/Spinner/Spinner";
import { LoadingStackContainer } from "@/components/LoadingStack/LoadingStack";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
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
  const isAnonymous = useIsAnonymous();
  const [customDate, setCustomDate] = useState<string>("");
  const { customDateTasks, isLoadingCustomDate, setSchedule, schedule } =
    useCustomDateTasks(customDate);
  const { recentTasks, isLoadingRecent } = useRecentTasks();
  const [isOptimizationDialogOpen, setIsOptimizationDialogOpen] =
    useState(false);
  const router = useRouter();

  const currentTasks = tasksHelper.schedule.sortTasksByStatus(
    schedule,
    recentTasks,
    todayTasks,
    tomorrowTasks,
    customDateTasks,
  );
  const firstFiveTasks = currentTasks.slice(0, 5);
  const isLoading = schedule === "new" ? isLoadingRecent : isLoadingCustomDate;

  const handleOpenOptimizationDialog = async () => {
    setIsOptimizationDialogOpen(true);
  };

  const handleTaskClick = async (task: Task) => {
    const taskBoard = isAnonymous
      ? guestStoreHelper.getTaskBoardById(task.taskBoardId)
      : await clientServices.taskBoards.getById(task.taskBoardId);
    if (!taskBoard) {
      toast.error(isAnonymous ? "Task board not found" : "Can't load board");
      return;
    }
    router.push(
      tasksUrlHelper.routing.buildTasksUrl({
        type: "board",
        boardName: taskBoard.name,
        taskKey: task.taskKey,
      }),
    );
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
          <AiGate>
            <OptimizeButton onClick={handleOpenOptimizationDialog}>
              ✨ Explore AI Optimization
            </OptimizeButton>
          </AiGate>
        </ScheduleSelectContainer>
      </SectionHeader>
      {isLoading ? (
        <LoadingStackContainer>
          <SpinnerRing />
        </LoadingStackContainer>
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
                <StatusIcon status={task.status}>
                  {tasksHelper.status.getIcon(task.status)}
                </StatusIcon>
                <StatusText status={task.status}>{task.status}</StatusText>
              </StatusContainer>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState
          title="You have no recent tasks to analyze"
          message="Try adding some tasks to your workspace and come back later to analyze them."
        />
      )}
      <ViewAllLink href="/tasks">View all tasks →</ViewAllLink>

      {isOptimizationDialogOpen && (
        <AIPlanningOptimizationDialog
          onClose={() => setIsOptimizationDialogOpen(false)}
        />
      )}
    </Section>
  );
}
