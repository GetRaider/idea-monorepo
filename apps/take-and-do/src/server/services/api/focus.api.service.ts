import { eq } from "drizzle-orm";

import { DB } from "@/db/client";
import { focusStateTable } from "@/db/schemas";
import type {
  CreateFocusStateInput,
  UpdateFocusStateInput,
} from "@/db/dtos/focus.dto";
import {
  BaseApiService,
  DataAccess,
} from "@/server/services/api/base.api.service";
import type { FocusBacklogItem, FocusSessionRecord } from "@/types/focus.types";

type FocusStatePayload = {
  sessions: FocusSessionRecord[];
  backlog: FocusBacklogItem[];
};

export class FocusApiService extends BaseApiService {
  constructor(protected readonly db: DB) {
    super(db);
  }

  async getState(access: DataAccess): Promise<FocusStatePayload | null> {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return null;

      const rows = await this.db
        .select()
        .from(focusStateTable)
        .where(eq(focusStateTable.userId, access.userId))
        .limit(1);

      if (rows.length === 0) return null;

      const firstRow = rows[0];
      return {
        sessions: this.parse(firstRow.sessions),
        backlog: this.parse(firstRow.backlog),
      };
    });
  }

  async createState(
    input: CreateFocusStateInput,
    access: DataAccess,
  ): Promise<FocusStatePayload> {
    return this.handleOperation(async () => {
      if (access.isAnonymous) {
        throw new Error("Guest users cannot persist focus state");
      }

      const existing = await this.getState(access);
      const merged = this.mergeState(existing, {
        sessions: input.sessions ?? [],
        backlog: input.backlog ?? [],
      });

      if (!existing) {
        await this.db.insert(focusStateTable).values({
          userId: access.userId,
          sessions: merged.sessions,
          backlog: merged.backlog,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await this.db
          .update(focusStateTable)
          .set({
            sessions: merged.sessions,
            backlog: merged.backlog,
            updatedAt: new Date(),
          })
          .where(eq(focusStateTable.userId, access.userId));
      }

      return merged;
    });
  }

  async updateState(
    input: UpdateFocusStateInput,
    access: DataAccess,
  ): Promise<FocusStatePayload> {
    return this.handleOperation(async () => {
      if (access.isAnonymous) {
        throw new Error("Guest users cannot persist focus state");
      }

      const existing = await this.getState(access);
      const base: FocusStatePayload = existing ?? { sessions: [], backlog: [] };

      let nextSessions = base.sessions;
      let nextBacklog = base.backlog;

      if (input.sessions !== undefined) {
        nextSessions = this.mergeEntities(base.sessions, input.sessions);
      } else if (input.appendSession) {
        nextSessions = this.mergeEntities(base.sessions, [input.appendSession]);
      }

      if (input.backlog !== undefined) {
        nextBacklog = this.mergeEntities(base.backlog, input.backlog);
      } else if (input.appendBacklogItem) {
        nextBacklog = this.mergeEntities(base.backlog, [
          input.appendBacklogItem,
        ]);
      }

      const next: FocusStatePayload = {
        sessions: nextSessions,
        backlog: nextBacklog,
      };

      if (!existing) {
        await this.db.insert(focusStateTable).values({
          userId: access.userId,
          sessions: next.sessions,
          backlog: next.backlog,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await this.db
          .update(focusStateTable)
          .set({
            sessions: next.sessions,
            backlog: next.backlog,
            updatedAt: new Date(),
          })
          .where(eq(focusStateTable.userId, access.userId));
      }

      return next;
    });
  }

  async deleteState(access: DataAccess): Promise<void> {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return;

      await this.db
        .delete(focusStateTable)
        .where(eq(focusStateTable.userId, access.userId));
    });
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Guest users cannot persist focus state") {
      this.badRequest(message);
    }
    throw error;
  }

  private mergeEntities<E extends { id: string }>(
    existing: E[],
    incoming: E[],
  ): E[] {
    const entitiesMapById = new Map(existing.map((item) => [item.id, item]));
    for (const item of incoming) {
      entitiesMapById.set(item.id, item);
    }
    return [...entitiesMapById.values()];
  }

  private mergeState(
    existing: FocusStatePayload | null,
    incoming: FocusStatePayload,
  ): FocusStatePayload {
    if (!existing) return incoming;
    return {
      sessions: this.mergeEntities(existing.sessions, incoming.sessions),
      backlog: this.mergeEntities(existing.backlog, incoming.backlog),
    };
  }

  private parse<R>(value: unknown): R[] {
    if (!Array.isArray(value)) return [];
    return value as R[];
  }
}
