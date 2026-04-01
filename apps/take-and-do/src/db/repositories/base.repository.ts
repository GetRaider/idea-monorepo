import { eq } from "drizzle-orm";

import type { DB } from "@/db/client";
import { db } from "@/db/client";
import { user } from "@/db/schemas/auth.schema";

export class BaseRepository {
  constructor(protected readonly db: DB) {}

  protected accessWhere(
    table: { userId: unknown; isPublic: unknown },
    access: DataAccess,
  ) {
    if (access.isAnonymous) return eq(table.isPublic as never, true);
    return eq(table.userId as never, access.userId);
  }
}

export type DataAccess = {
  userId: string;
  isAnonymous: boolean;
};

export async function isAnonymousUser(userId: string): Promise<boolean> {
  const result = await db
    .select({ isAnonymous: user.isAnonymous })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0]?.isAnonymous ?? false;
}
