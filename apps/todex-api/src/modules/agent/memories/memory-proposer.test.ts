import { describe, expect, it, vi } from "vitest";

import type { ConversationMessageRow } from "../../../db/schema";
import { MemoryProposer } from "./memory-proposer";

describe("MemoryProposer", () => {
  it("stores new memories and skips ones the workspace already has", async () => {
    const insertMany = vi.fn();
    const complete = vi.fn(async () => ({
      content: '["User prefers Europe/Warsaw", "User prefers Europe/Warsaw", "Already known"]',
      toolCalls: [],
      promptTokens: 1,
      completionTokens: 1,
      model: "llama3.1:8b",
      citations: [],
    }));
    const proposer = new MemoryProposer(
      {
        listMessages: vi.fn(async () => [message("user", "I live in Warsaw")]),
      } as never,
      {
        listByWorkspace: vi.fn(async () => [{ content: "Already known" }]),
        insertMany,
      } as never,
      { complete },
    );

    await proposer.propose({
      workspaceId: "workspace-1",
      userId: "user-1",
      conversationId: "conversation-1",
    });

    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ tools: [] }),
    );
    expect(insertMany).toHaveBeenCalledWith([
      {
        workspaceId: "workspace-1",
        userId: "user-1",
        conversationId: "conversation-1",
        content: "User prefers Europe/Warsaw",
      },
    ]);
  });

  it("stores nothing when the model does not return a list", async () => {
    const insertMany = vi.fn();
    const proposer = new MemoryProposer(
      { listMessages: vi.fn(async () => []) } as never,
      { listByWorkspace: vi.fn(), insertMany } as never,
      {
        complete: vi.fn(async () => ({
          content: "Nothing to save.",
          toolCalls: [],
          promptTokens: 1,
          completionTokens: 1,
          model: "llama3.1:8b",
          citations: [],
        })),
      },
    );

    await proposer.propose({
      workspaceId: "workspace-1",
      userId: "user-1",
      conversationId: "conversation-1",
    });

    expect(insertMany).not.toHaveBeenCalled();
  });
});

function message(role: string, content: string): ConversationMessageRow {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    jobId: "job-1",
    agentRunId: null,
    position: 0,
    role,
    content,
    toolCalls: null,
    toolCallId: null,
    citations: null,
    providerItems: null,
    createdAt: new Date(),
  };
}
