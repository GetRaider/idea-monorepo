import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../../db/tokens";
import {
  conversationMessages,
  conversations,
  jobs,
  type ConversationMessageRow,
  type ConversationRow,
} from "../../../db/schema";
import type { LlmToolCall } from "../llm/llm-client";

@Injectable()
export class ConversationsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async insertConversation(
    workspaceId: string,
    userId: string,
  ): Promise<ConversationRow> {
    const now = new Date();
    const [row] = await this.db
      .insert(conversations)
      .values({
        id: randomUUID(),
        workspaceId,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) throw new Error("Failed to insert conversation");
    return row;
  }

  async listForUser(
    workspaceId: string,
    userId: string,
  ): Promise<ConversationSummary[]> {
    return this.db
      .select({
        id: conversations.id,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        preview: sql<string | null>`(
          select ${conversationMessages.content}
          from ${conversationMessages}
          where ${conversationMessages.conversationId} = ${conversations.id}
            and ${conversationMessages.role} = 'user'
          order by ${conversationMessages.position}
          limit 1
        )`,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.userId, userId),
        ),
      )
      .orderBy(desc(conversations.updatedAt));
  }

  async deleteConversation(id: string): Promise<void> {
    await this.transaction(async (tx) => {
      await tx.delete(jobs).where(eq(jobs.conversationId, id));
      await tx.delete(conversations).where(eq(conversations.id, id));
    });
  }

  async touch(id: string, executor?: NodePgDatabase): Promise<void> {
    const db = executor ?? this.db;
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async findConversation(id: string): Promise<ConversationRow | null> {
    const [row] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return row ?? null;
  }

  async transaction<T>(fn: (tx: NodePgDatabase) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(tx as unknown as NodePgDatabase));
  }

  async listMessages(conversationId: string): Promise<ConversationMessageRow[]> {
    return this.db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(conversationMessages.position);
  }

  async appendMessage(
    input: NewConversationMessage,
    executor?: NodePgDatabase,
  ): Promise<ConversationMessageRow> {
    if (!executor) {
      return this.transaction((tx) => this.insertMessage(tx, input));
    }
    return this.insertMessage(executor, input);
  }

  async attachJob(
    messageId: string,
    jobId: string,
    executor?: NodePgDatabase,
  ): Promise<void> {
    const db = executor ?? this.db;
    await db
      .update(conversationMessages)
      .set({ jobId })
      .where(
        and(
          eq(conversationMessages.id, messageId),
          sql`${conversationMessages.jobId} is null`,
        ),
      );
  }

  private async insertMessage(
    tx: NodePgDatabase,
    input: NewConversationMessage,
  ): Promise<ConversationMessageRow> {
    await tx.execute(
      sql`select id from conversations where id = ${input.conversationId} for update`,
    );
    const [current] = await tx
      .select({
        value: sql<number>`coalesce(max(${conversationMessages.position}), -1)`,
      })
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, input.conversationId));
    const [row] = await tx
      .insert(conversationMessages)
      .values({
        id: randomUUID(),
        conversationId: input.conversationId,
        jobId: input.jobId ?? null,
        agentRunId: input.agentRunId ?? null,
        position: Number(current?.value ?? -1) + 1,
        role: input.role,
        content: input.content,
        toolCalls: input.toolCalls ?? null,
        toolCallId: input.toolCallId ?? null,
        createdAt: new Date(),
      })
      .returning();
    if (!row) throw new Error("Failed to append conversation message");
    return row;
  }
}

export interface ConversationSummary {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  preview: string | null;
}

export interface NewConversationMessage {
  conversationId: string;
  jobId?: string | null;
  agentRunId?: string | null;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: LlmToolCall[] | null;
  toolCallId?: string | null;
}
