import { and, eq } from "drizzle-orm";

import { type DataAccess, dataAccessFilter } from "../../data-access";
import { db } from "../../client";
import { taskBoardsTable } from "./taskBoard.schema";
import { TaskBoard } from "@/types/workspace";
import { generateId } from "../utils";

export async function getAllTaskBoards(
  access: DataAccess,
): Promise<TaskBoard[]> {
  const rows = await db
    .select()
    .from(taskBoardsTable)
    .where(
      dataAccessFilter(taskBoardsTable, access.userId, access.isAnonymous),
    );
  return rows.map((row) => ({
    id: row.id,
    isPublic: row.isPublic,
    name: row.name,
    emoji: row.emoji,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function getTaskBoardById(
  id: string,
  access: DataAccess,
): Promise<TaskBoard | undefined> {
  const rows = await db
    .select()
    .from(taskBoardsTable)
    .where(
      and(
        eq(taskBoardsTable.id, id),
        dataAccessFilter(taskBoardsTable, access.userId, access.isAnonymous),
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
}

export async function getTaskBoardsByFolder(
  folderId: string,
  access: DataAccess,
): Promise<TaskBoard[]> {
  const rows = await db
    .select()
    .from(taskBoardsTable)
    .where(
      and(
        eq(taskBoardsTable.folderId, folderId),
        dataAccessFilter(taskBoardsTable, access.userId, access.isAnonymous),
      ),
    );
  return rows.map((row) => ({
    id: row.id,
    isPublic: row.isPublic,
    name: row.name,
    emoji: row.emoji,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function updateTaskBoard(
  id: string,
  data: Partial<Pick<TaskBoard, "name" | "folderId" | "emoji" | "isPublic">>,
  access: DataAccess,
): Promise<TaskBoard> {
  const existing = await getTaskBoardById(id, access);
  if (!existing) {
    throw new Error("Task board not found");
  }

  await db
    .update(taskBoardsTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.folderId !== undefined && { folderId: data.folderId ?? null }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      updatedAt: new Date(),
    })
    .where(eq(taskBoardsTable.id, id));

  const updated = await getTaskBoardById(id, access);
  if (!updated) throw new Error("Failed to retrieve updated task board");
  return updated;
}

export async function deleteTaskBoard(
  id: string,
  access: DataAccess,
): Promise<void> {
  const existing = await getTaskBoardById(id, access);
  if (!existing) {
    throw new Error("Task board not found");
  }
  await db.delete(taskBoardsTable).where(eq(taskBoardsTable.id, id));
}

export async function createTaskBoard(
  taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  access: DataAccess,
): Promise<TaskBoard> {
  const taskBoardId = generateId();

  await db.insert(taskBoardsTable).values({
    id: taskBoardId,
    userId: access.userId,
    isPublic: taskBoardData.isPublic ?? false,
    name: taskBoardData.name,
    emoji: taskBoardData.emoji ?? null,
    folderId: taskBoardData.folderId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getTaskBoardById(taskBoardId, access);
  if (!created) {
    throw new Error("Failed to retrieve created task board");
  }
  return created;
}
