import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Worker } from "bullmq";

import { env } from "../../../env/env";
import { MEMORY_QUEUE_NAME } from "./memory-queue";
import { MemoryProposer } from "./memory-proposer";

@Injectable()
export class MemoryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MemoryWorker.name);
  private worker: Worker | null = null;

  constructor(private readonly proposer: MemoryProposer) {}

  onModuleInit(): void {
    if (env.nodeEnv === "test") return;
    this.worker = new Worker(
      MEMORY_QUEUE_NAME,
      async (bullJob) => {
        const proposal = readProposal(bullJob.data);
        if (!proposal) return;
        await this.proposer.propose(proposal);
      },
      { connection: { url: env.redis.url } },
    );
    this.worker.on("failed", (bullJob, error) => {
      this.logger.error(
        `Memory job ${bullJob?.id ?? "unknown"} failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

function readProposal(data: unknown): {
  workspaceId: string;
  userId: string;
  conversationId: string;
} | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (
    typeof record.workspaceId !== "string" ||
    typeof record.userId !== "string" ||
    typeof record.conversationId !== "string"
  ) {
    return null;
  }
  return {
    workspaceId: record.workspaceId,
    userId: record.userId,
    conversationId: record.conversationId,
  };
}
