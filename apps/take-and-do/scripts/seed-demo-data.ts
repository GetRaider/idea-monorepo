/**
 * Seeds public demo rows (folders, task boards, tasks) for guest/anonymous users.
 * Set DEMO_USER_ID to a real user id that owns the demo content (e.g. a staff account).
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { foldersTable } from "../src/lib/db/modules/folder/folder.schema";
import { taskBoardsTable } from "../src/lib/db/modules/taskBoard/taskBoard.schema";
import { tasks } from "../src/lib/db/modules/task/task.schema";
import { user } from "../src/lib/db/modules/auth/auth.schema";
import { generateId } from "../src/lib/db/modules/utils";

async function main(): Promise<void> {
  const connectionString = process.env.DB_CONNECTION_STRING;
  const demoUserId = process.env.DEMO_USER_ID;
  if (!connectionString) {
    throw new Error("Set DB_CONNECTION_STRING");
  }
  if (!demoUserId?.trim()) {
    throw new Error(
      "Set DEMO_USER_ID to a user id that should own public demo data",
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  try {
    const [owner] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, demoUserId.trim()))
      .limit(1);

    if (!owner) {
      throw new Error(`No user row with id=${demoUserId}`);
    }

    const now = new Date();
    const folderId = generateId();
    const boardId = generateId();

    await db.insert(foldersTable).values({
      id: folderId,
      userId: owner.id,
      isPublic: true,
      name: "Demo workspace",
      emoji: "✨",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(taskBoardsTable).values({
      id: boardId,
      userId: owner.id,
      isPublic: true,
      name: "Demo board",
      emoji: "📋",
      folderId,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(tasks).values({
      id: generateId(),
      userId: owner.id,
      isPublic: true,
      taskBoardId: boardId,
      taskKey: "DEMO-1",
      summary: "Welcome — demo task",
      description: "<p>Anonymous users see public demo rows only.</p>",
      status: "To Do",
      priority: "medium",
      dueDate: null,
      estimation: null,
      scheduleDate: null,
      parentTaskId: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[seed:demo] Inserted demo folder, board, and task.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
