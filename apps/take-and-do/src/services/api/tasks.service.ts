import { Task, TaskPriority, TaskUpdate } from "@/components/KanbanBoard/types";

// Helper to normalize a task (including subtasks) from API response
function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    scheduleDate: task.scheduleDate ? new Date(task.scheduleDate) : undefined,
    priority: normalizePriority(task.priority),
    subtasks: (task.subtasks || []).map((subtask) => normalizeTask(subtask)),
  };
}

export const tasksService = {
  async getAll(): Promise<Task[]> {
    const response = await fetch("/api/tasks");
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    return tasks.map((task: Task) => normalizeTask(task));
  },

  async getBySchedule(): Promise<{
    today: Task[];
    tomorrow: Task[];
  }> {
    const [todayResponse, tomorrowResponse] = await Promise.all([
      fetch("/api/tasks?schedule=today"),
      fetch("/api/tasks?schedule=tomorrow"),
    ]);

    if (!todayResponse.ok || !tomorrowResponse.ok) {
      throw new Error("Failed to fetch scheduled tasks");
    }

    const todayTasks = await todayResponse.json();
    const tomorrowTasks = await tomorrowResponse.json();

    return {
      today: todayTasks.map((task: Task) => normalizeTask(task)),
      tomorrow: tomorrowTasks.map((task: Task) => normalizeTask(task)),
    };
  },

  async getByTaskBoard(taskBoardId: string): Promise<Task[]> {
    const response = await fetch(`/api/tasks?taskBoardId=${taskBoardId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    return tasks.map((task: Task) => normalizeTask(task));
  },

  async getById(taskId: string): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch task");
    }
    const task = await response.json();
    return normalizeTask(task);
  },

  async getByKey(taskKey: string): Promise<{ task: Task; parent: Task | null }> {
    const response = await fetch(`/api/tasks/by-key/${taskKey}`);
    if (!response.ok) {
      throw new Error("Failed to fetch task");
    }
    const data = await response.json();
    return {
      task: normalizeTask(data.task),
      parent: data.parent ? normalizeTask(data.parent) : null,
    };
  },

  async create(task: Omit<Task, "id">): Promise<Task> {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error("Failed to create task");
    }
    const createdTask = await response.json();
    return normalizeTask(createdTask);
  },

  async update(taskId: string, updates: TaskUpdate): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update task");
    }
    const updatedTask = await response.json();
    return normalizeTask(updatedTask);
  },
};

function normalizePriority(priority: unknown): TaskPriority {
  if (!priority) return TaskPriority.MEDIUM;

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];

  return validPriorities.includes(priorityString)
    ? (priorityString as TaskPriority)
    : TaskPriority.MEDIUM;
}
