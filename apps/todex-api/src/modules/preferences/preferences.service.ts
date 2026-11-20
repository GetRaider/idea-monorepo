import { Inject, Injectable } from "@nestjs/common";
import type { UpdateUserPreferencesBody, UserPreferences } from "@repo/api/todex";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../db/tokens";
import { userPreferences } from "../../db/schema";

@Injectable()
export class PreferencesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async get(userId: string): Promise<UserPreferences> {
    const [row] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    if (!row) return { calendarEnabled: false };
    return { calendarEnabled: row.calendarEnabled };
  }

  async update(
    userId: string,
    body: UpdateUserPreferencesBody,
  ): Promise<UserPreferences> {
    const [row] = await this.db
      .insert(userPreferences)
      .values({ userId, calendarEnabled: body.calendarEnabled })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { calendarEnabled: body.calendarEnabled },
      })
      .returning();
    if (!row) return { calendarEnabled: body.calendarEnabled };
    return { calendarEnabled: row.calendarEnabled };
  }
}
