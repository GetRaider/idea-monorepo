import { Task, TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";
import { Folder, TaskBoard } from "@/types/workspace";

// Mock labels
export const mockLabels: string[] = [
  "Work",
  "Personal",
  "Urgent",
  "Food",
  "Health",
  "Creative",
  "Design",
  "Development",
  "Meeting",
  "Research",
  "Relaxation",
];

export function getAllLabels(): string[] {
  return [...mockLabels];
}

export function addLabel(label: string): string {
  if (!mockLabels.includes(label)) {
    mockLabels.push(label);
  }
  return label;
}

// Mock folders
const FOLDER_PERSONAL_ID = "550e8400-e29b-41d4-a716-446655440001";
const TASKBOARD_PERSONAL_ID = "550e8400-e29b-41d4-a716-446655440002";
const TASKBOARD_WORK_ID = "550e8400-e29b-41d4-a716-446655440003";
const TASKBOARD_SPORT_ID = "550e8400-e29b-41d4-a716-446655440004";

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
      scheduleDate: new Date(),
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
      scheduleDate: new Date(),
      subtasks: [
        {
          id: "550e8400-e29b-41d4-a716-446655441002-sub1",
          taskBoardId: TASKBOARD_WORK_ID,
          taskKey: "PS-2",
          summary: "Buy running shoes",
          description: "Get new running shoes for the race",
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          labels: [],
        },
        {
          id: "550e8400-e29b-41d4-a716-446655441002-sub2",
          taskBoardId: TASKBOARD_WORK_ID,
          taskKey: "PS-3",
          summary: "Plan race day nutrition",
          description: "Prepare meals and snacks for race day",
          priority: TaskPriority.LOW,
          status: TaskStatus.IN_PROGRESS,
          labels: ["Food"],
        },
      ],
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
      scheduleDate: new Date(),
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getAllTasks().filter((task) => {
    if (!task.scheduleDate) return false;
    const taskDate = new Date(task.scheduleDate);
    taskDate.setHours(0, 0, 0, 0);
    if (schedule === "today") {
      return taskDate.getTime() === today.getTime();
    } else {
      return taskDate.getTime() === tomorrow.getTime();
    }
  });
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

// Helper to recursively search for a task by ID (including subtasks)
function findTaskRecursively(tasks: Task[], taskId: string): Task | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }
    if (task.subtasks?.length) {
      const found = findTaskRecursively(task.subtasks, taskId);
      if (found) return found;
    }
  }
  return null;
}

// Helper to recursively search for a task by taskKey (including subtasks)
function findTaskByKeyRecursively(
  tasks: Task[],
  taskKey: string,
): { task: Task; parent: Task | null } | null {
  for (const task of tasks) {
    if (task.taskKey === taskKey) {
      return { task, parent: null };
    }
    if (task.subtasks?.length) {
      for (const subtask of task.subtasks) {
        if (subtask.taskKey === taskKey) {
          return { task: subtask, parent: task };
        }
        // Check nested subtasks
        const found = findTaskByKeyRecursively(task.subtasks, taskKey);
        if (found) {
          return { task: found.task, parent: found.parent || task };
        }
      }
    }
  }
  return null;
}

export function getTaskByKey(
  taskKey: string,
): { task: Task; parent: Task | null } | null {
  for (const taskBoardId in mockTasks) {
    const result = findTaskByKeyRecursively(mockTasks[taskBoardId], taskKey);
    if (result) {
      return result;
    }
  }
  return null;
}

export function getTaskById(taskId: string): Task | null {
  for (const taskBoardId in mockTasks) {
    // First check top-level tasks
    const task = mockTasks[taskBoardId].find((t) => t.id === taskId);
    if (task) {
      return task;
    }
    // Then search within subtasks
    const subtask = findTaskRecursively(mockTasks[taskBoardId], taskId);
    if (subtask) {
      return subtask;
    }
  }
  return null;
}

// Helper to generate unique IDs
function generateId(): string {
  return `550e8400-${Date.now()}-41d4-a716-${Math.random().toString(36).substring(2, 14)}`;
}

// Helper to derive taskKey prefix from parent task
function deriveTaskKeyPrefix(taskKey?: string): string {
  if (!taskKey) return "TASK";
  const segments = taskKey.split("-").filter(Boolean);
  if (!segments.length) return "TASK";

  const numericIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
  if (numericIndex > 0) {
    return segments.slice(0, numericIndex).join("-");
  }

  return segments[0] || "TASK";
}

// Helper to extract numeric portion from taskKey
function extractNumericPortion(taskKey?: string): number | null {
  if (!taskKey) return null;
  const matches = taskKey.match(/\d+/g);
  if (!matches?.length) return null;
  const numericValue = parseInt(matches[matches.length - 1], 10);
  return Number.isNaN(numericValue) ? null : numericValue;
}

// Generate next taskKey for a subtask based on parent and existing subtasks
function generateSubtaskKey(
  parentTask: Task,
  existingSubtasks: Task[],
): string {
  const prefix = deriveTaskKeyPrefix(parentTask.taskKey);
  const parentNumber = extractNumericPortion(parentTask.taskKey);
  const subtaskNumbers = existingSubtasks
    .map((subtask) => extractNumericPortion(subtask.taskKey))
    .filter((value): value is number => value !== null);

  const highestExistingNumber = Math.max(
    ...(parentNumber !== null ? [parentNumber] : []),
    ...(subtaskNumbers.length ? subtaskNumbers : [0]),
  );

  return `${prefix}-${highestExistingNumber + 1}`;
}

// Process subtasks: assign id and taskKey to new subtasks (those without an id)
function processSubtasks(parentTask: Task, subtasks: Task[]): Task[] {
  const processedSubtasks: Task[] = [];

  for (const subtask of subtasks) {
    // Check for existing subtask - must have a truthy id that's a non-empty string
    const hasValidId =
      subtask.id && typeof subtask.id === "string" && subtask.id.length > 0;

    if (hasValidId) {
      // Existing subtask, keep as-is
      processedSubtasks.push(subtask);
    } else {
      // New subtask: generate id and taskKey
      const newSubtask: Task = {
        ...subtask,
        id: generateId(),
        taskKey: generateSubtaskKey(parentTask, processedSubtasks),
        taskBoardId: subtask.taskBoardId || parentTask.taskBoardId,
      };
      processedSubtasks.push(newSubtask);
    }
  }

  return processedSubtasks;
}

// Helper to recursively update a subtask within a subtasks array
function updateSubtaskRecursively(
  subtasks: Task[],
  taskId: string,
  updates: Partial<Task>,
): { updated: boolean; subtasks: Task[]; updatedTask: Task | null } {
  for (let i = 0; i < subtasks.length; i++) {
    if (subtasks[i].id === taskId) {
      const updatedSubtask = { ...subtasks[i], ...updates };
      const newSubtasks = [...subtasks];
      newSubtasks[i] = updatedSubtask;
      return {
        updated: true,
        subtasks: newSubtasks,
        updatedTask: updatedSubtask,
      };
    }
    // Check nested subtasks
    if (subtasks[i].subtasks?.length) {
      const result = updateSubtaskRecursively(
        subtasks[i].subtasks!,
        taskId,
        updates,
      );
      if (result.updated) {
        const newSubtasks = [...subtasks];
        newSubtasks[i] = { ...subtasks[i], subtasks: result.subtasks };
        return {
          updated: true,
          subtasks: newSubtasks,
          updatedTask: result.updatedTask,
        };
      }
    }
  }
  return { updated: false, subtasks, updatedTask: null };
}

export function updateTask(
  taskId: string,
  updates: Partial<Task>,
): Task | null {
  // First, try to find and update as a top-level task
  for (const taskBoardId in mockTasks) {
    const taskIndex = mockTasks[taskBoardId].findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      const existingTask = mockTasks[taskBoardId][taskIndex];

      // Process subtasks if they're being updated
      const processedUpdates = { ...updates };
      if (updates.subtasks) {
        processedUpdates.subtasks = processSubtasks(
          existingTask,
          updates.subtasks,
        );
      }

      mockTasks[taskBoardId][taskIndex] = {
        ...existingTask,
        ...processedUpdates,
      };
      return mockTasks[taskBoardId][taskIndex];
    }
  }

  // If not found as top-level, search within subtasks
  for (const taskBoardId in mockTasks) {
    for (let i = 0; i < mockTasks[taskBoardId].length; i++) {
      const parentTask = mockTasks[taskBoardId][i];
      if (parentTask.subtasks?.length) {
        const result = updateSubtaskRecursively(
          parentTask.subtasks,
          taskId,
          updates,
        );
        if (result.updated) {
          // Update the parent task with the new subtasks array
          mockTasks[taskBoardId][i] = {
            ...parentTask,
            subtasks: result.subtasks,
          };
          return result.updatedTask;
        }
      }
    }
  }

  return null;
}
