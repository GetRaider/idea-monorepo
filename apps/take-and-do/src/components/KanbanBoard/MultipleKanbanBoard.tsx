"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BoardContainer,
  Board,
  WorkspaceSeparator,
  LoadingContainer,
  Spinner,
  TaskGroupWrapper,
  GroupChevron,
  EmptyStateWrapper,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Toolbar } from "./shared/Toolbar";
import { TaskStatus, TaskPriority, TaskGroup, Task } from "./types";
import {
  fetchTaskBoardNameMap,
  loadScheduledContent,
  loadFolderContent,
} from "./shared/dataLoaders";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";
import TaskView from "../TaskView/TaskView";
import SelectBoardModal from "../NavigationSidebar/SelectBoardModal";
import {
  useTaskBoardState,
  updateTaskInColumns,
} from "@/hooks/useTaskBoardState";
import { EmptyState } from "../EmptyState";
import { AIComposeModal } from "./shared/AIComposeModal";
import { tasksService } from "@/services/api/tasks.service";

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
  const [showSelectBoardModal, setShowSelectBoardModal] = useState(false);
  const [isAIComposeModalOpen, setIsAIComposeModalOpen] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedBoardIdForAI, setSelectedBoardIdForAI] = useState<
    string | null
  >(null);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick: baseHandleTaskClick,
    handleCloseModal: baseHandleCloseModal,
    handleSubtaskClick: baseHandleSubtaskClick,
  } = useTaskBoardState();

  const handleTaskClick = (task: Task) => {
    baseHandleTaskClick(task);
    onTaskOpen?.(task);
  };

  const handleCloseModal = () => {
    baseHandleCloseModal();
    onTaskClose?.();
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (selectedTask) {
      onSubtaskOpen?.(selectedTask, subtask);
    }
    baseHandleSubtaskClick(subtask);
  };

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
    setIsAIMode(false);
    // If we're in Today/Tomorrow section, show board selection modal
    if (scheduleDate) {
      setShowSelectBoardModal(true);
      return;
    }

    // Use the first task board from groups, or if no groups, we can't create
    if (taskGroups.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    const firstTaskBoardId = taskGroups[0].taskBoardId;
    const newTask: Task = {
      id: "", // Will be generated by API
      taskBoardId: firstTaskBoardId,
      summary: "",
      description: "",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };
    setSelectedTask(newTask);
  }, [taskGroups, setSelectedTask, scheduleDate]);

  const handleCreateTaskWithAI = useCallback(() => {
    setIsAIMode(true);
    // If we're in Today/Tomorrow section, show board selection modal first
    if (scheduleDate) {
      setShowSelectBoardModal(true);
      return;
    }

    // Use the first task board from groups
    if (taskGroups.length === 0) {
      console.error("Cannot create task: no task boards available");
      return;
    }
    const firstTaskBoardId = taskGroups[0].taskBoardId;
    setIsAIComposeModalOpen(true);
  }, [taskGroups, scheduleDate]);

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
        // Prepare additional data including scheduleDate if applicable
        const additionalData: Partial<Omit<Task, "id">> = {};
        if (scheduleDate) {
          additionalData.scheduleDate = scheduleDate;
        }

        const composedData = await tasksService.composeWithAI(
          text,
          taskBoardId,
          additionalData,
        );

        // Convert to Task format (without id, ready for editing)
        const composedTask: Task = {
          id: "", // Will be generated when saved
          taskBoardId: composedData.taskBoardId,
          taskKey: composedData.taskKey,
          summary: composedData.summary,
          description: composedData.description,
          status: (composedData.status as TaskStatus) || TaskStatus.TODO,
          priority:
            (composedData.priority as TaskPriority) || TaskPriority.MEDIUM,
          labels: composedData.labels,
          dueDate: composedData.dueDate,
          estimation: composedData.estimation,
          scheduleDate: (() => {
            // Prefer scheduleDate from AI or additionalData
            if (composedData.scheduleDate) {
              return new Date(composedData.scheduleDate);
            }
            if (additionalData?.scheduleDate) {
              return additionalData.scheduleDate instanceof Date
                ? additionalData.scheduleDate
                : new Date(additionalData.scheduleDate);
            }
            // Use scheduleDate if provided
            if (scheduleDate) {
              return scheduleDate;
            }
            return undefined;
          })(),
          subtasks: composedData.subtasks,
        };

        setSelectedTask(composedTask);
        setSelectedBoardIdForAI(null);
        setIsAIMode(false);
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

  const handleBoardSelect = useCallback(
    (boardId: string) => {
      setShowSelectBoardModal(false);
      if (isAIMode) {
        setSelectedBoardIdForAI(boardId);
        setIsAIComposeModalOpen(true);
      } else {
        const newTask: Task = {
          id: "",
          taskBoardId: boardId,
          summary: "",
          description: "",
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          scheduleDate,
        };
        setSelectedTask(newTask);
      }
    },
    [setSelectedTask, scheduleDate, isAIMode],
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

        <Board>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : taskGroups.length > 0 ? (
            <>
              {/* Workspace rows with tasks */}
              {taskGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.taskBoardId);
                return (
                  <TaskGroupWrapper key={group.taskBoardId}>
                    {/* Separator above each task board row */}
                    <WorkspaceSeparator
                      onClick={() => toggleGroup(group.taskBoardId)}
                    >
                      <GroupChevron
                        viewBox="0 0 16 16"
                        fill="none"
                        $expanded={isExpanded}
                      >
                        <path
                          d="M6 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </GroupChevron>
                      {group.taskBoardName}
                    </WorkspaceSeparator>

                    {/* Tasks for this workspace in each column - only show if expanded */}
                    {isExpanded && (
                      <>
                        <Column
                          tasks={group.tasks[TaskStatus.TODO]}
                          status={TaskStatus.TODO}
                          onTaskDrop={(taskId, newStatus, targetIndex) =>
                            handleTaskStatusChange(
                              taskId,
                              newStatus,
                              targetIndex,
                            )
                          }
                          onTaskClick={handleTaskClick}
                        />
                        <Column
                          tasks={group.tasks[TaskStatus.IN_PROGRESS]}
                          status={TaskStatus.IN_PROGRESS}
                          onTaskDrop={(taskId, newStatus, targetIndex) =>
                            handleTaskStatusChange(
                              taskId,
                              newStatus,
                              targetIndex,
                            )
                          }
                          onTaskClick={handleTaskClick}
                        />
                        <Column
                          tasks={group.tasks[TaskStatus.DONE]}
                          status={TaskStatus.DONE}
                          onTaskDrop={(taskId, newStatus, targetIndex) =>
                            handleTaskStatusChange(
                              taskId,
                              newStatus,
                              targetIndex,
                            )
                          }
                          onTaskClick={handleTaskClick}
                        />
                      </>
                    )}
                  </TaskGroupWrapper>
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
        </Board>
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
      {showSelectBoardModal && (
        <SelectBoardModal
          onClose={() => {
            setShowSelectBoardModal(false);
            setIsAIMode(false);
          }}
          onSelect={handleBoardSelect}
        />
      )}
      <AIComposeModal
        isOpen={isAIComposeModalOpen}
        onClose={() => {
          setIsAIComposeModalOpen(false);
          setSelectedBoardIdForAI(null);
          setIsAIMode(false);
        }}
        onCompose={handleAICompose}
      />
    </>
  );
}
