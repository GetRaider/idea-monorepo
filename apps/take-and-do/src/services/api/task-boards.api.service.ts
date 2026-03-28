import { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskBoard } from "@/types/workspace";

import { BaseApiService } from "./base-api.service";
import { apiServices } from ".";

export class TaskBoardsApiService extends BaseApiService {
  constructor() {
    super("/task-boards");
  }

  async getAll(): Promise<TaskBoard[]> {
    const response = await this.get<TaskBoard[]>();
    return response.data.map(normalizeTaskBoard);
  }

  async getById(id: string): Promise<TaskBoard> {
    const response = await this.get<TaskBoard[]>({ queries: { id } });
    if (!response.data || response.data.length === 0) {
      throw new Error("TaskBoard not found");
    }
    return normalizeTaskBoard(response.data[0]);
  }

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const response = await this.getAtPath<Task[]>(["tasks"], {
      taskBoardId,
    });
    return response.data.map(normalizeTask);
  }

  async create(
    taskBoard: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaskBoard> {
    const response = await this.post<TaskBoard>({ body: taskBoard });
    return normalizeTaskBoard(response.data);
  }

  async update(id: string, updates: TaskBoardUpdate): Promise<TaskBoard> {
    const response = await this.patch<TaskBoard>({
      queries: { id },
      body: updates,
    });
    return normalizeTaskBoard(response.data);
  }

  async changeVisibility({
    id,
    toPublic,
  }: {
    id: string;
    toPublic: boolean;
  }): Promise<TaskBoard> {
    // Optimize query
    const board = await this.getById(id);
    const updatedBoard = await this.update(id, { isPublic: toPublic });
    const tasks = await apiServices.tasks.getByBoardId(id);
    // TODO: Optimize query to update all tasks at once
    for (const task of tasks) {
      await apiServices.tasks.update(task.id, { isPublic: toPublic });
    }
    if (board?.folderId) {
      await apiServices.folders.update(board.folderId, { isPublic: toPublic });
    }
    return updatedBoard;
  }

  async deleteBoard(id: string): Promise<void> {
    await this.delete({ queries: { id } });
  }
}

function normalizeTaskBoard(board: TaskBoard): TaskBoard {
  return {
    ...board,
    isPublic: board.isPublic ?? false,
    createdAt: new Date(board.createdAt),
    updatedAt: new Date(board.updatedAt),
  };
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: tasksHelper.date.parse(task.dueDate),
    scheduleDate: tasksHelper.date.parse(task.scheduleDate),
    priority: tasksHelper.priority.format(task.priority),
    subtasks: (task.subtasks ?? []).map(normalizeTask),
  };
}

interface TaskBoardUpdate {
  name?: string;
  folderId?: string | null;
  emoji?: string | null;
  isPublic?: boolean;
}
