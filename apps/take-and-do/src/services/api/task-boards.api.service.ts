import type { TaskBoardsRepository } from "@/db/repositories/task-boards.repository";
import type { TaskBoard } from "@/types/workspace";
import type { DataAccess } from "@/db/data-access";

export class TaskBoardsApiService {
  constructor(private readonly repository: TaskBoardsRepository) {}

  async getAll(access: DataAccess) {
    return this.repository.getAllTaskBoards(access);
  }

  async getById(id: string, access: DataAccess) {
    return this.repository.getTaskBoardById(id, access);
  }

  async getByFolder(folderId: string, access: DataAccess) {
    return this.repository.getTaskBoardsByFolder(folderId, access);
  }

  async create(
    data: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
    access: DataAccess,
  ) {
    return this.repository.createTaskBoard(data, access);
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
    return this.repository.updateTaskBoard(id, data, access);
  }

  async delete(id: string, access: DataAccess) {
    return this.repository.deleteTaskBoard(id, access);
  }
}
