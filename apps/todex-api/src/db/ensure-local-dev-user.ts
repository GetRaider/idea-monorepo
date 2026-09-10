import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "./auth-schema";
import { ensureOwnerWorkspace } from "./ensure-workspace";

export const LOCAL_DEV_USER_ID = "todex-local-dev-user";

export async function ensureLocalDevUser(db: NodePgDatabase) {
  const existing = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, LOCAL_DEV_USER_ID))
    .limit(1);

  if (!existing[0]) {
    const now = new Date();
    await db.insert(users).values({
      id: LOCAL_DEV_USER_ID,
      name: "Local Dev",
      email: "local-dev@todex.invalid",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  await ensureOwnerWorkspace(db, LOCAL_DEV_USER_ID, "Local Dev");
  return LOCAL_DEV_USER_ID;
}
