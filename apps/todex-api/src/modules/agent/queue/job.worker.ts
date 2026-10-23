import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { UnrecoverableError, Worker } from "bullmq";

import { env } from "../../../env/env";
import { ConversationNamer } from "../conversations/conversation-namer";
import { JobsRepository } from "../jobs/jobs.repository";
import { MemoryQueue } from "../memories/memory-queue";
import { AgentOrchestrator } from "../orchestrator/agent-orchestrator";
import { AgentRunsRepository } from "../runs/agent-runs.repository";
import { QUEUE_NAME } from "./agent-queue";

@Injectable()
export class JobWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly jobs: JobsRepository,
    private readonly runs: AgentRunsRepository,
    private readonly orchestrator: AgentOrchestrator,
    private readonly memories: MemoryQueue,
    private readonly namer: ConversationNamer,
  ) {}

  onModuleInit(): void {
    if (env.nodeEnv === "test") return;
    this.worker = new Worker(
      QUEUE_NAME,
      async (bullJob) => {
        const jobId = readJobId(bullJob.data);
        if (!jobId) return;
        await this.process(jobId);
      },
      { connection: { url: env.redis.url } },
    );
    this.worker.on("failed", (bullJob, error) => {
      this.logger.error(
        `Agent job ${bullJob?.id ?? "unknown"} failed: ${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async process(jobId: string): Promise<void> {
    const job = await this.jobs.findById(jobId);
    if (!job || job.status === "failed" || job.status === "awaiting_confirmation") return;
    if (job.status === "completed") {
      await this.name(job.conversationId);
      await this.memories.enqueue({
        jobId: job.id,
        conversationId: job.conversationId,
        workspaceId: job.workspaceId,
        userId: job.userId,
      });
      return;
    }

    await this.name(job.conversationId);

    const running =
      job.status === "running" ? job : await this.jobs.markRunning(job.id);
    if (!running) return;

    await this.runs.failOpenRuns(running.id);
    const attempt = await this.runs.nextAttempt(running.id);
    const run = await this.runs.insert({
      jobId: running.id,
      attempt,
      model: env.ai.model,
      maxIterations: env.agent.maxIterations,
      maxDurationMs: env.agent.maxDurationMs,
      maxTokens: env.agent.maxTokens,
    });

    try {
      await this.orchestrator.execute(running, run);
    } catch (error) {
      if (error instanceof UnrecoverableError) throw error;
      const message = error instanceof Error ? error.message : "worker_failed";
      await this.runs.fail(run.id, "worker_failed", message);
      throw error;
    } finally {
      await this.name(running.conversationId);
    }

    const finished = await this.jobs.findById(running.id);
    if (finished?.status !== "completed") return;
    await this.memories.enqueue({
      jobId: running.id,
      conversationId: running.conversationId,
      workspaceId: running.workspaceId,
      userId: running.userId,
    });
  }

  private async name(conversationId: string): Promise<void> {
    try {
      await this.namer.nameIfMissing(conversationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "title_failed";
      this.logger.warn(`Conversation ${conversationId} title failed: ${message}`);
    }
  }
}

function readJobId(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("jobId" in data)) return null;
  const jobId = data.jobId;
  return typeof jobId === "string" ? jobId : null;
}
