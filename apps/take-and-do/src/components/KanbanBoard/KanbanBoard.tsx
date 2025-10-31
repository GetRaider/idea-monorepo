"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
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
          <div style={{ color: "#fff", padding: "24px", gridColumn: "1 / -1" }}>
            Loading...
          </div>
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
                  />
                  <Column
                    tasks={group.tasks[TaskStatus.IN_PROGRESS]}
                    status={TaskStatus.IN_PROGRESS}
                  />
                  <Column
                    tasks={group.tasks[TaskStatus.DONE]}
                    status={TaskStatus.DONE}
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
            <Column tasks={tasks[TaskStatus.TODO]} status={TaskStatus.TODO} />
            <Column
              tasks={tasks[TaskStatus.IN_PROGRESS]}
              status={TaskStatus.IN_PROGRESS}
            />
            <Column tasks={tasks[TaskStatus.DONE]} status={TaskStatus.DONE} />
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
