import type { TaskBoard } from "@/types/workspace";
import type { DataAccess } from "@/db/repositories/base.repository";
import { BaseApiService } from "@/services/server/api/base.api.service";
import { DB, and, eq } from "@/db/client";
import { taskBoardsTable } from "@/db/schemas/taskBoard.schema";
import { genericHelper } from "@/helpers/generic.helper";

export class TaskBoardsApiService extends BaseApiService {
  constructor(protected readonly db: DB) {
    super(db);
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(async () => {
      const rows = await this.db
        .select()
        .from(taskBoardsTable)
        .where(this.accessWhere(taskBoardsTable, access));
      return rows.map((row) => ({
        id: row.id,
        isPublic: row.isPublic,
        name: row.name,
        emoji: row.emoji,
        folderId: row.folderId || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    });
  }

  async getById(id: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const rows = await this.db
        .select()
        .from(taskBoardsTable)
        .where(
          and(
            eq(taskBoardsTable.id, id),
            this.accessWhere(taskBoardsTable, access),
          ),
        );
      if (rows.length === 0) return undefined;
      const row = rows[0];
      return {
        id: row.id,
        isPublic: row.isPublic,
        name: row.name,
        emoji: row.emoji,
        folderId: row.folderId || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    });
  }

  async getByFolder(folderId: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const rows = await this.db
        .select()
        .from(taskBoardsTable)
        .where(
          and(
            eq(taskBoardsTable.id, folderId),
            this.accessWhere(taskBoardsTable, access),
          ),
        );
      if (rows.length === 0) return undefined;
      const row = rows[0];
      return {
        id: row.id,
        isPublic: row.isPublic,
        name: row.name,
        emoji: row.emoji,
        folderId: row.folderId || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    });
  }

  async create(
    taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
    access: DataAccess,
  ) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) {
        const taskBoardId = genericHelper.generateId();
        const now = new Date();
        return {
          id: taskBoardId,
          name: taskBoardData.name,
          emoji: taskBoardData.emoji ?? null,
          folderId: taskBoardData.folderId ?? null,
          isPublic: taskBoardData.isPublic ?? false,
          createdAt: now,
          updatedAt: now,
        };
      }

      const taskBoardId = genericHelper.generateId();

      await this.db.insert(taskBoardsTable).values({
        id: taskBoardId,
        userId: access.userId,
        isPublic: taskBoardData.isPublic ?? false,
        name: taskBoardData.name,
        emoji: taskBoardData.emoji ?? null,
        folderId: taskBoardData.folderId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const created = await this.getById(taskBoardId, access);
      if (!created) throw new Error("Failed to retrieve created task board");
      return created;
    });
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
    return this.handleOperation(async () => {
      if (access.isAnonymous) {
        if (
          data.name === undefined ||
          typeof data.name !== "string" ||
          !data.name.trim()
        ) {
          throw new Error("Task board name is required");
        }
        const now = new Date();
        const createdAt = data.createdAt
          ? new Date(data.createdAt as string | Date)
          : now;
        const folderId =
          data.folderId === undefined ||
          data.folderId === "" ||
          data.folderId === null
            ? null
            : data.folderId;

        return {
          id,
          name: data.name.trim(),
          emoji: data.emoji !== undefined ? data.emoji : null,
          folderId,
          isPublic: data.isPublic ?? false,
          createdAt,
          updatedAt: now,
        };
      }

      const existing = await this.getById(id, access);
      if (!existing) throw new Error("Task board not found");

      await this.db
        .update(taskBoardsTable)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.folderId !== undefined && {
            folderId: data.folderId ?? null,
          }),
          ...(data.emoji !== undefined && { emoji: data.emoji }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          updatedAt: new Date(),
        })
        .where(eq(taskBoardsTable.id, id));

      const updated = await this.getById(id, access);
      if (!updated) throw new Error("Failed to retrieve updated task board");
      return updated;
    });
  }

  async delete(id: string, access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return;

      const existing = await this.getById(id, access);
      if (!existing) throw new Error("Task board not found");
      await this.db.delete(taskBoardsTable).where(eq(taskBoardsTable.id, id));
    });
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Task board not found") this.notFound("Task board");
    if (message === "Task board name is required") this.badRequest(message);
    throw error;
  }
}
