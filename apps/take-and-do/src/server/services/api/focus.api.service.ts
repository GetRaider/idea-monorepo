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

      await this.upsertState(access, merged, existing);
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
      const next = this.applyStateUpdate(base, input);

      await this.upsertState(access, next, existing);
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

  private applyStateUpdate(
    base: FocusStatePayload,
    input: UpdateFocusStateInput,
  ): FocusStatePayload {
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
      nextBacklog = this.mergeEntities(base.backlog, [input.appendBacklogItem]);
    }

    return { sessions: nextSessions, backlog: nextBacklog };
  }

  private async upsertState(
    access: DataAccess,
    payload: FocusStatePayload,
    existing: FocusStatePayload | null,
  ): Promise<void> {
    const now = new Date();

    if (!existing) {
      await this.db.insert(focusStateTable).values({
        userId: access.userId,
        sessions: payload.sessions,
        backlog: payload.backlog,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    await this.db
      .update(focusStateTable)
      .set({
        sessions: payload.sessions,
        backlog: payload.backlog,
        updatedAt: now,
      })
      .where(eq(focusStateTable.userId, access.userId));
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
