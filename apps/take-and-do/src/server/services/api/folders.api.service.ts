import { DB, and, eq } from "@/db/client";
import { foldersTable } from "@/db/schemas";
import { genericHelper } from "@/helpers/generic.helper";
import {
  BaseApiService,
  DataAccess,
} from "@/server/services/api/base.api.service";
import type { WorkspaceApiService } from "@/server/services/api/workspace.api.service";

export class FoldersApiService extends BaseApiService {
  constructor(
    protected readonly db: DB,
    private readonly workspace: WorkspaceApiService,
  ) {
    super(db);
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(async () => {
      const rows = await this.db
        .select()
        .from(foldersTable)
        .where(this.accessWhere(foldersTable, access));
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    });
  }

  async getById(id: string, access: DataAccess) {
    return this.handleOperation(async () => {
      const rows = await this.db
        .select()
        .from(foldersTable)
        .where(
          and(eq(foldersTable.id, id), this.accessWhere(foldersTable, access)),
        );
      if (rows.length === 0) return undefined;
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }

  async create(name: string, access: DataAccess, emoji?: string | null) {
    return this.handleOperation(async () => {
      const id = genericHelper.generateId();
      const trimmedEmoji =
        emoji === undefined || emoji === null ? null : emoji.trim() || null;
      const nameTrimmed = name.trim();
      if (!nameTrimmed) throw new Error("Folder name is required");

      if (access.isAnonymous) {
        const now = new Date();
        return {
          id,
          name: nameTrimmed,
          emoji: trimmedEmoji,
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        };
      }

      if (await this.workspace.isNameTaken(access, nameTrimmed))
        throw new Error("A workspace with this name already exists");

      await this.db.insert(foldersTable).values({
        id,
        userId: access.userId,
        isPublic: false,
        name: nameTrimmed,
        emoji: trimmedEmoji,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const created = await this.getById(id, access);
      if (!created) throw new Error("Failed to retrieve created folder");
      return created;
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      emoji?: string | null;
      isPublic?: boolean;
      createdAt?: Date | string;
    },
    access: DataAccess,
  ) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) {
        if (
          data.name === undefined ||
          typeof data.name !== "string" ||
          !data.name.trim()
        ) {
          throw new Error("Folder name is required");
        }
        const now = new Date();
        const createdAt = data.createdAt
          ? new Date(data.createdAt as string | Date)
          : now;
        return {
          id,
          name: data.name.trim(),
          emoji: data.emoji !== undefined ? data.emoji : null,
          isPublic: data.isPublic ?? false,
          createdAt,
          updatedAt: now,
        };
      }

      const existing = await this.getById(id, access);
      if (!existing) {
        throw new Error("Folder not found");
      }

      if (data.name !== undefined) {
        const nameTrimmed = data.name.trim();
        if (!nameTrimmed) throw new Error("Folder name is required");
        if (
          await this.workspace.isNameTaken(access, nameTrimmed, {
            folderId: id,
          })
        )
          throw new Error("A workspace with this name already exists");
      }

      await this.db
        .update(foldersTable)
        .set({
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.emoji !== undefined && { emoji: data.emoji }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          updatedAt: new Date(),
        })
        .where(eq(foldersTable.id, id));

      const updated = await this.getById(id, access);
      if (!updated) throw new Error("Failed to retrieve updated folder");
      return updated;
    });
  }

  async delete(id: string, access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return;

      const existing = await this.getById(id, access);

      if (!existing) throw new Error("Folder not found");

      await this.db.delete(foldersTable).where(eq(foldersTable.id, id));
    });
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Folder not found") this.notFound("Folder");
    if (message === "Folder name is required") this.badRequest(message);
    if (message === "A workspace with this name already exists")
      this.badRequest(message);
    throw error;
  }
}
