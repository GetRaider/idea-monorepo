import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

import { AGENT_CHUNK_EMBEDDING_DIMENSIONS } from "../../../db/schema";
import { env } from "../../../env/env";
import type { EmbeddingClient } from "./embedding-client";

export function embeddingClientConfig(baseUrl: string): {
  apiKey: string;
  baseURL: string;
} {
  return { apiKey: "ollama", baseURL: baseUrl };
}

@Injectable()
export class OpenAiCompatibleEmbeddingClient implements EmbeddingClient {
  private readonly client = new OpenAI({
    ...embeddingClientConfig(env.ai.baseUrl),
    timeout: 60_000,
    maxRetries: 1,
  });

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      model: env.ai.embeddingModel,
      input: texts,
    });
    const ordered = [...response.data].sort(
      (left, right) => left.index - right.index,
    );
    return ordered.map((item) => {
      if (item.embedding.length !== AGENT_CHUNK_EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding length ${item.embedding.length} does not match ${AGENT_CHUNK_EMBEDDING_DIMENSIONS}`,
        );
      }
      return item.embedding;
    });
  }
}
