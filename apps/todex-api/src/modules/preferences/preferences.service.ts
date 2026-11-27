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
    return toPreferences(row ?? DEFAULTS);
  }

  async update(
    userId: string,
    body: UpdateUserPreferencesBody,
  ): Promise<UserPreferences> {
    const [row] = await this.db
      .insert(userPreferences)
      .values({ userId, ...body })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: body,
      })
      .returning();
    return toPreferences(row ?? { ...DEFAULTS, ...body });
  }
}

/** Every module is hidden until the user turns it on. */
const DEFAULTS: UserPreferences = {
  calendarEnabled: false,
  countersEnabled: false,
};

function toPreferences(row: UserPreferences): UserPreferences {
  return {
    calendarEnabled: row.calendarEnabled,
    countersEnabled: row.countersEnabled,
  };
}
