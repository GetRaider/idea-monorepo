import { describe, expect, it, vi } from "vitest";

import { ConversationsService } from "./conversations.service";

describe("ConversationsService idempotency", () => {
  it("does not insert a second job for the same conversation key", async () => {
    const existing = {
      id: "job-1",
      conversationId: "conversation-1",
      status: "completed" as const,
    };
    const jobs = {
      findAwaitingConfirmation: vi.fn(async () => null),
      findByIdempotency: vi.fn(async (conversationId: string) => {
        if (conversationId === "conversation-1") return existing;
        return null;
      }),
      insert: vi.fn(async () => ({
        id: "job-2",
        conversationId: "conversation-2",
        status: "pending" as const,
      })),
    };
    const conversations = {
      findConversation: vi.fn(async (id: string) => ({
        id,
        workspaceId: "workspace-1",
        userId: "user-1",
      })),
      transaction: vi.fn(async (fn: (tx: object) => Promise<unknown>) => fn({})),
      appendMessage: vi.fn(async () => ({ id: "message-2" })),
      attachJob: vi.fn(),
      touch: vi.fn(),
    };
    const service = new ConversationsService(
      conversations as never,
      jobs as never,
      {} as never,
      { enqueue: vi.fn() } as never,
      { grant: vi.fn() } as never,
    );

    const first = await service.postMessage(
      "workspace-1",
      "user-1",
      "conversation-1",
      { message: "Create a task", idempotencyKey: "same-key" },
    );
    expect(first.created).toBe(false);
    expect(first.job.id).toBe("job-1");
    expect(jobs.insert).not.toHaveBeenCalled();

    const second = await service.postMessage(
      "workspace-1",
      "user-1",
      "conversation-2",
      { message: "Create a task", idempotencyKey: "same-key", mode: "ask" },
    );
    expect(second.created).toBe(true);
    expect(jobs.insert).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "ask", webResearch: false }),
      expect.anything(),
    );

    await service.postMessage("workspace-1", "user-1", "conversation-1", {
      message: "Create a task",
      idempotencyKey: "same-key",
      webResearch: true,
    });
    expect(jobs.insert).toHaveBeenCalledTimes(1);
  });

  it("stores an explicit web research flag", async () => {
    const jobs = {
      findAwaitingConfirmation: vi.fn(async () => null),
      findByIdempotency: vi.fn(async () => null),
      insert: vi.fn(async () => ({
        id: "job-3",
        conversationId: "conversation-3",
        status: "pending" as const,
      })),
    };
    const conversations = {
      findConversation: vi.fn(async (id: string) => ({
        id,
        workspaceId: "workspace-1",
        userId: "user-1",
      })),
      transaction: vi.fn(async (fn: (tx: object) => Promise<unknown>) => fn({})),
      appendMessage: vi.fn(async () => ({ id: "message-3" })),
      attachJob: vi.fn(),
      touch: vi.fn(),
    };
    const service = new ConversationsService(
      conversations as never,
      jobs as never,
      {} as never,
      { enqueue: vi.fn() } as never,
      { grant: vi.fn() } as never,
    );
    await service.postMessage("workspace-1", "user-1", "conversation-3", {
      message: "Look this up",
      webResearch: true,
    });
    expect(jobs.insert).toHaveBeenCalledWith(
      expect.objectContaining({ webResearch: true }),
      expect.anything(),
    );
  });
});
