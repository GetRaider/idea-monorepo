"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChevronRightIcon,
  ClockCircleIcon,
  ClockNavIcon,
} from "@/components/Icons";
import {
  BoardContainer,
  BoardMultiLayout,
  WorkspaceSeparator,
  LoadingContainer,
  Spinner,
  MultiBoardSection,
  MultiBoardColumnsGrid,
  GroupChevronWrapper,
  EmptyStateWrapper,
  BoardTitleEmoji,
} from "./KanbanBoard.styles";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, Task } from "./types";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";
import {
  composedDataToTask,
  createNewTaskTemplate,
} from "./shared/taskComposeHelpers";
import { useKanbanTaskHandlers } from "../../../hooks/useKanbanTaskHandlers";
import { useMultipleKanbanBoardData } from "../../../hooks/useMultipleKanbanBoardData";
import { TaskView } from "../../TaskView/TaskView";
import { updateTaskInColumns } from "@/hooks/useTaskBoardState";
import { EmptyState } from "../../EmptyState";
import { AIComposeModal } from "./shared/AIComposeModal";
import { apiServices } from "@/services/api";
import type { TaskBoardWithTasks } from "@/types/workspace";
import { tasksUrlHelper, type ScheduleDate } from "@/helpers/tasks-url.helper";
import { tasksHelper } from "@/helpers/task.helper";

export function MultipleKanbanBoard({
  scheduleDate,
  schedule,
  workspaceName,
  folderId,
  onTaskOpen,
  onTaskClose,
  onSubtaskOpen,
}: MultipleKanbanBoardProps) {
  const {
    boardsWithTasks,
    setBoardsWithTasks,
    isLoading,
    fetchBoards,
    expandedBoardIds,
    toggleBoardExpanded,
  } = useMultipleKanbanBoardData(scheduleDate, folderId);

  const [isAIComposeModalOpen, setIsAIComposeModalOpen] = useState(false);
  const [selectedBoardIdForAI, setSelectedBoardIdForAI] = useState<
    string | null
  >(null);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  const boardOptions = useMemo(
    () => boardsWithTasks.map((b) => ({ id: b.id, name: b.name })),
    [boardsWithTasks],
  );

  const handleNavigateToParentTask = useCallback(() => {
    if (!parentTask?.taskKey) return;
    if (schedule) {
      tasksUrlHelper.modal.schedule.open(schedule, parentTask);
    }
    setSelectedTask(parentTask);
    setParentTask(null);
  }, [parentTask, schedule, setSelectedTask, setParentTask]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      await handleMultipleBoardsTaskStatusChange(
        boardsWithTasks,
        setBoardsWithTasks,
        taskId,
        newStatus,
        targetIndex,
      );
    },
    [boardsWithTasks, setBoardsWithTasks],
  );

  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      const boardRelocated =
        selectedTask?.id === updatedTask.id &&
        selectedTask.taskBoardId !== updatedTask.taskBoardId;
      if (boardRelocated) {
        try {
          setBoardsWithTasks(await fetchBoards());
        } catch (error) {
          console.error(
            "[MultipleKanbanBoard] Failed to refresh tasks after board change:",
            error,
          );
        }
        setSelectedTask(updatedTask);
        return;
      }

      if (scheduleDate) {
        if (!updatedTask.scheduleDate) {
          try {
            setBoardsWithTasks(await fetchBoards());
          } catch (error) {
            console.error(
              "Failed to refresh tasks after schedule update:",
              error,
            );
          }
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }

        const taskDate = tasksHelper.date.parse(updatedTask.scheduleDate);
        if (!taskDate) {
          try {
            setBoardsWithTasks(await fetchBoards());
          } catch (error) {
            console.error(
              "Failed to refresh tasks after schedule update:",
              error,
            );
          }
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }
        taskDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(scheduleDate);
        currentDate.setHours(0, 0, 0, 0);

        const matchesSchedule = taskDate.getTime() === currentDate.getTime();

        if (!matchesSchedule) {
          try {
            setBoardsWithTasks(await fetchBoards());
          } catch (error) {
            console.error(
              "Failed to refresh tasks after schedule update:",
              error,
            );
          }
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }
      }

      setBoardsWithTasks((prev) =>
        prev.map((board) =>
          board.id !== updatedTask.taskBoardId
            ? board
            : {
                ...board,
                tasks: updateTaskInColumns(board.tasks, updatedTask),
              },
        ),
      );
      if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
    },
    [
      selectedTask,
      setSelectedTask,
      scheduleDate,
      fetchBoards,
      setBoardsWithTasks,
    ],
  );

  const handleCreateTask = useCallback(() => {
    if (boardsWithTasks.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    setSelectedTask(
      createNewTaskTemplate({
        taskBoardId: boardsWithTasks[0].id,
        scheduleDate: scheduleDate ?? undefined,
      }),
    );
  }, [boardsWithTasks, setSelectedTask, scheduleDate]);

  const handleCreateTaskWithAI = useCallback(() => {
    if (boardsWithTasks.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    setSelectedBoardIdForAI(boardsWithTasks[0].id);
    setIsAIComposeModalOpen(true);
  }, [boardsWithTasks]);

  const handleAICompose = useCallback(
    async (text: string) => {
      let taskBoardId = selectedBoardIdForAI;
      if (!taskBoardId && boardsWithTasks.length > 0) {
        taskBoardId = boardsWithTasks[0].id;
      }
      if (!taskBoardId) {
        console.error("Cannot compose task: taskBoardId not found");
        return;
      }
      try {
        const additionalData: Partial<Omit<Task, "id">> = scheduleDate
          ? { scheduleDate }
          : {};
        const composedData = await apiServices.tasks.composeWithAI(
          text,
          taskBoardId,
          additionalData,
        );
        const overrideScheduleDate = scheduleDate ?? undefined;
        setSelectedTask(composedDataToTask(composedData, overrideScheduleDate));
        setSelectedBoardIdForAI(null);
      } catch (error) {
        console.error("Failed to compose task with AI:", error);
        throw error;
      }
    },
    [boardsWithTasks, scheduleDate, selectedBoardIdForAI, setSelectedTask],
  );

  const handleTaskCreated = useCallback(
    async (createdTask: Task) => {
      try {
        setBoardsWithTasks(await fetchBoards());
        setSelectedTask(createdTask);
      } catch (error) {
        console.error("Failed to refresh tasks after creation:", error);
      }
    },
    [fetchBoards, setSelectedTask, setBoardsWithTasks],
  );

  const handleTaskDelete = useCallback(async () => {
    try {
      setBoardsWithTasks(await fetchBoards());
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to refresh tasks after deletion:", error);
    }
  }, [fetchBoards, setSelectedTask, setBoardsWithTasks]);

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={workspaceName}
          workspaceEmoji={
            workspaceName === "Today" ? (
              <ClockNavIcon size={20} />
            ) : workspaceName === "Tomorrow" ? (
              <ClockCircleIcon size={20} />
            ) : (
              (boardsWithTasks[0]?.emoji ?? null)
            )
          }
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
        />

        <BoardMultiLayout>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : boardsWithTasks.length > 0 ? (
            <>
              {boardsWithTasks.map((board) => {
                const isExpanded = expandedBoardIds.has(board.id);
                return (
                  <MultiBoardSection key={board.id}>
                    <WorkspaceSeparator
                      type="button"
                      onClick={() => toggleBoardExpanded(board.id)}
                    >
                      <GroupChevronWrapper $expanded={isExpanded}>
                        <ChevronRightIcon size={16} />
                      </GroupChevronWrapper>
                      {board.emoji ? (
                        <BoardTitleEmoji aria-hidden>
                          {board.emoji}
                        </BoardTitleEmoji>
                      ) : null}
                      {board.name}
                    </WorkspaceSeparator>

                    {isExpanded && (
                      <MultiBoardColumnsGrid>
                        <KanbanColumns
                          tasksByStatus={board.tasks}
                          columnBodyScrolls={false}
                          onTaskDrop={handleTaskStatusChange}
                          onTaskClick={handleTaskClick}
                        />
                      </MultiBoardColumnsGrid>
                    )}
                  </MultiBoardSection>
                );
              })}
            </>
          ) : (
            <EmptyStateWrapper>
              <EmptyState
                title="You have no tasks"
                message={
                  scheduleDate
                    ? `No tasks scheduled for ${scheduleDate.toLocaleDateString()}`
                    : `No tasks available for ${workspaceName}`
                }
              />
            </EmptyStateWrapper>
          )}
        </BoardMultiLayout>
      </BoardContainer>
      <TaskView
        task={selectedTask}
        parentTask={parentTask}
        boardName={getTaskWorkspaceTitle(
          selectedTask,
          boardsWithTasks,
          workspaceName,
        )}
        boardOptions={boardOptions}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
        onTaskCreated={handleTaskCreated}
        onTaskDelete={handleTaskDelete}
        onNavigateToParentTask={handleNavigateToParentTask}
      />
      <AIComposeModal
        isOpen={isAIComposeModalOpen}
        onClose={() => {
          setIsAIComposeModalOpen(false);
          setSelectedBoardIdForAI(null);
        }}
        onCompose={handleAICompose}
      />
    </>
  );
}

function getTaskWorkspaceTitle(
  task: Task | null,
  boardsWithTasks: TaskBoardWithTasks[],
  workspaceName: string,
): string {
  if (!task) return workspaceName;
  const board = boardsWithTasks.find((board) => board.id === task.taskBoardId);
  return board?.name || workspaceName;
}

interface MultipleKanbanBoardProps {
  scheduleDate?: Date;
  schedule?: ScheduleDate;
  workspaceName: string;
  folderId?: string;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}
