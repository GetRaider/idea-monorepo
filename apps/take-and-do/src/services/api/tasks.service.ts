import { Task, TaskPriority, TaskUpdate } from "@/components/KanbanBoard/types";
import { BaseApiService } from "./base-api.service";
import { tasksHelper } from "@/helpers/task.helper";

export class TasksService extends BaseApiService {
  constructor() {
    super("/tasks");
  }

  async getAll(): Promise<Task[]> {
    const response = await this.get<Task[]>();
    return response.data.map((task: Task) => normalizeTask(task));
  }

  async getBySchedule(): Promise<{
    today: Task[];
    tomorrow: Task[];
  }> {
    // Fetch both today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayResponse, tomorrowResponse] = await Promise.all([
      this.get<Task[]>({
        queries: { date: tasksHelper.date.formatForAPI(today) },
      }),
      this.get<Task[]>({
        queries: { date: tasksHelper.date.formatForAPI(tomorrow) },
      }),
    ]);

    if (todayResponse.status !== 200 || tomorrowResponse.status !== 200) {
      console.error("Failed to fetch scheduled tasks");
      return { today: [], tomorrow: [] };
    }

    const todayTasks = todayResponse.data;
    const tomorrowTasks = tomorrowResponse.data;

    return {
      today: todayTasks.map((task: Task) => normalizeTask(task)),
      tomorrow: tomorrowTasks.map((task: Task) => normalizeTask(task)),
    };
  }

  async getByDate(date: Date): Promise<Task[]> {
    // Format date in local timezone, not UTC
    const dateString = tasksHelper.date.formatForAPI(date);
    const response = await this.get<Task[]>({ queries: { date: dateString } });
    return response.data.map((task: Task) => normalizeTask(task));
  }

  async getRecent(days: number = 7): Promise<Task[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - days);

    const allTasks = await this.getAll();
    return allTasks.filter((task) => {
      if (task.scheduleDate) {
        const scheduleTime = new Date(task.scheduleDate).getTime();
        return scheduleTime >= pastDate.getTime();
      }
      if (task.dueDate) {
        const dueTime = new Date(task.dueDate).getTime();
        return dueTime >= pastDate.getTime();
      }
      return true;
    });
  }

  async getByTaskBoard(taskBoardId: string): Promise<Task[]> {
    const tasks = await super.get<Task[]>({ queries: { taskBoardId } });
    return tasks.data.map((task: Task) => normalizeTask(task));
  }

  async getById(taskId: string): Promise<Task> {
    const response = await super.get<Task>({ pathParams: [taskId] });
    return normalizeTask(response.data);
  }

  async getByKey(
    taskKey: string,
  ): Promise<{ task: Task; parent: Task | null }> {
    const response = await super.get<{ task: Task; parent: Task | null }>({
      pathParams: ["by-key", taskKey],
    });
    return {
      task: normalizeTask(response.data.task),
      parent: response.data.parent ? normalizeTask(response.data.parent) : null,
    };
  }

  async create(task: Omit<Task, "id">): Promise<Task> {
    const response = await super.post<Task>({ body: task });
    return normalizeTask(response.data);
  }

  async composeWithAI(
    text: string,
    taskBoardId: string,
    additionalData?: Partial<Omit<Task, "id">>,
  ): Promise<Omit<Task, "id">> {
    const response = await super.post<Omit<Task, "id">>({
      body: {
        shouldUseAI: true,
        text,
        taskBoardId,
        ...additionalData,
        _composeOnly: true, // we only want composition, not creation
      },
    });
    return normalizeTask(response.data);
  }

  async createWithAI(
    text: string,
    taskBoardId: string,
    additionalData?: Partial<Omit<Task, "id">>,
  ): Promise<Task> {
    const response = await super.post<Task>({
      body: {
        shouldUseAI: true,
        text,
        taskBoardId,
        ...additionalData,
      },
    });
    return normalizeTask(response.data);
  }

  async update(taskId: string, updates: TaskUpdate): Promise<Task> {
    const response = await super.patch<Task>({
      pathParams: [taskId],
      body: updates,
    });
    return normalizeTask(response.data);
  }

  async delete(taskId: string): Promise<void> {
    await super.delete<void>({ pathParams: [taskId] });
  }

  async optimizeSchedule(
    taskIds: string[],
  ): Promise<ScheduleOptimizationResult> {
    const response = await super.post<ScheduleOptimizationResult>({
      body: { taskIds },
    });
    return response.data;
  }
}

// export const tasksService = {
//   // async getAll(): Promise<Task[]> {
//   //   const response = await fetch("/api/tasks");
//   //   if (!response.ok) {
//   //     throw new Error("Failed to fetch tasks");
//   //   }
//   //   const tasks = await response.json();
//   //   return tasks.map((task: Task) => normalizeTask(task));
//   // },
//   // async getBySchedule(): Promise<{
//   //   today: Task[];
//   //   tomorrow: Task[];
//   // }> {
//   //   // Fetch both today and tomorrow
//   //   const today = new Date();
//   //   today.setHours(0, 0, 0, 0);
//   //   const tomorrow = new Date(today);
//   //   tomorrow.setDate(tomorrow.getDate() + 1);
//   //   // Format dates in local timezone, not UTC
//   //   const formatDateForAPI = (date: Date): string => {
//   //     const year = date.getFullYear();
//   //     const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   //     const day = date.getDate().toString().padStart(2, "0");
//   //     return `${year}-${month}-${day}`;
//   //   };
//   //   const [todayResponse, tomorrowResponse] = await Promise.all([
//   //     fetch(`/api/tasks?date=${tasksHelper.date.formatForAPI(today)}`),
//   //     fetch(`/api/tasks?date=${tasksHelper.date.formatForAPI(tomorrow)}`),
//   //   ]);
//   //   if (!todayResponse.ok || !tomorrowResponse.ok) {
//   //     console.error("Failed to fetch scheduled tasks");
//   //     return { today: [], tomorrow: [] };
//   //   }
//   //   const todayTasks = await todayResponse.json();
//   //   const tomorrowTasks = await tomorrowResponse.json();
//   //   return {
//   //     today: todayTasks.map((task: Task) => normalizeTask(task)),
//   //     tomorrow: tomorrowTasks.map((task: Task) => normalizeTask(task)),
//   //   };
//   // },
//   // async getByDate(date: Date): Promise<Task[]> {
//   //   // Format date in local timezone, not UTC
//   //   const formatDateForAPI = (d: Date): string => {
//   //     const year = d.getFullYear();
//   //     const month = (d.getMonth() + 1).toString().padStart(2, "0");
//   //     const day = d.getDate().toString().padStart(2, "0");
//   //     return `${year}-${month}-${day}`;
//   //   };
//   //   const dateString = formatDateForAPI(date);
//   //   const response = await fetch(`/api/tasks?date=${dateString}`);
//   //   if (!response.ok) {
//   //     throw new Error("Failed to fetch tasks by date");
//   //   }
//   //   const tasks = await response.json();
//   //   return tasks.map((task: Task) => normalizeTask(task));
//   // },
//   // async getRecent(days: number = 7): Promise<Task[]> {
//   //   const now = new Date();
//   //   now.setHours(0, 0, 0, 0);
//   //   const pastDate = new Date(now);
//   //   pastDate.setDate(pastDate.getDate() - days);
//   //   const allTasks = await this.getAll();
//   //   return allTasks.filter((task) => {
//   //     if (task.scheduleDate) {
//   //       const scheduleTime = new Date(task.scheduleDate).getTime();
//   //       return scheduleTime >= pastDate.getTime();
//   //     }
//   //     if (task.dueDate) {
//   //       const dueTime = new Date(task.dueDate).getTime();
//   //       return dueTime >= pastDate.getTime();
//   //     }
//   //     return true;
//   //   });
//   // },
//   // async getByTaskBoard(taskBoardId: string): Promise<Task[]> {
//   //   const response = await fetch(`/api/tasks?taskBoardId=${taskBoardId}`);
//   //   if (!response.ok) {
//   //     throw new Error("Failed to fetch tasks");
//   //   }
//   //   const tasks = await response.json();
//   //   return tasks.map((task: Task) => normalizeTask(task));
//   // },
//   // async getById(taskId: string): Promise<Task> {
//   //   const response = await fetch(`/api/tasks/${taskId}`);
//   //   if (!response.ok) {
//   //     throw new Error("Failed to fetch task");
//   //   }
//   //   const task = await response.json();
//   //   return normalizeTask(task);
//   // },
//   // async getByKey(
//   //   taskKey: string,
//   // ): Promise<{ task: Task; parent: Task | null }> {
//   //   const response = await fetch(`/api/tasks/by-key/${taskKey}`);
//   //   if (!response.ok) {
//   //     throw new Error("Failed to fetch task");
//   //   }
//   //   const data = await response.json();
//   //   return {
//   //     task: normalizeTask(data.task),
//   //     parent: data.parent ? normalizeTask(data.parent) : null,
//   //   };
//   // },
//   // async create(task: Omit<Task, "id">): Promise<Task> {
//   //   const response = await fetch("/api/tasks", {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //     body: JSON.stringify(task),
//   //   });
//   //   if (!response.ok) {
//   //     throw new Error("Failed to create task");
//   //   }
//   //   const createdTask = await response.json();
//   //   return normalizeTask(createdTask);
//   // },
//   // async composeWithAI(
//   //   text: string,
//   //   taskBoardId: string,
//   //   additionalData?: Partial<Omit<Task, "id">>,
//   // ): Promise<Omit<Task, "id">> {
//   //   const response = await fetch("/api/tasks", {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //     body: JSON.stringify({
//   //       shouldUseAI: true,
//   //       text,
//   //       taskBoardId,
//   //       ...additionalData,
//   //       _composeOnly: true, // Flag to indicate we only want composition, not creation
//   //     }),
//   //   });
//   //   if (!response.ok) {
//   //     const errorData = await response.json().catch(() => ({}));
//   //     throw new Error(
//   //       errorData.details ||
//   //         errorData.error ||
//   //         "Failed to compose task with AI",
//   //     );
//   //   }
//   //   const composedData = await response.json();
//   //   // Return as Omit<Task, "id"> since we're not creating yet
//   //   let finalScheduleDate: Date | undefined;
//   //   if (composedData.scheduleDate) {
//   //     finalScheduleDate = new Date(composedData.scheduleDate);
//   //   }
//   //   return {
//   //     taskBoardId: composedData.taskBoardId || taskBoardId,
//   //     taskKey: composedData.taskKey,
//   //     summary: composedData.summary,
//   //     description: composedData.description,
//   //     status: (composedData.status as Task["status"]) || "To Do",
//   //     priority: (composedData.priority as Task["priority"]) || "medium",
//   //     labels: composedData.labels,
//   //     dueDate: composedData.dueDate
//   //       ? new Date(composedData.dueDate)
//   //       : undefined,
//   //     estimation: composedData.estimation,
//   //     scheduleDate: finalScheduleDate,
//   //     subtasks: composedData.subtasks,
//   //   };
//   // },
//   // async createWithAI(
//   //   text: string,
//   //   taskBoardId: string,
//   //   additionalData?: Partial<Omit<Task, "id">>,
//   // ): Promise<Task> {
//   //   const response = await fetch("/api/tasks", {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //     body: JSON.stringify({
//   //       shouldUseAI: true,
//   //       text,
//   //       taskBoardId,
//   //       ...additionalData,
//   //     }),
//   //   });
//   //   if (!response.ok) {
//   //     const errorData = await response.json().catch(() => ({}));
//   //     throw new Error(
//   //       errorData.details || errorData.error || "Failed to create task with AI",
//   //     );
//   //   }
//   //   const createdTask = await response.json();
//   //   return normalizeTask(createdTask);
//   // },
//   // async update(taskId: string, updates: TaskUpdate): Promise<Task> {
//   //   const response = await fetch(`/api/tasks/${taskId}`, {
//   //     method: "PATCH",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //     body: JSON.stringify(updates),
//   //   });
//   //   if (!response.ok) {
//   //     throw new Error("Failed to update task");
//   //   }
//   //   const updatedTask = await response.json();
//   //   return normalizeTask(updatedTask);
//   // },
//   // async delete(taskId: string): Promise<void> {
//   //   const response = await fetch(`/api/tasks/${taskId}`, {
//   //     method: "DELETE",
//   //   });
//   //   if (!response.ok) {
//   //     throw new Error("Failed to delete task");
//   //   }
//   // },
//   // async optimizeSchedule(
//   //   taskIds: string[],
//   // ): Promise<ScheduleOptimizationResult> {
//   //   const response = await fetch("/api/schedule-optimization", {
//   //     method: "POST",
//   //     headers: {
//   //       "Content-Type": "application/json",
//   //     },
//   //     body: JSON.stringify({ taskIds }),
//   //   });
//   //   if (!response.ok) {
//   //     const errorData = await response.json().catch(() => ({}));
//   //     throw new Error(
//   //       errorData.details || errorData.error || "Failed to optimize schedule",
//   //     );
//   //   }
//   //   return response.json();
//   // },
// };

interface ScheduleRecommendation {
  taskId: string;
  taskSummary: string;
  currentSchedule: string | null;
  suggestedSchedule: string | null;
  reason: string;
}

interface ScheduleOptimizationResult {
  optimization: {
    summary: string;
    currentWorkload: {
      today: number;
      tomorrow: number;
      unscheduled: number;
    };
    recommendations: ScheduleRecommendation[];
    risks: string[];
    insights: string[];
  };
  tasksCount: number;
}

function normalizePriority(priority: unknown): TaskPriority {
  if (!priority) return TaskPriority.MEDIUM;

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];

  return validPriorities.includes(priorityString)
    ? (priorityString as TaskPriority)
    : TaskPriority.MEDIUM;
}

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
