import { Inject, Injectable } from "@nestjs/common";

import { DocsService } from "../../docs/docs.service";
import { TasksService } from "../../tasks/tasks.service";
import { EMBEDDING_CLIENT, type EmbeddingClient } from "../llm/embedding-client";
import { splitText } from "./chunk-text";
import { ChunksRepository } from "./chunks.repository";

@Injectable()
export class ChunkIngestor {
  constructor(
    private readonly docs: DocsService,
    private readonly tasks: TasksService,
    private readonly chunks: ChunksRepository,
    @Inject(EMBEDDING_CLIENT) private readonly embeddings: EmbeddingClient,
  ) {}

  async ingest(input: IndexRequest): Promise<void> {
    if (input.removed) {
      await this.chunks.remove(input.workspaceId, input.sourceType, input.sourceId);
      return;
    }
    const source =
      input.sourceType === "doc"
        ? await this.docs.readIndexText(input.workspaceId, input.sourceId)
        : await this.tasks.readIndexText(input.workspaceId, input.sourceId);
    if (!source) {
      await this.chunks.remove(input.workspaceId, input.sourceType, input.sourceId);
      return;
    }
    const pieces = splitText(source.text);
    const embeddings = await this.embeddings.embed(pieces);
    if (embeddings.length !== pieces.length) {
      throw new Error("Embedding count does not match chunk count");
    }
    await this.chunks.replace({
      workspaceId: input.workspaceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: source.title,
      chunks: pieces.map((content, index) => ({
        content,
        embedding: embeddings[index],
      })),
    });
  }
}

interface IndexRequest {
  workspaceId: string;
  sourceType: "doc" | "task";
  sourceId: string;
  removed?: boolean;
}
