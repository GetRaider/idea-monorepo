import { eq } from "drizzle-orm";

import { db, DB } from "@/db/client";
import { user } from "@/db/schema";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";

export class BaseApiService {
  constructor(protected readonly db: DB) {}

  /**
   * Wraps repository calls. Exceptions are passed to `mapError` only; there is
   * no silent recovery — unknown errors still propagate after `mapError` rethrows.
   */
  protected async handleOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.mapError(error);
    }
  }

  protected accessWhere(
    table: { userId: unknown; isPublic: unknown },
    access: DataAccess,
  ) {
    if (access.isAnonymous) return eq(table.isPublic as never, true);
    return eq(table.userId as never, access.userId);
  }

  /**
   * Map repository/domain failures to HTTP errors (`notFound`, `badRequest`, …).
   * Rethrow anything you do not translate so route handlers can respond with 500.
   */
  protected mapError(error: unknown): never {
    throw error;
  }

  protected badRequest(message: string, details?: string): never {
    throw new BadRequestError(message, details);
  }

  protected conflict(message: string): never {
    throw new ConflictError(message);
  }

  protected notFound(resource = "Resource"): never {
    throw new NotFoundError(resource);
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
