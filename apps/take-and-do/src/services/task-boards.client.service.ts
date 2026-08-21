import { Task } from "@/types/task";
import { TaskBoard } from "@/types/workspace";

import { BaseClientService } from "./base.client.service";
import { TasksClientService } from "./tasks.client.service";
import { FoldersClientService } from "./folders.client.service";
import { Route } from "@/constants/route.constant";

export class TaskBoardsClientService extends BaseClientService {
  constructor(
    private readonly tasksClientService: TasksClientService,
    private readonly foldersClientService: FoldersClientService,
  ) {
    super(Route.TASK_BOARDS);
  }

  async getAll(): Promise<TaskBoard[]> {
    const result = await this.get<TaskBoard[]>({});
    if (!this.isResultOk(result)) return [];
    return result.data;
  }

  async getById(id: string): Promise<TaskBoard | null> {
    const result = await this.get<TaskBoard[]>({ queries: { id } });
    if (!this.isResultOk(result) || result.data.length === 0) return null;
    return result.data[0];
  }

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const result = await this.get<Task[]>({
      pathParams: ["tasks"],
      queries: { taskBoardId },
    });
    if (!this.isResultOk(result)) return [];
    return result.data;
  }

  async create(
    taskBoard: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaskBoard | null> {
    const result = await this.post<TaskBoard>({
      body: taskBoard,
    });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async update({
    id,
    updates,
  }: {
    id: string;
    updates: TaskBoardUpdate;
  }): Promise<TaskBoard | null> {
    const result = await this.patch<TaskBoard>({
      queries: { id },
      body: updates,
    });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async changeVisibility({
    id,
    toPublic,
    boardSnapshot,
  }: {
    id: string;
    toPublic: boolean;
    boardSnapshot?: TaskBoard;
    skipCascade?: boolean;
  }): Promise<TaskBoard | null> {
    const board = boardSnapshot ?? (await this.getById(id));
    if (!board) return null;
    const updatedBoard = await this.update({
      id,
      updates: {
        name: board.name,
        emoji: board.emoji,
        folderId: board.folderId ?? null,
        isPublic: toPublic,
        createdAt: board.createdAt,
      },
    });
    if (!updatedBoard) return null;
    const tasks = await this.tasksClientService.getByBoardId(id);
    for (const task of tasks) {
      await this.tasksClientService.update({
        taskId: task.id,
        updates: { isPublic: toPublic },
      });
    }
    if (board.folderId) {
      await this.foldersClientService.update({
        id: board.folderId,
        updates: { isPublic: toPublic },
      });
    }
    return updatedBoard;
  }

  async deleteBoard(id: string): Promise<null> {
    await this.delete<void>({ queries: { id } });
    return null;
  }
}

interface TaskBoardUpdate {
  name?: string;
  folderId?: string | null;
  emoji?: string | null;
  isPublic?: boolean;
  createdAt?: Date | string;
}
