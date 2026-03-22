import {
  Task,
  TaskPriority,
  TaskUpdate,
} from "@/components/Boards/KanbanBoard/types";
import { BaseApiService } from "./base-api.service";
import { tasksHelper } from "@/helpers/task.helper";

export class TasksApiService extends BaseApiService {
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

  async getByBoardId(boardId: string): Promise<Task[]> {
    const response = await super.get<Task[]>({
      queries: { taskBoardId: boardId },
    });
    return response.data.map((task: Task) => normalizeTask(task));
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
        _composeOnly: true,
      },
    });
    return response.data as Omit<Task, "id">;
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
    console.dir({ taskId, updates }, { depth: null });
    const response = await super.patch<Task>({
      pathParams: [taskId],
      body: updates,
    });
    return normalizeTask(response.data);
  }

  async deleteById(taskId: string): Promise<void> {
    await super.delete<void>({ pathParams: [taskId] });
  }

  async deleteAllForBoard(boardId: string): Promise<number> {
    const response = await super.delete<{ deleted: number }>({
      queries: { taskBoardId: boardId },
    });
    return response.data.deleted;
  }

  async optimizeSchedule(
    taskIds: string[],
  ): Promise<ScheduleOptimizationResult> {
    const response = await super.post<ScheduleOptimizationResult>({
      body: { taskIds },
      pathParams: ["optimization"],
    });
    return response.data;
  }
}

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
