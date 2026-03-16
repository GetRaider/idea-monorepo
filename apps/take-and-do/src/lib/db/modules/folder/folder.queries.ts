import { eq } from "drizzle-orm";
import { db } from "../../client";
import { foldersTable } from "./folder.schema";
import { Folder } from "@/types/workspace";
import { generateId } from "../utils";

export async function createFolder(name: string): Promise<Folder> {
  const id = generateId();
  await db.insert(foldersTable).values({
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const created = await getFolderById(id);
  if (!created) throw new Error("Failed to retrieve created folder");
  return created;
}

export async function getAllFolders(): Promise<Folder[]> {
  const rows = await db.select().from(foldersTable);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function getFolderById(id: string): Promise<Folder | undefined> {
  const rows = await db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.id, id));
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export async function updateFolder(
  id: string,
  data: { name: string },
): Promise<Folder> {
  await db
    .update(foldersTable)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(foldersTable.id, id));
  const updated = await getFolderById(id);
  if (!updated) throw new Error("Failed to retrieve updated folder");
  return updated;
}

export async function deleteFolder(id: string): Promise<void> {
  await db.delete(foldersTable).where(eq(foldersTable.id, id));
}
