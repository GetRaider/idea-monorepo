import { TaskPriority, TaskStatus } from "@/constants/tasks.constants";
import { Task, TaskUpdate, toTaskPriority } from "@/types/task";
import type { ComposeTaskOutput } from "@/server/services/ai/schemas";
import { guestStoreHelper } from "@/stores/guest";
import { tasksHelper } from "@/helpers/task.helper";

import { BaseClientService } from "./base.client.service";
import { Route } from "@/constants/route.constant";

export class TasksClientService extends BaseClientService {
  constructor() {
    super(Route.TASKS);
  }

  async getAll(): Promise<Task[]> {
    const result = await this.get<Task[]>();
    if (!this.isResultOk(result)) return [];
    return result.data.map((task: Task) => normalizeTask(task));
  }

  async getBySchedule(): Promise<{
    today: Task[];
    tomorrow: Task[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayResult, tomorrowResult] = await Promise.all([
      this.get<Task[]>({
        queries: { date: tasksHelper.date.formatForAPI(today) },
      }),
      this.get<Task[]>({
        queries: { date: tasksHelper.date.formatForAPI(tomorrow) },
      }),
    ]);

    const todayTasks = this.isResultOk(todayResult) ? todayResult.data : [];
    const tomorrowTasks = this.isResultOk(tomorrowResult)
      ? tomorrowResult.data
      : [];

    return {
      today: todayTasks.map((task: Task) => normalizeTask(task)),
      tomorrow: tomorrowTasks.map((task: Task) => normalizeTask(task)),
    };
  }

  async getByDate(date: Date): Promise<Task[]> {
    const dateString = tasksHelper.date.formatForAPI(date);
    const result = await this.get<Task[]>({
      queries: { date: dateString },
    });
    if (!this.isResultOk(result)) return [];
    return result.data.map((task: Task) => normalizeTask(task));
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
    const result = await this.get<Task[]>({
      queries: { taskBoardId: boardId },
    });
    if (!this.isResultOk(result)) return [];
    return result.data.map((task: Task) => normalizeTask(task));
  }

  async getById(taskId: string): Promise<Task | null> {
    const result = await this.get<Task>({ pathParams: [taskId] });
    if (!this.isResultOk(result)) return null;
    return normalizeTask(result.data);
  }

  async getByKey(
    taskKey: string,
  ): Promise<{ task: Task; parent: Task | null } | null> {
    const result = await this.get<{ task: Task; parent: Task | null }>({
      pathParams: ["by-key", taskKey],
    });
    if (!this.isResultOk(result)) return null;
    const data = result.data;
    return {
      task: normalizeTask(data.task),
      parent: data.parent ? normalizeTask(data.parent) : null,
    };
  }

  async create(
    task: Omit<Task, "id"> & { taskBoardName?: string },
  ): Promise<Task | null> {
    const result = await this.post<Task & { guest?: boolean }>({
      body: task,
    });
    if (!this.isResultOk(result)) return null;
    const raw = result.data;
    const { guest, ...rest } = raw as Task & { guest?: boolean };
    const normalized = normalizeTask(rest as Task);
    if (guest) guestStoreHelper.addTask(normalized);
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
  }): Promise<ComposeTaskOutput | null> {
    const result = await this.post<ComposeTaskOutput>({
      body: {
        shouldUseAI: true,
        text,
        taskBoardId,
        ...additionalData,
        _composeOnly: true,
      },
    });
    return this.isResultOk(result) ? result.data : null;
  }

  async createWithAI({
    text,
    taskBoardId,
    additionalData,
  }: {
    text: string;
    taskBoardId: string;
    additionalData?: Partial<Omit<Task, "id">>;
  }): Promise<Task | null> {
    const result = await this.post<Task>({
      body: {
        shouldUseAI: true,
        text,
        taskBoardId,
        ...additionalData,
      },
    });
    if (!this.isResultOk(result)) return null;
    return normalizeTask(result.data);
  }

  async createSubtask(
    parentTaskId: string,
    input: {
      summary: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
    },
  ): Promise<Task | null> {
    const result = await this.post<Task>({
      pathParams: [parentTaskId, "subtasks"],
      body: input,
    });
    if (!this.isResultOk(result)) return null;
    return normalizeTask(result.data);
  }

  async update({
    taskId,
    updates,
  }: {
    taskId: string;
    updates: TaskUpdate;
  }): Promise<Task | null> {
    const result = await this.patch<Task>({
      pathParams: [taskId],
      body: updates,
    });
    if (!this.isResultOk(result)) return null;
    return normalizeTask(result.data);
  }

  async deleteById(taskId: string): Promise<null> {
    await this.delete<void>({ pathParams: [taskId] });
    return null;
  }

  async deleteAllForBoard(boardId: string): Promise<number | null> {
    const result = await this.delete<{ deleted: number }>({
      queries: { taskBoardId: boardId },
    });
    if (!this.isResultOk(result)) return null;
    return result.data?.deleted ?? null;
  }

  async optimizeSchedule(
    taskIds: string[],
  ): Promise<ScheduleOptimizationResult | null> {
    const result = await this.post<ScheduleOptimizationResult>({
      body: { taskIds },
      pathParams: ["optimization"],
    });
    return this.isResultOk(result) ? result.data : null;
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

function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: tasksHelper.date.parse(task.dueDate),
    scheduleDate: tasksHelper.date.parse(task.scheduleDate),
    priority: toTaskPriority(task.priority),
    subtasks: (task.subtasks || []).map((subtask) => normalizeTask(subtask)),
  };
}
