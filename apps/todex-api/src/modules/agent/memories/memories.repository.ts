import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { agentMemories, type AgentMemoryRow } from "../../../db/schema";
import { DRIZZLE_DB } from "../../../db/tokens";

@Injectable()
export class MemoriesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async listByWorkspace(workspaceId: string): Promise<AgentMemoryRow[]> {
    return this.db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.workspaceId, workspaceId))
      .orderBy(asc(agentMemories.createdAt));
  }

  async insertMany(inputs: NewMemory[]): Promise<void> {
    if (inputs.length === 0) return;
    const now = new Date();
    await this.db
      .insert(agentMemories)
      .values(
        inputs.map((input) => ({
          id: randomUUID(),
          workspaceId: input.workspaceId,
          userId: input.userId,
          conversationId: input.conversationId,
          content: input.content,
          createdAt: now,
        })),
      )
      .onConflictDoNothing();
  }
}

interface NewMemory {
  workspaceId: string;
  userId: string;
  conversationId: string;
  content: string;
}
