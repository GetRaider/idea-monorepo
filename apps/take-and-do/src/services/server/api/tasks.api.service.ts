import { aiServices } from "@/services/server/ai";
import { tasksHelper } from "@/helpers/task.helper";
import { BaseApiService } from "@/services/server/api/base.api.service";

import type { TaskPostPayload } from "@/helpers/task.helper";
import type { ComposeTaskOutput } from "@/services/server/ai";
import type { Task, TaskUpdate } from "@/types/task";
import type { DataAccess } from "@/db/repositories/base.repository";
import type { TasksRepository } from "@/db/repositories/tasks.repository";

export class TasksApiService extends BaseApiService {
  constructor(private readonly repository: TasksRepository) {
    super();
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(() => this.repository.getAllTasks(access));
  }

  async getByBoardId(taskBoardId: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getTasksByTaskBoardId(taskBoardId, access),
    );
  }

  async getByDate(date: Date, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getTasksByDate(date, access),
    );
  }

  async getById(taskId: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const task = await this.repository.getTaskById(taskId, access);
      if (!task) return null;
      return serializeTask(task);
    });
  }

  async getByKey(taskKey: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const result = await this.repository.getTaskByKey(taskKey, access);
      if (!result) return null;
      return {
        task: serializeTask(result.task),
        parent: result.parent ? serializeTask(result.parent) : null,
      };
    });
  }

  async create(
    payload: TaskPostPayload,
    access: DataAccess,
  ): Promise<{ task?: Task; composed?: ComposeTaskOutput }> {
    return this.handleOperation(async () => {
      if (payload.shouldUseAI && payload.text) {
        const composed = await aiServices.task.compose({ text: payload.text });

        if (payload._composeOnly) return { composed };

        const taskData = tasksHelper.fromJson.createTask({
          ...payload.task,
          summary: composed.summary,
          description: composed.description ?? payload.task.description,
          subtasks: composed.subtasks ?? payload.task.subtasks,
          priority: composed.priority ?? payload.task.priority,
          estimation: composed.estimation ?? payload.task.estimation,
          labels: composed.labels ?? payload.task.labels,
        });

        const task = await this.repository.createTask(taskData, access, {
          taskBoardName: payload.taskBoardName,
        });
        return { task };
      }

      const task = await this.repository.createTask(payload.task, access, {
        taskBoardName: payload.taskBoardName,
      });
      return { task };
    });
  }

  async update(taskId: string, updates: TaskUpdate, access: DataAccess) {
    return this.handleOperation(async () => {
      const task = await this.repository.updateTask(taskId, updates, access);
      if (!task) return null;
      return serializeTask(task);
    });
  }

  async delete(taskId: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.deleteTask(taskId, access),
    );
  }

  async deleteAllForBoard(taskBoardId: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.deleteAllTasksForTaskBoard(taskBoardId, access),
    );
  }

  async optimize(taskIds: string[], access: DataAccess) {
    return this.handleOperation(async () => {
      const taskRows = await this.repository.getTasksForOptimization(
        taskIds,
        access,
      );

      const optimization = await aiServices.schedule.optimize({
        tasks: taskRows.map((row) => ({
          id: row.id,
          summary: row.summary,
          priority: row.priority as "low" | "medium" | "high" | "critical",
          dueDate: row.dueDate ? row.dueDate.toISOString() : null,
          estimation: row.estimation,
          scheduleDate: row.scheduleDate
            ? row.scheduleDate.toISOString()
            : null,
          status: row.status,
        })),
        currentDate: new Date().toISOString(),
      });

      return { optimization, tasksCount: taskRows.length };
    });
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Task board not found") this.notFound("Task board");
    if (message === "Task must have a taskBoardId") this.badRequest(message);
    throw error;
  }
}

function serializeTask(task: Task): SerializedTask {
  return {
    id: task.id,
    taskBoardId: task.taskBoardId,
    taskKey: task.taskKey,
    summary: task.summary,
    description: task.description,
    status: task.status,
    priority: task.priority,
    labels: task.labels || [],
    dueDate: tasksHelper.date.toISOString(task.dueDate),
    estimation: task.estimation,
    subtasks: (task.subtasks || []).map((subtask) => serializeTask(subtask)),
    scheduleDate: tasksHelper.date.toISOString(task.scheduleDate),
  };
}

interface SerializedTask {
  id: string;
  taskBoardId: string;
  taskKey?: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  dueDate?: string;
  estimation?: number;
  subtasks: SerializedTask[];
  scheduleDate?: string;
}
