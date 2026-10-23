import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Worker } from "bullmq";

import { env } from "../../../env/env";
import { CONTENT_INDEX_QUEUE_NAME } from "../../content-index/content-index.queue";
import { ChunkIngestor } from "./chunk-ingestor";

@Injectable()
export class ChunkWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChunkWorker.name);
  private worker: Worker | null = null;

  constructor(private readonly ingestor: ChunkIngestor) {}

  onModuleInit(): void {
    if (env.nodeEnv === "test") return;
    this.worker = new Worker(
      CONTENT_INDEX_QUEUE_NAME,
      async (bullJob) => {
        const request = readRequest(bullJob.data);
        if (!request) return;
        await this.ingestor.ingest(request);
      },
      { connection: { url: env.redis.url } },
    );
    this.worker.on("failed", (bullJob, error) => {
      this.logger.error(
        `Chunk job ${bullJob?.id ?? "unknown"} failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

function readRequest(data: unknown): {
  workspaceId: string;
  sourceType: "doc" | "task";
  sourceId: string;
  removed?: boolean;
} | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (
    typeof record.workspaceId !== "string" ||
    (record.sourceType !== "doc" && record.sourceType !== "task") ||
    typeof record.sourceId !== "string"
  ) {
    return null;
  }
  return {
    workspaceId: record.workspaceId,
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    removed: record.removed === true,
  };
}
