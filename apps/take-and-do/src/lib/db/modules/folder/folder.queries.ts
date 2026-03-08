import { eq } from "drizzle-orm";
import { db } from "../../client";
import { foldersTable } from "./folder.schema";
import { Folder } from "@/types/workspace";

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
