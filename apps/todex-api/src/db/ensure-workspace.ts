import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { workspaceMembers, workspaces } from "./schema";

export async function ensureOwnerWorkspace(
  db: NodePgDatabase,
  userId: string,
  userName?: string | null,
) {
  const existing = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const name = userName ? `${userName}'s workspace` : "Workspace";
  const now = new Date();

  await db.transaction(async (tx) => {
    const stillExisting = await tx
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);
    if (stillExisting[0]) return;

    await tx.insert(workspaces).values({
      id: workspaceId,
      name,
      taskSeq: 0,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(workspaceMembers).values({
      id: memberId,
      workspaceId,
      userId,
      role: "owner",
      createdAt: now,
    });
  });

  const [created] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  return created;
}
