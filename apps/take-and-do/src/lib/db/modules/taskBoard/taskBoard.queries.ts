import { eq } from "drizzle-orm";
import { db } from "../../client";
import { taskBoardsTable } from "./taskBoard.schema";
import { TaskBoard } from "@/types/workspace";
import { generateId } from "../utils";

export async function getAllTaskBoards(): Promise<TaskBoard[]> {
  const rows = await db.select().from(taskBoardsTable);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function getTaskBoardById(
  id: string,
): Promise<TaskBoard | undefined> {
  const rows = await db
    .select()
    .from(taskBoardsTable)
    .where(eq(taskBoardsTable.id, id));
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export async function getTaskBoardsByFolder(
  folderId: string,
): Promise<TaskBoard[]> {
  const rows = await db
    .select()
    .from(taskBoardsTable)
    .where(eq(taskBoardsTable.folderId, folderId));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function updateTaskBoard(
  id: string,
  data: Partial<Pick<TaskBoard, "name" | "folderId">>,
): Promise<TaskBoard> {
  await db
    .update(taskBoardsTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.folderId !== undefined && { folderId: data.folderId ?? null }),
      updatedAt: new Date(),
    })
    .where(eq(taskBoardsTable.id, id));

  const updated = await getTaskBoardById(id);
  if (!updated) throw new Error("Failed to retrieve updated task board");
  return updated;
}

export async function deleteTaskBoard(id: string): Promise<void> {
  await db.delete(taskBoardsTable).where(eq(taskBoardsTable.id, id));
}

export async function createTaskBoard(
  taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
): Promise<TaskBoard> {
  const taskBoardId = generateId();

  await db.insert(taskBoardsTable).values({
    id: taskBoardId,
    name: taskBoardData.name,
    folderId: taskBoardData.folderId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await getTaskBoardById(taskBoardId);
  if (!created) {
    throw new Error("Failed to retrieve created task board");
  }
  return created;
}
