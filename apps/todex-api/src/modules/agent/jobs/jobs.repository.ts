import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../../db/tokens";
import { jobs, type JobRow } from "../../../db/schema";

@Injectable()
export class JobsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async insert(input: NewJob, executor?: NodePgDatabase): Promise<JobRow> {
    const db = executor ?? this.db;
    const now = new Date();
    const [row] = await db
      .insert(jobs)
      .values({
        id: input.id ?? randomUUID(),
        conversationId: input.conversationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        userMessageId: input.userMessageId,
        status: "pending",
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) throw new Error("Failed to insert job");
    return row;
  }

  async findById(id: string): Promise<JobRow | null> {
    const [row] = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByIdempotency(
    conversationId: string,
    idempotencyKey: string,
  ): Promise<JobRow | null> {
    const [row] = await this.db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.conversationId, conversationId),
          eq(jobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async markRunning(id: string): Promise<JobRow | null> {
    const now = new Date();
    const [row] = await this.db
      .update(jobs)
      .set({ status: "running", startedAt: now, updatedAt: now })
      .where(and(eq(jobs.id, id), eq(jobs.status, "pending")))
      .returning();
    return row ?? null;
  }

  async markCompleted(id: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(jobs)
      .set({
        status: "completed",
        finishedAt: now,
        updatedAt: now,
        errorCode: null,
        errorMessage: null,
      })
      .where(and(eq(jobs.id, id), eq(jobs.status, "running")));
  }

  async markFailed(id: string, errorCode: string, errorMessage: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(jobs)
      .set({
        status: "failed",
        errorCode,
        errorMessage,
        finishedAt: now,
        updatedAt: now,
      })
      .where(and(eq(jobs.id, id), eq(jobs.status, "running")));
  }
}

export interface NewJob {
  id?: string;
  conversationId: string;
  workspaceId: string;
  userId: string;
  userMessageId: string;
  idempotencyKey: string;
}
