import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

import { env } from "../../../env/env";

const QUEUE_NAME = "agent-jobs";

@Injectable()
export class AgentQueue implements OnModuleDestroy {
  private readonly logger = new Logger(AgentQueue.name);
  private readonly queue =
    env.nodeEnv === "test"
      ? null
      : new Queue(QUEUE_NAME, { connection: { url: env.redis.url } });

  async enqueue(jobId: string): Promise<void> {
    if (!this.queue) return;
    try {
      await this.queue.add(
        "run",
        { jobId },
        {
          jobId,
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/already exists/i.test(message)) return;
      this.logger.error(`Failed to enqueue job ${jobId}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}

export { QUEUE_NAME };
