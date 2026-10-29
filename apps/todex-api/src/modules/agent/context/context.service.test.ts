import { describe, expect, it, vi } from "vitest";

import type { AgentMemoryRow, ConversationMessageRow } from "../../../db/schema";
import type { RetrievedChunk } from "../chunks/chunks.repository";
import type { ConversationsRepository } from "../conversations/conversations.repository";
import type { MemoriesRepository } from "../memories/memories.repository";
import { ContextService } from "./context.service";

describe("ContextService", () => {
  it("drops the oldest tool results and keeps earlier turns", async () => {
    const { context, listMessages } = service([
      message("m1", "job-1", "user", "First turn", 0),
      message("m2", "job-1", "tool", "x".repeat(400), 1),
      message("m3", "job-2", "user", "Second turn", 2),
    ]);
    const assembled = await context.assemble("conversation-1", "workspace-1", 140);

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
    const assembled = await context.assemble("conversation-1", "workspace-1", 10);
    expect(assembled.ok).toBe(false);
  });

  it("places a workspace memory between the system prompt and the transcript", async () => {
    const { context } = service(
      [message("m1", "job-1", "user", "Hi", 0)],
      [memory("User prefers Europe/Warsaw")],
    );

    const assembled = await context.assemble("conversation-1", "workspace-1", 8000);

    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.messages.map((entry) => entry.role)).toEqual([
      "system",
      "system",
      "user",
    ]);
    expect(assembled.messages[1]?.content).toContain("User prefers Europe/Warsaw");
  });

  it("tells an ask run that it cannot change data", async () => {
    const { context } = service([message("m1", "job-1", "user", "Hi", 0)]);
    const assembled = await context.assemble("conversation-1", "workspace-1", 8000, "ask");
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.messages[0]?.content).toContain("This run cannot change workspace data");
    expect(assembled.messages[0]?.content).toContain("Do not search the web");
  });

  it("adds the search line for the stored capability without copying the whole prompt", async () => {
    const { context } = service([message("m1", "job-1", "user", "Hi", 0)]);
    const native = await context.assemble("conversation-1", "workspace-1", 8000, "execute", {
      webResearch: true,
      capability: "native",
    });
    const tool = await context.assemble("conversation-1", "workspace-1", 8000, "execute", {
      webResearch: true,
      capability: "tool",
    });
    expect(native.ok && tool.ok).toBe(true);
    if (!native.ok || !tool.ok) return;
    expect(native.messages[0]?.content).toContain("Write tools pause until the user confirms");
    expect(native.messages[0]?.content).toContain("You may search the web");
    expect(tool.messages[0]?.content).toContain("You may call web_search");
  });

  it("drops a memory that does not fit and keeps the user message", async () => {
    const remembered = memory("m".repeat(400));
    const { context, listByWorkspace } = service(
      [message("m1", "job-1", "user", "Hi", 0)],
      [remembered],
    );

    const assembled = await context.assemble("conversation-1", "workspace-1", 80);

    expect(listByWorkspace).toHaveBeenCalledWith("workspace-1");
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.messages.map((entry) => entry.content)).toEqual([
      expect.stringContaining("Todex workspace agent"),
      "Hi",
    ]);
  });

  it("places the closest chunk after memories and drops a worse one that does not fit", async () => {
    const { context, embed, search } = service(
      [message("m1", "job-1", "user", "Hi", 0)],
      [memory("Keep this")],
      [
        chunk("doc-1", "Doc #1", "Ship notes"),
        chunk("doc-2", "Doc #2", "z".repeat(400)),
      ],
    );

    const assembled = await context.assemble("conversation-1", "workspace-1", 120);

    expect(embed).toHaveBeenCalledWith(["Hi"]);
    expect(search).toHaveBeenCalledWith("workspace-1", [0.2], 8);
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.messages.map((entry) => entry.content)).toEqual([
      expect.stringContaining("Todex workspace agent"),
      expect.stringContaining("Keep this"),
      expect.stringContaining("Ship notes"),
      "Hi",
    ]);
  });
});

function service(
  history: ConversationMessageRow[],
  memories: AgentMemoryRow[] = [],
  retrieved: RetrievedChunk[] = [],
) {
  const listMessages = vi.fn(async () => history);
  const listByWorkspace = vi.fn(async () => memories);
  const embed = vi.fn(async () => [[0.2]]);
  const search = vi.fn(async () => retrieved);
  const context = new ContextService(
    { listMessages } as unknown as ConversationsRepository,
    { listByWorkspace } as unknown as MemoriesRepository,
    { search } as never,
    { embed },
  );
  return { context, listMessages, listByWorkspace, embed, search };
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
    citations: null,
    providerItems: null,
    createdAt: new Date(),
  };
}

function chunk(sourceId: string, title: string, content: string): RetrievedChunk {
  return { sourceId, title, sourceType: "doc", content };
}

function memory(content: string): AgentMemoryRow {
  return {
    id: "memory-1",
    workspaceId: "workspace-1",
    userId: "user-1",
    conversationId: "conversation-1",
    content,
    createdAt: new Date(),
  };
}
