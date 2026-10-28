import { Inject, Injectable } from "@nestjs/common";

import { ChunksRepository } from "../agent/chunks/chunks.repository";
import {
  EMBEDDING_CLIENT,
  type EmbeddingClient,
} from "../agent/llm/embedding-client";

@Injectable()
export class KnowledgeSearch {
  constructor(
    private readonly chunks: ChunksRepository,
    @Inject(EMBEDDING_CLIENT) private readonly embeddings: EmbeddingClient,
  ) {}

  async search(workspaceId: string, query: string): Promise<KnowledgeHit[]> {
    let embedding: number[] | undefined;
    try {
      [embedding] = await this.embeddings.embed([query]);
    } catch {
      throw new KnowledgeSearchError();
    }
    if (!embedding) throw new KnowledgeSearchError();
    const rows = await this.chunks.search(workspaceId, embedding, 8);
    return rows
      .filter((row) => row.sourceType === "doc")
      .map((row) => ({
        title: row.title,
        sourceId: row.sourceId,
        snippet: row.content.slice(0, 500),
      }));
  }
}

export class KnowledgeSearchError extends Error {
  constructor() {
    super("Knowledge search unavailable");
  }
}

export interface KnowledgeHit {
  title: string;
  sourceId: string;
  snippet: string;
}
