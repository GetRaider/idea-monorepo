import { eq } from "drizzle-orm";
import { db } from "../../client";
import { taskBoards } from "./taskBoard.schema";
import { TaskBoard } from "@/types/workspace";
import { generateId } from "../utils";

export async function getAllTaskBoards(): Promise<TaskBoard[]> {
  const rows = await db.select().from(taskBoards);
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
  const rows = await db.select().from(taskBoards).where(eq(taskBoards.id, id));
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
    .from(taskBoards)
    .where(eq(taskBoards.folderId, folderId));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    folderId: row.folderId || undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function createTaskBoard(
  taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
): Promise<TaskBoard> {
  const taskBoardId = generateId();

  await db.insert(taskBoards).values({
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
