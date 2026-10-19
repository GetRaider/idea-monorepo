import { describe, expect, it, vi } from "vitest";

import type { ConversationMessageRow } from "../../../db/schema";
import type { ConversationsRepository } from "../conversations/conversations.repository";
import { ContextService } from "./context.service";

describe("ContextService", () => {
  it("drops the oldest tool results and keeps earlier turns", async () => {
    const { context, listMessages } = service([
      message("m1", "job-1", "user", "First turn", 0),
      message("m2", "job-1", "tool", "x".repeat(400), 1),
      message("m3", "job-2", "user", "Second turn", 2),
    ]);
    const assembled = await context.assemble("conversation-1", 80);

    expect(listMessages).toHaveBeenCalledWith("conversation-1");

    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.messages.map((entry) => entry.role)).toEqual([
      "system",
      "user",
      "user",
    ]);
    expect(assembled.messages[1]?.content).toBe("First turn");
    expect(assembled.messages[2]?.content).toBe("Second turn");
  });

  it("reports a token limit when the latest user message cannot fit", async () => {
    const { context } = service([message("m1", "job-1", "user", "y".repeat(5000), 0)]);
    const assembled = await context.assemble("conversation-1", 10);
    expect(assembled.ok).toBe(false);
  });
});

function service(history: ConversationMessageRow[]) {
  const listMessages = vi.fn(async () => history);
  const context = new ContextService({
    listMessages,
  } as unknown as ConversationsRepository);
  return { context, listMessages };
}

function message(
  id: string,
  jobId: string,
  role: string,
  content: string,
  position: number,
): ConversationMessageRow {
  return {
    id,
    conversationId: "conversation-1",
    jobId,
    agentRunId: null,
    position,
    role,
    content,
    toolCalls: null,
    toolCallId: null,
    createdAt: new Date(),
  };
}
