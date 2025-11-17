import { Task } from "@/components/KanbanBoard/types";
import { Folder, TaskBoard } from "@/types/workspace";

// Mock folders
const FOLDER_PERSONAL_ID = "550e8400-e29b-41d4-a716-446655440001";
const TASKBOARD_PERSONAL_ID = "550e8400-e29b-41d4-a716-446655440002";
const TASKBOARD_WORK_ID = "550e8400-e29b-41d4-a716-446655440003";
const TASKBOARD_SPORT_ID = "550e8400-e29b-41d4-a716-446655440004";

// Mock Enums for this file to have all statuses and priorities
enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

export const mockFolders: Folder[] = [
  {
    id: FOLDER_PERSONAL_ID,
    name: "Personal",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// Mock task boards
export const mockTaskBoards: TaskBoard[] = [
  {
    id: TASKBOARD_PERSONAL_ID,
    name: "Personal",
    folderId: FOLDER_PERSONAL_ID,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: TASKBOARD_WORK_ID,
    name: "Work",
    folderId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: TASKBOARD_SPORT_ID,
    name: "Sport",
    folderId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// Mock tasks - organized by task board ID
export const mockTasks: Record<string, Task[]> = {
  [TASKBOARD_PERSONAL_ID]: [
    {
      id: "550e8400-e29b-41d4-a716-446655441001",
      taskBoardId: TASKBOARD_PERSONAL_ID,
      taskKey: "PS-001",
      summary: "Sketch a wireframe for website and outline the design system.",
      description:
        "Sketch a wireframe for website and outline the design system.",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.MEDIUM,
      labels: ["Work", "Food"],
      status: TaskStatus.TODO,
      schedule: "today",
    },
  ],
  [TASKBOARD_WORK_ID]: [
    {
      id: "550e8400-e29b-41d4-a716-446655441002",
      taskBoardId: TASKBOARD_WORK_ID,
      taskKey: "PS-001",
      summary: "5K Race Day Extravaganza",
      description: "Complete 5K race preparation",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.HIGH,
      labels: ["Work", "Food", "Creative"],
      status: TaskStatus.TODO,
      schedule: "today",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441003",
      taskBoardId: TASKBOARD_WORK_ID,
      taskKey: "PS-011",
      summary:
        "Join a group HIIT workout for an intense full-body exercise, followed by a protein shake.",
      description: "Attend HIIT workout session",
      dueDate: new Date("2025-10-22"),
      estimation: 2,
      priority: TaskPriority.MEDIUM,
      labels: ["Work", "Health"],
      status: TaskStatus.TODO,
    },
    {
      id: "550e8400-e29b-41d4-a716-44665542313003",
      taskBoardId: TASKBOARD_WORK_ID,
      taskKey: "PS-015",
      summary: "Complete the report for the project",
      description: "Attend HIIT workout session",
      dueDate: new Date("2025-10-22"),
      estimation: 2,
      priority: TaskPriority.MEDIUM,
      labels: ["Work", "Health"],
      status: TaskStatus.TODO,
    },
  ],
  [TASKBOARD_SPORT_ID]: [
    {
      id: "550e8400-e29b-41d4-a716-446655441004",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "RUN-001",
      summary: "5K Race Day Extravaganza",
      description: "Complete 5K race training",
      dueDate: new Date("2025-10-21"),
      estimation: 3.5,
      priority: TaskPriority.HIGH,
      labels: ["Work", "Food", "Creative"],
      status: TaskStatus.IN_PROGRESS,
      schedule: "today",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441005",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "RUN-003",
      summary: "Trailblazer 5K Challenge",
      description: "Trail running challenge",
      dueDate: new Date("2025-10-21"),
      estimation: 4,
      priority: TaskPriority.CRITICAL,
      labels: ["Work", "Food"],
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441006",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "GH-378-RUN",
      summary: "Speedster 5K Sprint",
      description: "Speed training",
      dueDate: new Date("2025-10-20"),
      estimation: 2.5,
      priority: TaskPriority.LOW,
      labels: ["Design"],
      status: TaskStatus.DONE,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441007",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "GYM-011",
      summary:
        "Join a group HIIT workout for an intense full-body exercise, followed by a protein shake.",
      description: "HIIT workout session",
      dueDate: new Date("2025-10-22"),
      estimation: 2,
      priority: TaskPriority.MEDIUM,
      labels: ["Work", "Health"],
      status: TaskStatus.TODO,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441008",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "GYM-013",
      summary:
        "Attend a yoga class for flexibility and relaxation, then finish with a 15-minute cool-down.",
      description: "Yoga session",
      dueDate: new Date("2025-10-23"),
      estimation: 2.5,
      priority: TaskPriority.MEDIUM,
      labels: ["Health", "Relaxation"],
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655441009",
      taskBoardId: TASKBOARD_SPORT_ID,
      taskKey: "GH-378-GYM",
      summary:
        "Complete a 30-minute cardio session followed by strength training focusing on upper body.",
      description: "Cardio and strength training",
      dueDate: new Date("2025-10-19"),
      estimation: 3,
      priority: TaskPriority.LOW,
      labels: ["Design"],
      status: TaskStatus.DONE,
    },
  ],
};

// Helper functions to manage mock data
export function getAllFolders(): Folder[] {
  return mockFolders;
}

export function getFolderById(id: string): Folder | undefined {
  return mockFolders.find((f) => f.id === id);
}

export function getAllTaskBoards(): TaskBoard[] {
  return mockTaskBoards;
}

export function getTaskBoardById(id: string): TaskBoard | undefined {
  return mockTaskBoards.find((tb) => tb.id === id);
}

export function getTaskBoardsByFolder(folderId: string): TaskBoard[] {
  return mockTaskBoards.filter((tb) => tb.folderId === folderId);
}

export function getTasksByTaskBoardId(taskBoardId: string): Task[] {
  return mockTasks[taskBoardId];
}

export function getAllTasks(): Task[] {
  return Object.values(mockTasks).flat();
}

export function getTasksBySchedule(schedule: "today" | "tomorrow"): Task[] {
  const allTasks = getAllTasks();
  console.log("=== getTasksBySchedule ===");
  console.log("Schedule filter:", schedule);
  console.log(
    "All tasks:",
    allTasks.map((t) => ({ id: t.id, schedule: t.schedule })),
  );

  const filtered = allTasks.filter((task) => {
    if (!task.schedule) {
      console.log("Task with no schedule:", task.id);
      return false;
    }

    // Handle both string and enum values
    const taskSchedule = task.schedule as "today" | "tomorrow" | undefined;
    console.log("Comparing:", {
      taskSchedule,
      filter: schedule,
      taskId: task.id,
    });

    if (schedule === "today") {
      const matches = taskSchedule === "today";
      if (matches) console.log("MATCH for task:", task.id);
      return matches;
    } else {
      const matches = taskSchedule === "tomorrow";
      if (matches) console.log("MATCH for task:", task.id);
      return matches;
    }
  });

  console.log("Filtered tasks count:", filtered.length);
  return filtered;
}

export function createTask(task: Omit<Task, "id">): Task {
  const newTask: Task = {
    ...task,
    id: `550e8400-${Date.now()}-41d4-a716-${Math.random().toString(36).substring(2, 14)}`,
  };

  const taskBoardId = task.taskBoardId;
  if (!taskBoardId) {
    throw new Error("Task must have a taskBoardId");
  }

  if (!mockTasks[taskBoardId]) {
    mockTasks[taskBoardId] = [];
  }
  mockTasks[taskBoardId].push(newTask);

  return newTask;
}

export function getTaskById(taskId: string): Task | null {
  for (const taskBoardId in mockTasks) {
    const task = mockTasks[taskBoardId].find((t) => t.id === taskId);
    if (task) {
      return task;
    }
  }
  return null;
}

export function updateTask(
  taskId: string,
  updates: Partial<Task>,
): Task | null {
  for (const taskBoardId in mockTasks) {
    const taskIndex = mockTasks[taskBoardId].findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      mockTasks[taskBoardId][taskIndex] = {
        ...mockTasks[taskBoardId][taskIndex],
        ...updates,
      };
      return mockTasks[taskBoardId][taskIndex];
    }
  }
  return null;
}
