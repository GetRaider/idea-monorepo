"use client";

import Image from "next/image";
import TaskCard from "./TaskCard/TaskCard";
import {
  BoardContainer,
  Toolbar,
  WorkspacePath,
  Actions,
  CreateButton,
  SettingsButton,
  Board,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";

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
  summary: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels?: string[];
  dueDate?: Date;
  estimation?: number;
  subtasks?: Task[];
}

const mockTasks: Record<TaskStatus, Task[]> = {
  [TaskStatus.TODO]: [
    {
      id: "PS-002",
      summary: "Sketch a wireframe for website and outline the design system.",
      description:
        "Sketch a wireframe for website and outline the design system.",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.MEDIUM,
      labels: ["Work", "Food"],
      status: TaskStatus.TODO,
      subtasks: [
        {
          id: "PS-007",
          summary:
            "Create a wireframe for website along with a comprehensive design system.",
          description:
            "Create a wireframe for website along with a comprehensive design system.",
          dueDate: new Date("2025-10-21"),
          estimation: 3.5,
          priority: TaskPriority.CRITICAL,
          labels: ["Work", "Food"],
          status: TaskStatus.IN_PROGRESS,
        },
      ],
    },
  ],
  [TaskStatus.IN_PROGRESS]: [
    {
      id: "PS-003",
      summary:
        "Create a wireframe for website along with a comprehensive design system.",
      description:
        "Create a wireframe for website along with a comprehensive design system.",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.CRITICAL,
      labels: ["Work", "Food"],
      status: TaskStatus.IN_PROGRESS,
    },
  ],
  [TaskStatus.DONE]: [
    {
      id: "GH-378",
      summary: "Draft a wireframe for website, including a design system.",
      description: "Draft a wireframe for website, including a design system.",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.LOW,
      labels: ["Design"],
      status: TaskStatus.IN_PROGRESS,
    },
  ],
};

export default function KanbanBoard() {
  return (
    <BoardContainer>
      <Toolbar>
        <WorkspacePath>Personal Tasks</WorkspacePath>
        <Actions>
          <CreateButton>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 5v14M5 12h14"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Create Task
          </CreateButton>
          <SettingsButton title="Board settings">
            <Image
              src="/board-preference.svg"
              alt="Settings"
              width={20}
              height={20}
            />
          </SettingsButton>
        </Actions>
      </Toolbar>

      <Board>
        <Column tasks={mockTasks[TaskStatus.TODO]} status={TaskStatus.TODO} />
        <Column
          tasks={mockTasks[TaskStatus.IN_PROGRESS]}
          status={TaskStatus.IN_PROGRESS}
        />
        <Column tasks={mockTasks[TaskStatus.DONE]} status={TaskStatus.DONE} />
      </Board>
    </BoardContainer>
  );
}
