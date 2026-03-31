import { Task } from "@/types/task";
import { tasksHelper } from "@/helpers/task.helper";
import { guestStoreHelper } from "@/stores/guest";
import { TaskBoard } from "@/types/workspace";
import { BaseClientService } from "./base.client.service";
import { apiServices } from ".";

export class TaskBoardsClientService extends BaseClientService {
  constructor() {
    super("/task-boards");
  }

  async getAll(): Promise<TaskBoard[]> {
    const response = await this.get<TaskBoard[]>();
    return response.data.map(normalizeTaskBoard);
  }

  async getById(id: string): Promise<TaskBoard> {
    const response = await this.get<TaskBoard[]>({ queries: { id } });
    if (!response.data || response.data.length === 0)
      throw new Error("TaskBoard not found");
    return normalizeTaskBoard(response.data[0]);
  }

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const response = await this.getAtPath<Task[]>(["tasks"], { taskBoardId });
    return response.data.map(normalizeTask);
  }

  async create(
    taskBoard: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaskBoard> {
    const response = await this.post<TaskBoard & { guest?: boolean }>({
      body: taskBoard,
    });
    const { guest, ...rest } = response.data as TaskBoard & { guest?: boolean };
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
  }): Promise<TaskBoard> {
    const response = await this.patch<TaskBoard & { guest?: boolean }>({
      queries: { id },
      body: updates,
    });
    const { guest, ...rest } = response.data as TaskBoard & { guest?: boolean };
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
  }): Promise<TaskBoard> {
    const board = boardSnapshot ?? (await this.getById(id));
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
    if (skipCascade) return updatedBoard;
    const tasks = await apiServices.tasks.getByBoardId(id);
    for (const task of tasks) {
      await apiServices.tasks.update({
        taskId: task.id,
        updates: { isPublic: toPublic },
      });
    }
    if (board.folderId) {
      await apiServices.folders.update({
        id: board.folderId,
        updates: { isPublic: toPublic },
      });
    }
    return updatedBoard;
  }

  async deleteBoard(id: string): Promise<void> {
    const response = await this.delete<{ guest?: boolean; deleted?: boolean }>({
      queries: { id },
    });
    const data = response.data as { guest?: boolean } | undefined;
    if (data?.guest) guestStoreHelper.deleteTaskBoard(id);
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
