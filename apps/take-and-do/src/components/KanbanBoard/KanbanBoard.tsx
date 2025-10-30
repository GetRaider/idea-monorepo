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
  Label,
  Select,
  IconBtn,
  Footer,
  Board,
  WorkspaceSeparator,
  WorkspaceIcon,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";

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

export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
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
  boardView?: string;
  workspaceTitle?: string;
  taskBoardId?: string;
}

interface TaskGroup {
  taskBoardId: string;
  taskBoardName: string;
  tasks: Record<TaskStatus, Task[]>;
}

export default function KanbanBoard({
  boardView = "today",
  workspaceTitle = "Tasks",
}: KanbanBoardProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [sorting, setSorting] = useState("default");
  const [tasks, setTasks] = useState<Record<TaskStatus, Task[]>>({
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  });
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Fetch task board names
        const taskBoards = await taskBoardsService.getAll();
        const nameMap: Record<string, string> = {};
        taskBoards.forEach((tb) => {
          nameMap[tb.id] = tb.name;
        });
        setTaskBoardNameMap(nameMap);

        let fetchedTasks: Task[] = [];

        console.log("Current tasksView:", boardView);
        console.log("TaskSchedule.TODAY:", TaskSchedule.TODAY);
        console.log("Are they equal?", boardView === TaskSchedule.TODAY);

        if (
          boardView === TaskSchedule.TODAY ||
          boardView === TaskSchedule.TOMORROW
        ) {
          console.log("Fetching tasks for view:", boardView);
          const data = await tasksService.getBySchedule(boardView);
          console.log("Response data:", data);
          fetchedTasks = data[boardView] || [];
          console.log("Fetched tasks:", fetchedTasks);

          // Group tasks by taskBoardId
          const groupsMap: Record<string, Record<TaskStatus, Task[]>> = {};
          (fetchedTasks || []).forEach((task: any) => {
            if (!task.taskBoardId) return;

            // Use taskBoardId as the key
            const groupKey = task.taskBoardId;

            if (!groupsMap[groupKey]) {
              groupsMap[groupKey] = {
                [TaskStatus.TODO]: [],
                [TaskStatus.IN_PROGRESS]: [],
                [TaskStatus.DONE]: [],
              };
            }
            if (task.dueDate) {
              task.dueDate = new Date(task.dueDate);
            }
            const status = Object.values(TaskStatus).includes(
              task.status as TaskStatus,
            )
              ? (task.status as TaskStatus)
              : TaskStatus.TODO;
            groupsMap[groupKey][status].push(task);
          });

          const groups: TaskGroup[] = Object.entries(groupsMap).map(
            ([groupKey, tasks]) => ({
              taskBoardId: groupKey,
              taskBoardName: taskBoardNameMap[groupKey] || groupKey,
              tasks,
            }),
          );

          setTaskGroups(groups);
        } else {
          // Resolve task board ID by its name and fetch tasks for that board
          const targetEntry = Object.entries(taskBoardNameMap).find(
            ([, name]) => name === boardView,
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
            const status = Object.values(TaskStatus).includes(
              task.status as TaskStatus,
            )
              ? (task.status as TaskStatus)
              : TaskStatus.TODO;
            grouped[status].push(task);
          });

          setTasks(grouped);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTasks({
          [TaskStatus.TODO]: [],
          [TaskStatus.IN_PROGRESS]: [],
          [TaskStatus.DONE]: [],
        });
        setTaskGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [boardView]);

  console.log({ boardView });

  const title =
    boardView === TaskSchedule.TODAY
      ? "Today"
      : boardView === TaskSchedule.TOMORROW
        ? "Tomorrow"
        : workspaceTitle;

  console.log(taskGroups);

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

                <Row style={{ gap: 16 }}>
                  <Label>
                    <span style={{ transform: "rotate(90deg)" }}>⇅</span>
                    Sorting
                  </Label>
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <Select
                      value={sorting}
                      onChange={(e) => setSorting(e.target.value)}
                    >
                      <option value="default">Default</option>
                      <option value="priority">Priority</option>
                      <option value="date">Due date</option>
                    </Select>
                    <IconBtn title="Direction">↑</IconBtn>
                  </div>
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
                      setSorting("default");
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
        ) : boardView === "today" || boardView === "tomorrow" ? (
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
              {boardView === TaskSchedule.TODAY ? "today" : "tomorrow"}
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
