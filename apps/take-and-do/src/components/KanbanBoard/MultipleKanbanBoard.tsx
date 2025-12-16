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
  EmptyStateMessage,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Toolbar } from "./shared/Toolbar";
import {
  TaskStatus,
  TaskSchedule,
  TaskPriority,
  TaskGroup,
  Task,
} from "./types";
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

interface MultipleKanbanBoardProps {
  schedule?: TaskSchedule;
  workspaceTitle: string;
  folderId?: string;
}

export function MultipleKanbanBoard({
  schedule,
  workspaceTitle,
  folderId,
}: MultipleKanbanBoardProps) {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showSelectBoardModal, setShowSelectBoardModal] = useState(false);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  } = useTaskBoardState();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const taskBoardNamesMap = await fetchTaskBoardNameMap();

        let loadedGroups: TaskGroup[] = [];
        if (schedule) {
          await loadScheduledContent({
            schedule,
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
  }, [schedule, folderId]);

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
      // If we're in a scheduled view, check if the task still belongs to this schedule
      if (schedule) {
        // If scheduleDate was removed, task should be removed from scheduled view
        if (!updatedTask.scheduleDate) {
          try {
            const taskBoardNamesMap = await fetchTaskBoardNameMap();
            await loadScheduledContent({
              schedule,
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

        // Check if scheduleDate matches the current schedule
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const taskDate = new Date(updatedTask.scheduleDate);
        taskDate.setHours(0, 0, 0, 0);

        const isToday = taskDate.getTime() === today.getTime();
        const isTomorrow = taskDate.getTime() === tomorrow.getTime();

        const shouldBeInToday = schedule === TaskSchedule.TODAY && isToday;
        const shouldBeInTomorrow =
          schedule === TaskSchedule.TOMORROW && isTomorrow;

        // If task no longer belongs to this schedule, refresh the entire list
        if (!shouldBeInToday && !shouldBeInTomorrow) {
          try {
            const taskBoardNamesMap = await fetchTaskBoardNameMap();
            await loadScheduledContent({
              schedule,
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
    [selectedTask, setSelectedTask, schedule],
  );

  const handleCreateTask = useCallback(() => {
    // If we're in Today/Tomorrow section, show board selection modal
    if (schedule) {
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
  }, [taskGroups, setSelectedTask, schedule]);

  const handleTaskCreated = useCallback(
    async (createdTask: Task) => {
      try {
        const taskBoardNamesMap = await fetchTaskBoardNameMap();
        let loadedGroups: TaskGroup[] = [];
        if (schedule) {
          await loadScheduledContent({
            schedule,
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
    [schedule, folderId, setSelectedTask],
  );

  const handleBoardSelect = useCallback(
    (boardId: string) => {
      setShowSelectBoardModal(false);
      const newTask: Task = {
        id: "",
        taskBoardId: boardId,
        summary: "",
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        schedule,
      };
      setSelectedTask(newTask);
    },
    [setSelectedTask, schedule],
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
            <EmptyStateMessage>
              No tasks available for {workspaceTitle}
            </EmptyStateMessage>
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
      />
      {showSelectBoardModal && (
        <SelectBoardModal
          onClose={() => setShowSelectBoardModal(false)}
          onSelect={handleBoardSelect}
        />
      )}
    </>
  );
}
