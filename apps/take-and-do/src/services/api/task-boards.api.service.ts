import type { TaskBoardsRepository } from "@/db/repositories/task-boards.repository";
import type { TaskBoard } from "@/types/workspace";
import type { DataAccess } from "@/db/repositories/base.repository";
import { BaseApiService } from "@/services/api/base.api.service";

export class TaskBoardsApiService extends BaseApiService {
  constructor(private readonly repository: TaskBoardsRepository) {
    super();
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(() => this.repository.getAllTaskBoards(access));
  }

  async getById(id: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getTaskBoardById(id, access),
    );
  }

  async getByFolder(folderId: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getTaskBoardsByFolder(folderId, access),
    );
  }

  async create(
    data: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
    access: DataAccess,
  ) {
    return this.handleOperation(() =>
      this.repository.createTaskBoard(data, access),
    );
  }

  async update(
    id: string,
    data: Partial<
      Pick<TaskBoard, "name" | "folderId" | "emoji" | "isPublic"> & {
        createdAt?: Date | string;
      }
    >,
    access: DataAccess,
  ) {
    return this.handleOperation(() =>
      this.repository.updateTaskBoard(id, data, access),
    );
  }

  async delete(id: string, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.deleteTaskBoard(id, access),
    );
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Task board not found") this.notFound("Task board");
    if (message === "Task board name is required") this.badRequest(message);
    throw error;
  }
}
