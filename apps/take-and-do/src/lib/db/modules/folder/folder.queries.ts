import { and, eq } from "drizzle-orm";

import { type DataAccess, dataAccessFilter } from "../../data-access";
import { db } from "../../client";
import { foldersTable } from "./folder.schema";
import { Folder } from "@/types/workspace";
import { generateId } from "../utils";

export async function createFolder(
  name: string,
  access: DataAccess,
): Promise<Folder> {
  const id = generateId();
  await db.insert(foldersTable).values({
    id,
    userId: access.userId,
    isPublic: false,
    name,
    emoji: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const created = await getFolderById(id, access);
  if (!created) throw new Error("Failed to retrieve created folder");
  return created;
}

export async function getAllFolders(access: DataAccess): Promise<Folder[]> {
  const rows = await db
    .select()
    .from(foldersTable)
    .where(dataAccessFilter(foldersTable, access.userId, access.isAnonymous));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function getFolderById(
  id: string,
  access: DataAccess,
): Promise<Folder | undefined> {
  const rows = await db
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
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export async function updateFolder(
  id: string,
  data: { name?: string; emoji?: string | null },
  access: DataAccess,
): Promise<Folder> {
  const existing = await getFolderById(id, access);
  if (!existing) {
    throw new Error("Folder not found");
  }

  await db
    .update(foldersTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      updatedAt: new Date(),
    })
    .where(eq(foldersTable.id, id));

  const updated = await getFolderById(id, access);
  if (!updated) throw new Error("Failed to retrieve updated folder");
  return updated;
}

export async function deleteFolder(
  id: string,
  access: DataAccess,
): Promise<void> {
  const existing = await getFolderById(id, access);
  if (!existing) {
    throw new Error("Folder not found");
  }
  await db.delete(foldersTable).where(eq(foldersTable.id, id));
}
