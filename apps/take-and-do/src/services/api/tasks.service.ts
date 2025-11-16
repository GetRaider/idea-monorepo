import { Task, TaskPriority } from "@/components/KanbanBoard/types";

export const tasksService = {
  async getAll(): Promise<Task[]> {
    const response = await fetch("/api/tasks");
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    return tasks.map((task: Task) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: normalizePriority(task.priority),
    }));
  },

  async getBySchedule(): Promise<{
    today: Task[];
    tomorrow: Task[];
  }> {
    // Fetch both today and tomorrow to maintain the same return structure
    const [todayResponse, tomorrowResponse] = await Promise.all([
      fetch("/api/tasks?schedule=today"),
      fetch("/api/tasks?schedule=tomorrow"),
    ]);

    if (!todayResponse.ok || !tomorrowResponse.ok) {
      throw new Error("Failed to fetch scheduled tasks");
    }

    const todayTasks = await todayResponse.json();
    const tomorrowTasks = await tomorrowResponse.json();

    // Convert date strings back to Date objects and normalize priority
    const normalizeTask = (task: Task) => {
      return {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: normalizePriority(task.priority),
      };
    };

    return {
      today: todayTasks.map(normalizeTask),
      tomorrow: tomorrowTasks.map(normalizeTask),
    };
  },

  async getByTaskBoard(taskBoardId: string): Promise<Task[]> {
    const response = await fetch(`/api/tasks?taskBoardId=${taskBoardId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    return tasks.map((task: Task) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: normalizePriority(task.priority),
    }));
  },

  async getById(taskId: string): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch task");
    }
    const task = await response.json();
    return {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: normalizePriority(task.priority),
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
    return {
      ...createdTask,
      dueDate: createdTask.dueDate ? new Date(createdTask.dueDate) : undefined,
    };
  },

  async update(taskId: string, updates: Partial<Task>): Promise<Task> {
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
    return {
      ...updatedTask,
      dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined,
      priority: normalizePriority(updatedTask.priority),
    };
  },
};

function normalizePriority(priority: unknown): TaskPriority {
  if (!priority) {
    return TaskPriority.MEDIUM;
  }

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];

  if (validPriorities.includes(priorityString)) {
    return priorityString as TaskPriority;
  }

  console.log("Priority didn't match, returning MEDIUM");
  return TaskPriority.MEDIUM;
}
