import { Task } from "@/types/task";
import { tasksHelper } from "@/helpers/task.helper";
import { guestStoreHelper } from "@/stores/guest";
import { TaskBoard } from "@/types/workspace";

import { BaseClientService } from "./base.client.service";
import { TasksClientService } from "./tasks.client.service";
import { FoldersClientService } from "./folders.client.service";

export class TaskBoardsClientService extends BaseClientService {
  constructor(
    private readonly tasksClientService: TasksClientService,
    private readonly foldersClientService: FoldersClientService,
  ) {
    super("/task-boards");
  }

  async getAll(): Promise<TaskBoard[]> {
    const result = await this.get<TaskBoard[]>({});
    if (!this.isResultOk(result)) return [];
    return result.data.map(normalizeTaskBoard);
  }

  async getById(id: string): Promise<TaskBoard | null> {
    const result = await this.get<TaskBoard[]>({ queries: { id } });
    if (!this.isResultOk(result) || result.data.length === 0) return null;
    return normalizeTaskBoard(result.data[0]);
  }

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const result = await this.get<Task[]>({
      pathParams: ["tasks"],
      queries: { taskBoardId },
    });
    if (!this.isResultOk(result)) return [];
    return result.data.map(normalizeTask);
  }

  async create(
    taskBoard: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaskBoard | null> {
    const result = await this.post<TaskBoard & { guest?: boolean }>({
      body: taskBoard,
    });
    if (!this.isResultOk(result)) return null;
    const payload = result.data;
    const { guest, ...rest } = payload as TaskBoard & { guest?: boolean };
    const normalized = normalizeTaskBoard(rest as TaskBoard);
    if (guest) guestStoreHelper.upsertTaskBoard(normalized);
    return normalized;
  }

  async update({
    id,
    updates,
  }: {
    id: string;
    updates: TaskBoardUpdate;
  }): Promise<TaskBoard | null> {
    const result = await this.patch<TaskBoard & { guest?: boolean }>({
      queries: { id },
      body: updates,
    });
    if (!this.isResultOk(result)) return null;
    const payload = result.data;
    const { guest, ...rest } = payload as TaskBoard & { guest?: boolean };
    const normalized = normalizeTaskBoard(rest as TaskBoard);
    if (guest) guestStoreHelper.upsertTaskBoard(normalized);
    return normalized;
  }

  async changeVisibility({
    id,
    toPublic,
    boardSnapshot,
    skipCascade,
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
    if (skipCascade) return updatedBoard;
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
    const result = await this.delete<{
      guest?: boolean;
      deleted?: boolean;
    }>({ queries: { id } });
    if (this.isResultOk(result) && result.data?.guest)
      guestStoreHelper.deleteTaskBoard(id);
    return null;
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
  createdAt?: Date | string;
}
