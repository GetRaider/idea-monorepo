"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRightIcon } from "@/components/Icons";
import {
  BoardContainer,
  BoardMultiLayout,
  WorkspaceSeparator,
  LoadingContainer,
  Spinner,
  TaskGroupSection,
  TaskGroupColumnsGrid,
  GroupChevronWrapper,
  EmptyStateWrapper,
} from "./KanbanBoard.styles";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, TaskGroup, Task } from "./types";
import {
  fetchTaskBoardNameMap,
  loadScheduledContent,
  loadFolderContent,
} from "./shared/dataLoaders";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";
import { composedDataToTask, createNewTaskTemplate } from "./shared/taskComposeHelpers";
import { useKanbanTaskHandlers } from "./shared/useKanbanTaskHandlers";
import { TaskView } from "../../TaskView/TaskView";
import { updateTaskInColumns } from "@/hooks/useTaskBoardState";
import { EmptyState } from "../../EmptyState";
import { AIComposeModal } from "./shared/AIComposeModal";
import { apiServices } from "@/services/api";

interface MultipleKanbanBoardProps {
  scheduleDate?: Date;
  workspaceTitle: string;
  folderId?: string;
  taskBoardNameMap?: Record<string, string>;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}

export function MultipleKanbanBoard({
  scheduleDate,
  workspaceTitle,
  folderId,
  taskBoardNameMap = {},
  onTaskOpen,
  onTaskClose,
  onSubtaskOpen,
}: MultipleKanbanBoardProps) {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isAIComposeModalOpen, setIsAIComposeModalOpen] = useState(false);
  const [selectedBoardIdForAI, setSelectedBoardIdForAI] = useState<
    string | null
  >(null);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const taskBoardNamesMap =
          Object.keys(taskBoardNameMap).length > 0
            ? taskBoardNameMap
            : await fetchTaskBoardNameMap();

        let loadedGroups: TaskGroup[] = [];
        if (scheduleDate) {
          await loadScheduledContent({
            scheduleDate,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        } else if (folderId) {
          await loadFolderContent({
            folderId,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        }

        // Expand all groups by default
        if (loadedGroups.length > 0) {
          const allGroupIds = loadedGroups.map((g) => g.taskBoardId);
          setExpandedGroups(new Set(allGroupIds));
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTaskGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleDate, folderId]);

  const toggleGroup = (taskBoardId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskBoardId)) {
        newSet.delete(taskBoardId);
      } else {
        newSet.add(taskBoardId);
      }
      return newSet;
    });
  };

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      await handleMultipleBoardsTaskStatusChange(
        taskGroups,
        setTaskGroups,
        taskId,
        newStatus,
        targetIndex,
      );
    },
    [taskGroups],
  );

  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      // If we're in a scheduled view, check if the task still belongs to this scheduleDate
      if (scheduleDate) {
        // If scheduleDate was removed, task should be removed from scheduled view
        if (!updatedTask.scheduleDate) {
          try {
            const taskBoardNamesMap =
              Object.keys(taskBoardNameMap).length > 0
                ? taskBoardNameMap
                : await fetchTaskBoardNameMap();
            await loadScheduledContent({
              scheduleDate,
              taskBoardNamesMap,
              setTaskGroups,
            });
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

        // Check if scheduleDate matches the current scheduleDate
        const taskDate = new Date(updatedTask.scheduleDate);
        taskDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(scheduleDate);
        currentDate.setHours(0, 0, 0, 0);

        const matchesSchedule = taskDate.getTime() === currentDate.getTime();

        // If task no longer belongs to this scheduleDate, refresh the entire list
        if (!matchesSchedule) {
          try {
            const taskBoardNamesMap =
              Object.keys(taskBoardNameMap).length > 0
                ? taskBoardNameMap
                : await fetchTaskBoardNameMap();
            await loadScheduledContent({
              scheduleDate,
              taskBoardNamesMap,
              setTaskGroups,
            });
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

      // Otherwise, update the task in place
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group.taskBoardId !== updatedTask.taskBoardId) {
            return group;
          }
          return {
            ...group,
            tasks: updateTaskInColumns(group.tasks, updatedTask),
          };
        }),
      );
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask, setSelectedTask, scheduleDate, taskBoardNameMap],
  );

  const handleCreateTask = useCallback(() => {
    if (taskGroups.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    setSelectedTask(
      createNewTaskTemplate({
        taskBoardId: taskGroups[0].taskBoardId,
        scheduleDate: scheduleDate ?? undefined,
      }),
    );
  }, [taskGroups, setSelectedTask, scheduleDate]);

  const handleCreateTaskWithAI = useCallback(() => {
    if (taskGroups.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    setSelectedBoardIdForAI(taskGroups[0].taskBoardId);
    setIsAIComposeModalOpen(true);
  }, [taskGroups]);

  const handleAICompose = useCallback(
    async (text: string) => {
      let taskBoardId = selectedBoardIdForAI;
      if (!taskBoardId && taskGroups.length > 0) {
        taskBoardId = taskGroups[0].taskBoardId;
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
    [taskGroups, scheduleDate, selectedBoardIdForAI, setSelectedTask],
  );

  const handleTaskCreated = useCallback(
    async (createdTask: Task) => {
      try {
        const taskBoardNamesMap =
          Object.keys(taskBoardNameMap).length > 0
            ? taskBoardNameMap
            : await fetchTaskBoardNameMap();
        let loadedGroups: TaskGroup[] = [];
        if (scheduleDate) {
          await loadScheduledContent({
            scheduleDate,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        } else if (folderId) {
          await loadFolderContent({
            folderId,
            taskBoardNamesMap,
            setTaskGroups: (groups) => {
              loadedGroups = groups;
              setTaskGroups(groups);
            },
          });
        }
        setSelectedTask(createdTask);
      } catch (error) {
        console.error("Failed to refresh tasks after creation:", error);
      }
    },
    [scheduleDate, folderId, taskBoardNameMap, setSelectedTask],
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      try {
        const taskBoardNamesMap =
          Object.keys(taskBoardNameMap).length > 0
            ? taskBoardNameMap
            : await fetchTaskBoardNameMap();
        if (scheduleDate) {
          await loadScheduledContent({
            scheduleDate,
            taskBoardNamesMap,
            setTaskGroups,
          });
        } else if (folderId) {
          await loadFolderContent({
            folderId,
            taskBoardNamesMap,
            setTaskGroups,
          });
        }
        setSelectedTask(null);
      } catch (error) {
        console.error("Failed to refresh tasks after deletion:", error);
      }
    },
    [scheduleDate, folderId, taskBoardNameMap, setSelectedTask],
  );

  const getTaskWorkspaceTitle = (task: Task | null): string => {
    if (!task) return workspaceTitle;
    const group = taskGroups.find((g) => g.taskBoardId === task.taskBoardId);
    return group?.taskBoardName || workspaceTitle;
  };

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={workspaceTitle}
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
        />

        <BoardMultiLayout>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : taskGroups.length > 0 ? (
            <>
              {taskGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.taskBoardId);
                return (
                  <TaskGroupSection
                    key={group.taskBoardId}
                    $expanded={isExpanded}
                  >
                    <WorkspaceSeparator
                      type="button"
                      onClick={() => toggleGroup(group.taskBoardId)}
                    >
                      <GroupChevronWrapper $expanded={isExpanded}>
                        <ChevronRightIcon size={16} />
                      </GroupChevronWrapper>
                      {group.taskBoardName}
                    </WorkspaceSeparator>

                    {isExpanded && (
                      <TaskGroupColumnsGrid>
                        <KanbanColumns
                          tasksByStatus={group.tasks}
                          onTaskDrop={handleTaskStatusChange}
                          onTaskClick={handleTaskClick}
                        />
                      </TaskGroupColumnsGrid>
                    )}
                  </TaskGroupSection>
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
                    : `No tasks available for ${workspaceTitle}`
                }
              />
            </EmptyStateWrapper>
          )}
        </BoardMultiLayout>
      </BoardContainer>
      <TaskView
        task={selectedTask}
        parentTask={parentTask}
        workspaceTitle={getTaskWorkspaceTitle(selectedTask)}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
        onTaskCreated={handleTaskCreated}
        onTaskDelete={handleTaskDelete}
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
