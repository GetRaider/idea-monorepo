import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

import { env } from "../../env/env";

const CONTENT_INDEX_QUEUE_NAME = "agent-chunks";

@Injectable()
export class ContentIndexQueue implements OnModuleDestroy {
  private readonly logger = new Logger(ContentIndexQueue.name);
  private readonly queue =
    env.nodeEnv === "test"
      ? null
      : new Queue(CONTENT_INDEX_QUEUE_NAME, { connection: { url: env.redis.url } });

  async enqueue(input: ContentIndexJob): Promise<void> {
    if (!this.queue) return;
    try {
      await this.queue.add("index", input, {
        jobId: `${input.sourceType}-${input.sourceId}`,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already exists/i.test(message)) return;
      this.logger.error(
        `Failed to enqueue ${input.sourceType} ${input.sourceId}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}

export { CONTENT_INDEX_QUEUE_NAME };

interface ContentIndexJob {
  workspaceId: string;
  sourceType: "doc" | "task";
  sourceId: string;
  removed?: boolean;
}
