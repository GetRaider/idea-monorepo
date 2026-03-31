import { Task, TaskUpdate, toTaskPriority } from "@/types/task";
import type { ComposeTaskOutput } from "@/services/ai/schemas";
import { guestStoreHelper } from "@/stores/guest";
import { BaseClientService } from "./base.client.service";
import { tasksHelper } from "@/helpers/task.helper";

export class TasksClientService extends BaseClientService {
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
        const scheduleTime = tasksHelper.date.getTime(task.scheduleDate);
        return scheduleTime !== undefined && scheduleTime >= pastDate.getTime();
      }
      if (task.dueDate) {
        const dueTime = tasksHelper.date.getTime(task.dueDate);
        return dueTime !== undefined && dueTime >= pastDate.getTime();
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

  async create(
    task: Omit<Task, "id"> & { taskBoardName?: string },
  ): Promise<Task> {
    const response = await super.post<Task & { guest?: boolean }>({
      body: task,
    });
    const raw = response.data;
    const { guest, ...rest } = raw as Task & { guest?: boolean };
    const normalized = normalizeTask(rest as Task);
    if (guest) {
      guestStoreHelper.addTask(normalized);
    }
    return normalized;
  }

  async composeWithAI({
    text,
    taskBoardId,
    additionalData,
  }: {
    text: string;
    taskBoardId: string;
    additionalData?: Partial<Omit<Task, "id">>;
  }): Promise<ComposeTaskOutput> {
    const response = await super.post<ComposeTaskOutput>({
      body: {
        shouldUseAI: true,
        text,
        taskBoardId,
        ...additionalData,
        _composeOnly: true,
      },
    });
    return response.data;
  }

  async createWithAI({
    text,
    taskBoardId,
    additionalData,
  }: {
    text: string;
    taskBoardId: string;
    additionalData?: Partial<Omit<Task, "id">>;
  }): Promise<Task> {
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

  async update({
    taskId,
    updates,
  }: {
    taskId: string;
    updates: TaskUpdate;
  }): Promise<Task> {
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

// Helper to normalize a task (including subtasks) from API response
function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: tasksHelper.date.parse(task.dueDate),
    scheduleDate: tasksHelper.date.parse(task.scheduleDate),
    priority: toTaskPriority(task.priority),
    subtasks: (task.subtasks || []).map((subtask) => normalizeTask(subtask)),
  };
}
