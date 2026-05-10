import { and, eq } from "drizzle-orm";

import type { DB } from "@/db/client";
import { account, googleCalendarIntegration } from "@/db/schema";

import { BaseApiService } from "./base.api.service";

export class GoogleCalendarIntegrationApiService extends BaseApiService {
  constructor(db: DB) {
    super(db);
  }

  async getStatus(userId: string): Promise<{
    connected: boolean;
    enabled: boolean;
    lastSyncAt: Date | null;
  }> {
    const [googleAccount] = await this.db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
      .limit(1);

    const [row] = await this.db
      .select({
        enabled: googleCalendarIntegration.enabled,
        lastSyncAt: googleCalendarIntegration.lastSyncAt,
      })
      .from(googleCalendarIntegration)
      .where(eq(googleCalendarIntegration.userId, userId))
      .limit(1);

    return {
      connected: !!googleAccount,
      enabled: row?.enabled ?? false,
      lastSyncAt: row?.lastSyncAt ?? null,
    };
  }

  async setEnabled(
    userId: string,
    enabled: boolean,
  ): Promise<{ enabled: boolean }> {
    const [existing] = await this.db
      .select({ userId: googleCalendarIntegration.userId })
      .from(googleCalendarIntegration)
      .where(eq(googleCalendarIntegration.userId, userId))
      .limit(1);

    if (!existing) {
      await this.db.insert(googleCalendarIntegration).values({
        userId,
        enabled,
        updatedAt: new Date(),
      });
      return { enabled };
    }

    await this.db
      .update(googleCalendarIntegration)
      .set({
        enabled,
        ...(enabled ? {} : { syncToken: null }),
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarIntegration.userId, userId));

    return { enabled };
  }

  async getSyncState(userId: string): Promise<{
    enabled: boolean;
    calendarId: string;
    syncToken: string | null;
  }> {
    const [row] = await this.db
      .select({
        enabled: googleCalendarIntegration.enabled,
        calendarId: googleCalendarIntegration.calendarId,
        syncToken: googleCalendarIntegration.syncToken,
      })
      .from(googleCalendarIntegration)
      .where(eq(googleCalendarIntegration.userId, userId))
      .limit(1);

    return {
      enabled: row?.enabled ?? false,
      calendarId: row?.calendarId ?? "primary",
      syncToken: row?.syncToken ?? null,
    };
  }

  async upsertSyncResult(params: {
    userId: string;
    nextSyncToken: string | null;
    lastSyncAt: Date;
  }): Promise<void> {
    const [existing] = await this.db
      .select({ userId: googleCalendarIntegration.userId })
      .from(googleCalendarIntegration)
      .where(eq(googleCalendarIntegration.userId, params.userId))
      .limit(1);

    if (!existing) {
      await this.db.insert(googleCalendarIntegration).values({
        userId: params.userId,
        enabled: true,
        syncToken: params.nextSyncToken,
        lastSyncAt: params.lastSyncAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    }

    await this.db
      .update(googleCalendarIntegration)
      .set({
        syncToken: params.nextSyncToken,
        lastSyncAt: params.lastSyncAt,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarIntegration.userId, params.userId));
  }

  async clearIntegration(userId: string): Promise<void> {
    await this.db
      .update(googleCalendarIntegration)
      .set({
        enabled: false,
        syncToken: null,
        lastSyncAt: null,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarIntegration.userId, userId));
  }
}
