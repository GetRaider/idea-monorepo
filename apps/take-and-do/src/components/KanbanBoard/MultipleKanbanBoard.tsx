"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BoardContainer,
  Board,
  WorkspaceSeparator,
  LoadingContainer,
  Spinner,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Chevron } from "../NavigationSidebar/NavigationSidebar.styles";
import { Toolbar } from "./shared/Toolbar";
import { TaskStatus, TaskSchedule, TaskGroup, Task } from "./types";
import {
  fetchTaskBoardNameMap,
  loadScheduledContent,
  loadFolderContent,
} from "./shared/dataLoaders";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";
import TaskView from "../TaskView/TaskView";

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
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);

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

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setParentTask(null); // Clear parent when clicking a top-level task
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
    setParentTask(null);
  }, []);

  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      // Update the task in the local state
      setTaskGroups((prevGroups) => {
        return prevGroups.map((group) => {
          if (group.taskBoardId !== updatedTask.taskBoardId) {
            return group;
          }
          const newTasks = { ...group.tasks };

          // Check if this is a top-level task (exists in the board)
          let isTopLevelTask = false;
          Object.keys(newTasks).forEach((status) => {
            if (
              newTasks[status as TaskStatus].some(
                (t) => t.id === updatedTask.id,
              )
            ) {
              isTopLevelTask = true;
            }
          });

          if (isTopLevelTask) {
            // Remove task from old status
            Object.keys(newTasks).forEach((status) => {
              newTasks[status as TaskStatus] = newTasks[
                status as TaskStatus
              ].filter((t) => t.id !== updatedTask.id);
            });
            // Add task to new status
            newTasks[updatedTask.status].push(updatedTask);
          } else {
            // This is a subtask - update it within its parent task
            Object.keys(newTasks).forEach((status) => {
              newTasks[status as TaskStatus] = newTasks[
                status as TaskStatus
              ].map((task) => {
                if (task.subtasks?.some((st) => st.id === updatedTask.id)) {
                  return {
                    ...task,
                    subtasks: task.subtasks.map((st) =>
                      st.id === updatedTask.id ? updatedTask : st,
                    ),
                  };
                }
                return task;
              });
            });
          }

          return { ...group, tasks: newTasks };
        });
      });
      // Update selected task if it's the same one
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask],
  );

  const handleSubtaskClick = useCallback(
    (subtask: Task) => {
      // When clicking a subtask, the current selectedTask becomes the parent
      setParentTask(selectedTask);
      setSelectedTask(subtask);
    },
    [selectedTask],
  );

  // Get the workspace title for the selected task
  const getTaskWorkspaceTitle = (task: Task | null): string => {
    if (!task) return workspaceTitle;
    const group = taskGroups.find((g) => g.taskBoardId === task.taskBoardId);
    return group?.taskBoardName || workspaceTitle;
  };

  return (
    <>
      <BoardContainer>
        <Toolbar workspaceTitle={workspaceTitle} />

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
                  <div key={group.taskBoardId} style={{ display: "contents" }}>
                    {/* Separator above each task board row */}
                    <WorkspaceSeparator
                      onClick={() => toggleGroup(group.taskBoardId)}
                      style={{ cursor: "pointer" }}
                    >
                      <Chevron
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        $expanded={isExpanded}
                        style={{ marginLeft: 0 }}
                      >
                        <path
                          d="M6 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Chevron>
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
                  </div>
                );
              })}
            </>
          ) : (
            <div
              style={{ color: "#fff", padding: "24px", gridColumn: "1 / -1" }}
            >
              No tasks available for {workspaceTitle}
            </div>
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
      />
    </>
  );
}
