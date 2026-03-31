import { and, eq } from "drizzle-orm";

import { type DataAccess, dataAccessFilter } from "@/db/data-access";
import { DB } from "@/db/client";
import { foldersTable } from "@/db/schemas/folder.schema";
import { genericHelper } from "@/helpers/generic.helper";

import type { Folder } from "@/types/workspace";

export class FoldersRepository {
  constructor(private readonly db: DB) {}

  async createFolder(
    name: string,
    access: DataAccess,
    emoji?: string | null,
  ): Promise<Folder> {
    const id = genericHelper.generateId();
    const trimmedEmoji =
      emoji === undefined || emoji === null ? null : emoji.trim() || null;

    if (access.isAnonymous) {
      const now = new Date();
      return {
        id,
        name,
        emoji: trimmedEmoji,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      };
    }

    await this.db.insert(foldersTable).values({
      id,
      userId: access.userId,
      isPublic: false,
      name,
      emoji: trimmedEmoji,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const created = await this.getFolderById(id, access);
    if (!created) throw new Error("Failed to retrieve created folder");
    return created;
  }

  async getAllFolders(access: DataAccess): Promise<Folder[]> {
    const rows = await this.db
      .select()
      .from(foldersTable)
      .where(dataAccessFilter(foldersTable, access.userId, access.isAnonymous));
    return rows.map((row: FolderRow) => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      isPublic: row.isPublic,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getFolderById(
    id: string,
    access: DataAccess,
  ): Promise<Folder | undefined> {
    const rows = await this.db
      .select()
      .from(foldersTable)
      .where(
        and(
          eq(foldersTable.id, id),
          dataAccessFilter(foldersTable, access.userId, access.isAnonymous),
        ),
      );
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      isPublic: row.isPublic,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateFolder(
    id: string,
    data: {
      name?: string;
      emoji?: string | null;
      isPublic?: boolean;
      createdAt?: Date | string;
    },
    access: DataAccess,
  ): Promise<Folder> {
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

    const existing = await this.getFolderById(id, access);
    if (!existing) {
      throw new Error("Folder not found");
    }

    await this.db
      .update(foldersTable)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.emoji !== undefined && { emoji: data.emoji }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        updatedAt: new Date(),
      })
      .where(eq(foldersTable.id, id));

    const updated = await this.getFolderById(id, access);
    if (!updated) throw new Error("Failed to retrieve updated folder");
    return updated;
  }

  async deleteFolder(id: string, access: DataAccess): Promise<void> {
    if (access.isAnonymous) return;

    const existing = await this.getFolderById(id, access);

    if (!existing) throw new Error("Folder not found");

    await this.db.delete(foldersTable).where(eq(foldersTable.id, id));
  }
}

type FolderRow = typeof foldersTable.$inferSelect;
