"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@/components/KanbanBoard/types";
import { EmptyState } from "@/components/EmptyState";
import { tasksService } from "@/services/api/tasks.service";
import { formatDisplayDate } from "@/utils/task.utils";
import { getPriorityIconLabel } from "@/components/KanbanBoard/TaskCard/TaskCard";
import { getStatusIcon } from "@/components/KanbanBoard/Column/Column";
import ScheduleOptimizationModal from "./ScheduleOptimizationModal";
import { OptimizeButton } from "./ScheduleOptimizationModal.styles";

function getStatusIconForString(status: string): string {
  if (status === TaskStatus.TODO) return getStatusIcon(TaskStatus.TODO);
  if (status === TaskStatus.IN_PROGRESS)
    return getStatusIcon(TaskStatus.IN_PROGRESS);
  if (status === TaskStatus.DONE) return getStatusIcon(TaskStatus.DONE);
  return getStatusIcon(TaskStatus.TODO);
}
import {
  Section,
  SectionHeader,
  SectionTitle,
  ScheduleSelect,
  DateInput,
  DateInputWrapper,
  TaskList,
  TaskItem,
  TaskContent,
  TaskLeft,
  TaskRight,
  PriorityIcon,
  TaskSummaryText,
  StatusContainer,
  StatusIcon,
  StatusText,
  ViewAllLink,
} from "./TodayTasks.styles";

interface ScheduledTasksProps {
  todayTasks: Task[];
  tomorrowTasks: Task[];
}

type ScheduleType = "today" | "tomorrow" | "custom";

function ScheduledTasks({ todayTasks, tomorrowTasks }: ScheduledTasksProps) {
  const [schedule, setSchedule] = useState<ScheduleType>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [customDateTasks, setCustomDateTasks] = useState<Task[]>([]);
  const [isLoadingCustomDate, setIsLoadingCustomDate] = useState(false);
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (schedule === "custom" && customDate) {
      setIsLoadingCustomDate(true);
      // Parse YYYY-MM-DD as local date, not UTC
      const dateParts = customDate.split("-");
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2], 10);
      const date = new Date(year, month, day);
      tasksService
        .getByDate(date)
        .then((tasks) => {
          setCustomDateTasks(tasks);
        })
        .catch((error) => {
          console.error("Failed to fetch tasks for custom date:", error);
          setCustomDateTasks([]);
        })
        .finally(() => {
          setIsLoadingCustomDate(false);
        });
    }
  }, [schedule, customDate]);

  const getTasks = () => {
    if (schedule === "today") return todayTasks;
    if (schedule === "tomorrow") return tomorrowTasks;
    return customDateTasks;
  };

  const getScheduleLabel = () => {
    if (schedule === "today") return "today";
    if (schedule === "tomorrow") return "tomorrow";
    if (schedule === "custom" && customDate) {
      return formatDisplayDate(new Date(customDate));
    }
    return "selected date";
  };

  const currentTasks = getTasks();
  const tasks = currentTasks.slice(0, 5);

  const handleOpenOptimizationModal = async () => {
    try {
      const fetchedTasks = await tasksService.getAll();
      setAllTasks(fetchedTasks);
      setIsOptimizationModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
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
              if (newSchedule !== "custom") {
                setCustomDate("");
              }
            }}
          >
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
      {isLoadingCustomDate ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading...
        </div>
      ) : tasks.length > 0 ? (
        <TaskList>
          {tasks.map((task) => (
            <TaskItem key={task.id}>
              <TaskContent>
                <TaskLeft>
                  <PriorityIcon>
                    {getPriorityIconLabel(task.priority)}
                  </PriorityIcon>
                  <TaskSummaryText>{task.summary}</TaskSummaryText>
                </TaskLeft>
                <TaskRight>
                  <StatusContainer>
                    <StatusIcon $status={task.status}>
                      {getStatusIconForString(task.status)}
                    </StatusIcon>
                    <StatusText $status={task.status}>{task.status}</StatusText>
                  </StatusContainer>
                </TaskRight>
              </TaskContent>
            </TaskItem>
          ))}
        </TaskList>
      ) : (
        <EmptyState
          title="You have no tasks"
          message={`No tasks scheduled for ${getScheduleLabel()}`}
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

export default ScheduledTasks;
