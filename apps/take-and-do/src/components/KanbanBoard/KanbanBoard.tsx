"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { taskBoardsService } from "@/services/api/taskBoards.service";
import { tasksService } from "@/services/api/tasks.service";
import {
  BoardContainer,
  Toolbar,
  WorkspacePath,
  Actions,
  CreateButton,
  SettingsButton,
  PopoverContainer,
  Popover,
  Row,
  Segmented,
  SegmentBtn,
  Divider,
  Footer,
  Board,
  WorkspaceSeparator,
  WorkspaceIcon,
  LoadingContainer,
  Spinner,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";

export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

const emptyTaskColumns: Record<TaskStatus, Task[]> = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

export default function KanbanBoard({
  currentView = TaskSchedule.TODAY,
  workspaceTitle = "Tasks",
}: KanbanBoardProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [tasks, setTasks] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setTaskBoardNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Fetch task board names
        const taskBoards = await taskBoardsService.getAll();
        const taskBoardNamesMap: Record<string, string> = {};
        taskBoards.forEach((taskBoard) => {
          taskBoardNamesMap[taskBoard.id] = taskBoard.name;
        });

        setTaskBoardNameMap(taskBoardNamesMap);

        const isScheduleWorkspace =
          currentView === TaskSchedule.TODAY ||
          currentView === TaskSchedule.TOMORROW;
        const loadParams = {
          schedule: currentView as TaskSchedule,
          taskBoardNamesMap,
        };

        isScheduleWorkspace
          ? await loadScheduledContent({ ...loadParams, setTaskGroups })
          : await loadTaskBoardContent({
              boardName: String(currentView),
              taskBoardNamesMap,
              setTasks,
            });
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTasks(emptyTaskColumns);
        setTaskGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [currentView]);

  console.log({ boardView: currentView });

  const title = getWorkspaceTitle(currentView, workspaceTitle);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      try {
        // Find the current task to check its status
        const isScheduleWorkspace =
          currentView === TaskSchedule.TODAY ||
          currentView === TaskSchedule.TOMORROW;

        let currentTask: Task | undefined;
        let currentGroupIndex: number | undefined;
        if (isScheduleWorkspace) {
          for (
            let groupIndex = 0;
            groupIndex < taskGroups.length;
            groupIndex++
          ) {
            const group = taskGroups[groupIndex];
            for (const statusKey of [
              TaskStatus.TODO,
              TaskStatus.IN_PROGRESS,
              TaskStatus.DONE,
            ]) {
              const task = group.tasks[statusKey].find((t) => t.id === taskId);
              if (task) {
                currentTask = task;
                currentGroupIndex = groupIndex;
                break;
              }
            }
            if (currentTask) break;
          }
        } else {
          for (const statusKey of [
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
            TaskStatus.DONE,
          ]) {
            const task = tasks[statusKey].find((t) => t.id === taskId);
            if (task) {
              currentTask = task;
              break;
            }
          }
        }

        // If task not found, log error but still proceed (might be a new task)
        if (!currentTask) {
          console.warn(`Task ${taskId} not found in current view`);
        }

        // If status hasn't changed, handle reordering within the same column
        if (currentTask && currentTask.status === newStatus) {
          // Reorder within same column
          if (isScheduleWorkspace && typeof currentGroupIndex === "number") {
            setTaskGroups((prevGroups) =>
              prevGroups.map((group, groupIndex) => {
                // Only process the group that contains the task
                if (groupIndex !== currentGroupIndex) return group;

                const updatedTasks: Record<TaskStatus, Task[]> = {
                  [TaskStatus.TODO]: [...group.tasks[TaskStatus.TODO]],
                  [TaskStatus.IN_PROGRESS]: [
                    ...group.tasks[TaskStatus.IN_PROGRESS],
                  ],
                  [TaskStatus.DONE]: [...group.tasks[TaskStatus.DONE]],
                };

                const currentArray = updatedTasks[newStatus];
                const currentIndex = currentArray.findIndex(
                  (t) => t.id === taskId,
                );

                if (currentIndex === -1) return group;

                // Calculate insert index (adjust if target is after current position)
                let insertIndex =
                  typeof targetIndex === "number" &&
                  targetIndex >= 0 &&
                  targetIndex <= currentArray.length
                    ? targetIndex
                    : currentArray.length;

                // If inserting after the current position, adjust for removal
                if (insertIndex > currentIndex) {
                  insertIndex -= 1;
                }

                // Remove from current position
                const [movedTask] = currentArray.splice(currentIndex, 1);

                // Insert at target position
                currentArray.splice(insertIndex, 0, movedTask);

                return {
                  ...group,
                  tasks: updatedTasks,
                };
              }),
            );
          } else {
            setTasks((prevTasks) => {
              const updatedTasks: Record<TaskStatus, Task[]> = {
                [TaskStatus.TODO]: [...prevTasks[TaskStatus.TODO]],
                [TaskStatus.IN_PROGRESS]: [
                  ...prevTasks[TaskStatus.IN_PROGRESS],
                ],
                [TaskStatus.DONE]: [...prevTasks[TaskStatus.DONE]],
              };

              const currentArray = updatedTasks[newStatus];
              const currentIndex = currentArray.findIndex(
                (t) => t.id === taskId,
              );

              if (currentIndex === -1) return prevTasks;

              // Calculate insert index (adjust if target is after current position)
              let insertIndex =
                typeof targetIndex === "number" &&
                targetIndex >= 0 &&
                targetIndex <= currentArray.length
                  ? targetIndex
                  : currentArray.length;

              // If inserting after the current position, adjust for removal
              if (insertIndex > currentIndex) {
                insertIndex -= 1;
              }

              // Remove from current position
              const [movedTask] = currentArray.splice(currentIndex, 1);

              // Insert at target position
              currentArray.splice(insertIndex, 0, movedTask);

              return updatedTasks;
            });
          }
          return;
        }

        // OPTIMISTIC UPDATE: Update local state immediately for smooth animation
        // This happens BEFORE the API call so the UI updates instantly
        if (isScheduleWorkspace) {
          // Update task groups optimistically
          setTaskGroups((prevGroups) =>
            prevGroups.map((group, groupIndex) => {
              const updatedTasks: Record<TaskStatus, Task[]> = {
                [TaskStatus.TODO]: [...(group.tasks[TaskStatus.TODO] || [])],
                [TaskStatus.IN_PROGRESS]: [
                  ...(group.tasks[TaskStatus.IN_PROGRESS] || []),
                ],
                [TaskStatus.DONE]: [...(group.tasks[TaskStatus.DONE] || [])],
              };

              let foundTask: Task | undefined;
              let taskFoundInGroup = false;

              // Find and remove task from old status (in this group)
              (Object.keys(updatedTasks) as TaskStatus[]).forEach(
                (statusKey) => {
                  const index = updatedTasks[statusKey].findIndex(
                    (t) => t.id === taskId,
                  );
                  if (index !== -1) {
                    foundTask = updatedTasks[statusKey][index];
                    updatedTasks[statusKey] = updatedTasks[statusKey].filter(
                      (t) => t.id !== taskId,
                    );
                    taskFoundInGroup = true;
                  }
                },
              );

              // Only update if task was found in this group, or if we have currentTask and this is the right group
              if (taskFoundInGroup && foundTask) {
                // Task was found in this group, add it to new status
                const updatedTask: Task = {
                  ...foundTask,
                  status: newStatus,
                };
                const insertIndex =
                  typeof targetIndex === "number" &&
                  targetIndex >= 0 &&
                  targetIndex <= updatedTasks[newStatus].length
                    ? targetIndex
                    : updatedTasks[newStatus].length;
                updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

                return {
                  ...group,
                  tasks: updatedTasks,
                };
              } else if (
                currentTask &&
                typeof currentGroupIndex === "number" &&
                currentGroupIndex === groupIndex
              ) {
                // Task wasn't in this group's arrays yet, but currentTask exists and this is the correct group
                const updatedTask: Task = {
                  ...currentTask,
                  status: newStatus,
                };
                const insertIndex =
                  typeof targetIndex === "number" &&
                  targetIndex >= 0 &&
                  targetIndex <= updatedTasks[newStatus].length
                    ? targetIndex
                    : updatedTasks[newStatus].length;
                updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

                return {
                  ...group,
                  tasks: updatedTasks,
                };
              }

              // Task not in this group, return unchanged
              return group;
            }),
          );
        } else {
          // Update regular tasks optimistically
          setTasks((prevTasks) => {
            const updatedTasks: Record<TaskStatus, Task[]> = {
              [TaskStatus.TODO]: [...prevTasks[TaskStatus.TODO]],
              [TaskStatus.IN_PROGRESS]: [...prevTasks[TaskStatus.IN_PROGRESS]],
              [TaskStatus.DONE]: [...prevTasks[TaskStatus.DONE]],
            };

            let foundTask: Task | undefined;

            // Find and remove task from old status
            (Object.keys(updatedTasks) as TaskStatus[]).forEach((statusKey) => {
              const index = updatedTasks[statusKey].findIndex(
                (t) => t.id === taskId,
              );
              if (index !== -1) {
                foundTask = updatedTasks[statusKey][index];
                updatedTasks[statusKey] = updatedTasks[statusKey].filter(
                  (t) => t.id !== taskId,
                );
              }
            });

            // Add task to new status
            if (foundTask) {
              const updatedTask: Task = {
                ...foundTask,
                status: newStatus,
              };
              const insertIndex =
                typeof targetIndex === "number" &&
                targetIndex >= 0 &&
                targetIndex <= updatedTasks[newStatus].length
                  ? targetIndex
                  : updatedTasks[newStatus].length;
              updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);
            } else if (currentTask) {
              // Task might be moving from another view
              const updatedTask: Task = {
                ...currentTask,
                status: newStatus,
              };
              const insertIndex =
                typeof targetIndex === "number" &&
                targetIndex >= 0 &&
                targetIndex <= updatedTasks[newStatus].length
                  ? targetIndex
                  : updatedTasks[newStatus].length;
              updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);
            }

            return updatedTasks;
          });
        }

        // Update task status via API (after optimistic update for smooth UX)
        await tasksService.update(taskId, { status: newStatus });

        // Note: We don't need to update state again here since we did it optimistically
        // If the API call fails, we could revert the optimistic update, but for now
        // we'll assume it succeeds

        if (isScheduleWorkspace) {
          // Update task groups - find the group containing the task
          setTaskGroups((prevGroups) =>
            prevGroups.map((group, groupIndex) => {
              const updatedTasks: Record<TaskStatus, Task[]> = {
                [TaskStatus.TODO]: [...(group.tasks[TaskStatus.TODO] || [])],
                [TaskStatus.IN_PROGRESS]: [
                  ...(group.tasks[TaskStatus.IN_PROGRESS] || []),
                ],
                [TaskStatus.DONE]: [...(group.tasks[TaskStatus.DONE] || [])],
              };

              let foundTask: Task | undefined;
              let taskFoundInGroup = false;

              // Find and remove task from old status (in this group)
              (Object.keys(updatedTasks) as TaskStatus[]).forEach(
                (statusKey) => {
                  const index = updatedTasks[statusKey].findIndex(
                    (t) => t.id === taskId,
                  );
                  if (index !== -1) {
                    foundTask = updatedTasks[statusKey][index];
                    updatedTasks[statusKey] = updatedTasks[statusKey].filter(
                      (t) => t.id !== taskId,
                    );
                    taskFoundInGroup = true;
                  }
                },
              );

              // Only update if task was found in this group, or if we have currentTask and this is the right group
              if (taskFoundInGroup && foundTask) {
                // Task was found in this group, add it to new status
                const updatedTask: Task = {
                  ...foundTask,
                  status: newStatus,
                };
                const insertIndex =
                  typeof targetIndex === "number" &&
                  targetIndex >= 0 &&
                  targetIndex <= updatedTasks[newStatus].length
                    ? targetIndex
                    : updatedTasks[newStatus].length;
                updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

                return {
                  ...group,
                  tasks: updatedTasks,
                };
              } else if (
                currentTask &&
                typeof currentGroupIndex === "number" &&
                currentGroupIndex === groupIndex
              ) {
                // Task wasn't in this group's arrays yet, but currentTask exists and this is the correct group
                // This can happen when moving to an empty status or when task lookup failed initially
                const updatedTask: Task = {
                  ...currentTask,
                  status: newStatus,
                };
                const insertIndex =
                  typeof targetIndex === "number" &&
                  targetIndex >= 0 &&
                  targetIndex <= updatedTasks[newStatus].length
                    ? targetIndex
                    : updatedTasks[newStatus].length;
                updatedTasks[newStatus].splice(insertIndex, 0, updatedTask);

                return {
                  ...group,
                  tasks: updatedTasks,
                };
              }

              // Task not in this group, return unchanged
              return group;
            }),
          );
        } else {
          // Update regular tasks
          setTasks((prevTasks) => {
            const updatedTasks: Record<TaskStatus, Task[]> = {
              [TaskStatus.TODO]: [...prevTasks[TaskStatus.TODO]],
              [TaskStatus.IN_PROGRESS]: [...prevTasks[TaskStatus.IN_PROGRESS]],
              [TaskStatus.DONE]: [...prevTasks[TaskStatus.DONE]],
            };

            let foundTask: Task | undefined;

            // Find and remove task from old status
            (Object.keys(updatedTasks) as TaskStatus[]).forEach((statusKey) => {
              const index = updatedTasks[statusKey].findIndex(
                (t) => t.id === taskId,
              );
              if (index !== -1) {
                foundTask = updatedTasks[statusKey][index];
                updatedTasks[statusKey] = updatedTasks[statusKey].filter(
                  (t) => t.id !== taskId,
                );
              }
            });

            // Add task to new status at the correct position
            if (foundTask) {
              const updatedTask: Task = {
                ...foundTask,
                status: newStatus,
              };
              if (
                typeof targetIndex === "number" &&
                targetIndex >= 0 &&
                targetIndex <= updatedTasks[newStatus].length
              ) {
                updatedTasks[newStatus].splice(targetIndex, 0, updatedTask);
              } else {
                updatedTasks[newStatus].push(updatedTask);
              }
            }

            return updatedTasks;
          });
        }
      } catch (error) {
        console.error("Failed to update task status:", error);
        // Optionally show an error message to the user
      }
    },
    [currentView],
  );

  return (
    <BoardContainer>
      <Toolbar>
        <WorkspacePath>{title}</WorkspacePath>
        <Actions>
          <CreateButton>
            <Image width={20} height={20} src="/plus.svg" alt="Create Task" />
            Create Task
          </CreateButton>
          <PopoverContainer>
            <SettingsButton
              title="Board settings"
              onClick={() => setOpen((s) => !s)}
            >
              <Image
                src="/board-preference.svg"
                alt="Settings"
                width={20}
                height={20}
              />
            </SettingsButton>
            {open && (
              <Popover>
                <Row>
                  <Segmented>
                    <SegmentBtn
                      $active={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                    >
                      <span>≡</span>
                      <span>List</span>
                    </SegmentBtn>
                    <SegmentBtn
                      $active={viewMode === "board"}
                      onClick={() => setViewMode("board")}
                    >
                      <span
                        style={{
                          border: "2px solid currentColor",
                          width: 14,
                          height: 14,
                          display: "inline-block",
                          borderRadius: 3,
                        }}
                      />
                      <span>Board</span>
                    </SegmentBtn>
                  </Segmented>
                </Row>

                <Divider />

                <Footer>
                  <button
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#cbd5e1",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setViewMode("board");
                    }}
                  >
                    Reset
                  </button>
                </Footer>
              </Popover>
            )}
          </PopoverContainer>
        </Actions>
      </Toolbar>

      <Board>
        {isLoading ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : currentView === TaskSchedule.TODAY ||
          currentView === TaskSchedule.TOMORROW ? (
          taskGroups.length > 0 ? (
            <>
              {/* Workspace rows with tasks */}
              {taskGroups.map((group) => (
                <div key={group.taskBoardId} style={{ display: "contents" }}>
                  {/* Separator above each task board row */}
                  <WorkspaceSeparator>
                    <WorkspaceIcon>
                      <Image
                        width={20}
                        height={20}
                        src="/kanban-board.svg"
                        alt="Task Board"
                      />
                    </WorkspaceIcon>
                    {group.taskBoardName}
                  </WorkspaceSeparator>

                  {/* Tasks for this workspace in each column */}
                  <Column
                    tasks={group.tasks[TaskStatus.TODO]}
                    status={TaskStatus.TODO}
                    onTaskDrop={handleTaskStatusChange}
                  />
                  <Column
                    tasks={group.tasks[TaskStatus.IN_PROGRESS]}
                    status={TaskStatus.IN_PROGRESS}
                    onTaskDrop={handleTaskStatusChange}
                  />
                  <Column
                    tasks={group.tasks[TaskStatus.DONE]}
                    status={TaskStatus.DONE}
                    onTaskDrop={handleTaskStatusChange}
                  />
                </div>
              ))}
            </>
          ) : (
            <div
              style={{ color: "#fff", padding: "24px", gridColumn: "1 / -1" }}
            >
              No tasks scheduled for{" "}
              {getWorkspaceTitle(currentView, workspaceTitle)}
            </div>
          )
        ) : (
          <>
            <Column
              tasks={tasks[TaskStatus.TODO]}
              status={TaskStatus.TODO}
              onTaskDrop={handleTaskStatusChange}
            />
            <Column
              tasks={tasks[TaskStatus.IN_PROGRESS]}
              status={TaskStatus.IN_PROGRESS}
              onTaskDrop={handleTaskStatusChange}
            />
            <Column
              tasks={tasks[TaskStatus.DONE]}
              status={TaskStatus.DONE}
              onTaskDrop={handleTaskStatusChange}
            />
          </>
        )}
      </Board>
    </BoardContainer>
  );
}

async function loadScheduledContent({
  schedule,
  taskBoardNamesMap: taskBoardNameMap,
  setTaskGroups,
}: LoadScheduledWorkspaceProps): Promise<void> {
  const data = await tasksService.getBySchedule(schedule);
  const scheduledTasks = data[schedule];
  setTaskGroups(createTaskGroups(scheduledTasks, taskBoardNameMap));
}

async function loadTaskBoardContent({
  boardName,
  taskBoardNamesMap: taskBoardNameMap,
  setTasks,
}: LoadTaskBoardWorkspaceProps): Promise<void> {
  const targetEntry = Object.entries(taskBoardNameMap).find(
    ([, name]) => name === boardName,
  );
  const taskBoardId = targetEntry ? targetEntry[0] : undefined;

  let boardTasks: Task[] = [];
  if (taskBoardId) {
    boardTasks = await taskBoardsService.getTasks(taskBoardId);
  }

  const grouped: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
  (boardTasks || []).forEach((task) => {
    if (task.dueDate) {
      task.dueDate = new Date(task.dueDate);
    }
    task.status = toTaskStatus(task.status);
    task.priority = toTaskPriority(task.priority);
    grouped[task.status].push(task);
  });
  setTasks(grouped);
}

function getWorkspaceTitle(
  boardView: TaskSchedule | string,
  workspaceTitle: string,
): string {
  switch (boardView) {
    case TaskSchedule.TODAY:
      return "Today";
    case TaskSchedule.TOMORROW:
      return "Tomorrow";
    default:
      return workspaceTitle;
  }
}

function toTaskStatus(status: any): TaskStatus {
  return Object.values(TaskStatus).includes(status as TaskStatus)
    ? (status as TaskStatus)
    : TaskStatus.TODO;
}

function toTaskPriority(priority: any): TaskPriority {
  if (!priority) return TaskPriority.MEDIUM;

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];

  if (validPriorities.includes(priorityString)) {
    return priorityString as TaskPriority;
  }

  return TaskPriority.MEDIUM;
}

function createEmptyStatusBuckets(): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
}

function createTaskGroups(
  tasks: Task[],
  taskBoardNameMap: Record<string, string>,
): TaskGroup[] {
  const groupsMap: Record<string, Record<TaskStatus, Task[]>> = {};

  (tasks || []).forEach((task) => {
    if (!task.taskBoardId) return;

    const groupKey = task.taskBoardId;

    if (!groupsMap[groupKey]) {
      groupsMap[groupKey] = createEmptyStatusBuckets();
    }
    if (task.dueDate) {
      task.dueDate = new Date(task.dueDate);
    }
    task.status = toTaskStatus(task.status);
    task.priority = toTaskPriority(task.priority);
    groupsMap[groupKey][task.status].push(task);
  });

  return Object.entries(groupsMap).map(([groupKey, tasksByStatus]) => ({
    taskBoardId: groupKey,
    taskBoardName: taskBoardNameMap[groupKey] ?? groupKey,
    tasks: tasksByStatus,
  }));
}

export interface Task {
  id: string;
  taskBoardId: string;
  taskKey?: string;
  summary: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels?: string[];
  dueDate?: Date;
  estimation?: number;
  subtasks?: Task[];
  schedule?: "today" | "tomorrow";
}

interface KanbanBoardProps {
  currentView?: TaskSchedule | string;
  workspaceTitle?: string;
  taskBoardId?: string;
}

interface TaskGroup {
  taskBoardId: string;
  taskBoardName: string;
  tasks: Record<TaskStatus, Task[]>;
}

interface LoadScheduledWorkspaceProps {
  schedule: TaskSchedule;
  taskBoardNamesMap: Record<string, string>;
  setTaskGroups: (groups: TaskGroup[]) => void;
}

interface LoadTaskBoardWorkspaceProps {
  boardName: string;
  taskBoardNamesMap: Record<string, string>;
  setTasks: (tasks: Record<TaskStatus, Task[]>) => void;
}

export enum TaskSchedule {
  TODAY = "today",
  TOMORROW = "tomorrow",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
