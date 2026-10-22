import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

import { env } from "../../../env/env";

const MEMORY_QUEUE_NAME = "agent-memories";

@Injectable()
export class MemoryQueue implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryQueue.name);
  private readonly queue =
    env.nodeEnv === "test"
      ? null
      : new Queue(MEMORY_QUEUE_NAME, { connection: { url: env.redis.url } });

  async enqueue(input: MemoryJob): Promise<void> {
    if (!this.queue) return;
    try {
      await this.queue.add("propose", input, {
        jobId: `memory:${input.jobId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already exists/i.test(message)) return;
      this.logger.error(`Failed to enqueue memory job ${input.jobId}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}

export { MEMORY_QUEUE_NAME };

interface MemoryJob {
  jobId: string;
  conversationId: string;
  workspaceId: string;
  userId: string;
}
