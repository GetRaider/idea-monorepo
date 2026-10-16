import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";

import type { ConversationMessageRow, JobRow } from "../../../db/schema";
import { AgentQueue } from "../queue/agent-queue";
import { AgentRunsRepository } from "../runs/agent-runs.repository";
import { JobsRepository } from "../jobs/jobs.repository";
import type { PostConversationMessageBody } from "./conversations.schema";
import { ConversationsRepository } from "./conversations.repository";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly jobs: JobsRepository,
    private readonly runs: AgentRunsRepository,
    private readonly queue: AgentQueue,
  ) {}

  async create(workspaceId: string, userId: string) {
    const conversation = await this.conversations.insertConversation(
      workspaceId,
      userId,
    );
    return { id: conversation.id };
  }

  async list(workspaceId: string, userId: string) {
    const rows = await this.conversations.listForUser(workspaceId, userId);
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      preview: row.preview,
    }));
  }

  async remove(workspaceId: string, conversationId: string) {
    await this.requireConversation(workspaceId, conversationId);
    await this.conversations.deleteConversation(conversationId);
    return { ok: true as const };
  }

  async get(workspaceId: string, conversationId: string) {
    const conversation = await this.requireConversation(workspaceId, conversationId);
    const messages = await this.conversations.listMessages(conversation.id);
    return {
      id: conversation.id,
      messages: messages.map(toMessageResponse),
    };
  }

  async postMessage(
    workspaceId: string,
    userId: string,
    conversationId: string,
    body: PostConversationMessageBody,
  ): Promise<{ created: boolean; job: JobRow }> {
    const conversation = await this.requireConversation(workspaceId, conversationId);
    const idempotencyKey = body.idempotencyKey ?? randomUUID();
    const existing = await this.jobs.findByIdempotency(
      conversation.id,
      idempotencyKey,
    );
    const job =
      existing ??
      (await this.conversations.transaction(async (tx) => {
        const raced = await this.jobs.findByIdempotency(
          conversation.id,
          idempotencyKey,
        );
        if (raced) return raced;
        const message = await this.conversations.appendMessage(
          {
            conversationId: conversation.id,
            role: "user",
            content: body.message,
          },
          tx,
        );
        const created = await this.jobs.insert(
          {
            conversationId: conversation.id,
            workspaceId: conversation.workspaceId,
            userId,
            userMessageId: message.id,
            idempotencyKey,
          },
          tx,
        );
        await this.conversations.attachJob(message.id, created.id, tx);
        await this.conversations.touch(conversation.id, tx);
        return created;
      }));

    if (job.status === "pending") await this.queue.enqueue(job.id);
    return { created: !existing, job };
  }

  async getJob(workspaceId: string, jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundException();
    if (job.workspaceId !== workspaceId) throw new ForbiddenException();
    const run = await this.runs.findLatest(job.id);
    return {
      id: job.id,
      conversationId: job.conversationId,
      status: job.status,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
      run: run
        ? {
            id: run.id,
            attempt: run.attempt,
            status: run.status,
            outcomeText: run.outcomeText,
            promptTokens: run.promptTokens,
            completionTokens: run.completionTokens,
            iterationCount: run.iterationCount,
            errorCode: run.errorCode,
            errorMessage: run.errorMessage,
          }
        : null,
    };
  }

  private async requireConversation(workspaceId: string, conversationId: string) {
    const conversation = await this.conversations.findConversation(conversationId);
    if (!conversation) throw new NotFoundException();
    if (conversation.workspaceId !== workspaceId) throw new ForbiddenException();
    return conversation;
  }
}

function toMessageResponse(message: ConversationMessageRow) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    toolCalls: message.toolCalls,
    toolCallId: message.toolCallId,
    position: message.position,
    jobId: message.jobId,
    agentRunId: message.agentRunId,
  };
}
