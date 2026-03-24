import { eq } from "drizzle-orm";

import { db } from "./client";
import { user } from "./modules/auth/auth.schema";

export type DataAccess = {
  userId: string;
  isAnonymous: boolean;
};

/**
 * Returns the WHERE condition for data access based on whether the user is anonymous.
 * Anonymous users see only public rows; authenticated users see only their own rows.
 */
export function dataAccessFilter(
  table: { userId: unknown; isPublic: unknown },
  userId: string,
  isAnonymous: boolean,
) {
  if (isAnonymous) {
    return eq(table.isPublic as never, true);
  }
  return eq(table.userId as never, userId);
}

/**
 * Returns true if the user is an anonymous (guest) session.
 * Uses the is_anonymous DB field set by better-auth's anonymous plugin.
 */
export async function isAnonymousUser(userId: string): Promise<boolean> {
  const result = await db
    .select({ isAnonymous: user.isAnonymous })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0]?.isAnonymous ?? false;
}
