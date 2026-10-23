import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, cosineDistance, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { agentChunks, agentDocuments } from "../../../db/schema";
import { DRIZZLE_DB } from "../../../db/tokens";

@Injectable()
export class ChunksRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async replace(input: IndexedSource): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(agentDocuments)
        .where(
          and(
            eq(agentDocuments.workspaceId, input.workspaceId),
            eq(agentDocuments.sourceType, input.sourceType),
            eq(agentDocuments.sourceId, input.sourceId),
          ),
        );
      const documentId = randomUUID();
      await tx.insert(agentDocuments).values({
        id: documentId,
        workspaceId: input.workspaceId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
      });
      if (input.chunks.length === 0) return;
      await tx.insert(agentChunks).values(
        input.chunks.map((chunk, position) => ({
          id: randomUUID(),
          documentId,
          position,
          content: chunk.content,
          embedding: chunk.embedding,
        })),
      );
    });
  }

  async search(
    workspaceId: string,
    embedding: number[],
    limit: number,
  ): Promise<RetrievedChunk[]> {
    const distance = cosineDistance(agentChunks.embedding, embedding);
    return this.db
      .select({
        title: agentDocuments.title,
        sourceType: agentDocuments.sourceType,
        sourceId: agentDocuments.sourceId,
        content: agentChunks.content,
      })
      .from(agentChunks)
      .innerJoin(agentDocuments, eq(agentChunks.documentId, agentDocuments.id))
      .where(eq(agentDocuments.workspaceId, workspaceId))
      .orderBy(distance)
      .limit(limit);
  }

  async remove(
    workspaceId: string,
    sourceType: "doc" | "task",
    sourceId: string,
  ): Promise<void> {
    await this.db
      .delete(agentDocuments)
      .where(
        and(
          eq(agentDocuments.workspaceId, workspaceId),
          eq(agentDocuments.sourceType, sourceType),
          eq(agentDocuments.sourceId, sourceId),
        ),
      );
  }
}

export interface RetrievedChunk {
  title: string;
  sourceType: "doc" | "task";
  sourceId: string;
  content: string;
}

interface IndexedSource {
  workspaceId: string;
  sourceType: "doc" | "task";
  sourceId: string;
  title: string;
  chunks: { content: string; embedding: number[] }[];
}
