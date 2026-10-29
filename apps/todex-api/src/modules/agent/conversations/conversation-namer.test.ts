import { describe, expect, it, vi } from "vitest";

import { ConversationNamer } from "./conversation-namer";

describe("ConversationNamer", () => {
  it("stores a short name from the first request and leaves a later turn alone", async () => {
    const conversations = repository(null);
    const complete = vi.fn(async () => ({
      content: '"Add customer feedback doc"',
      toolCalls: [],
      promptTokens: 1,
      completionTokens: 1,
      model: "llama3.1:8b",
      citations: [],
    }));
    const namer = new ConversationNamer(conversations as never, { complete });

    await namer.nameIfMissing("conversation-1");

    expect(complete).toHaveBeenCalledOnce();
    expect(conversations.setTitleIfEmpty).toHaveBeenCalledWith(
      "conversation-1",
      "Add customer feedback doc",
    );

    conversations.findConversation.mockResolvedValueOnce({
      id: "conversation-1",
      title: "Add customer feedback doc",
    });
    await namer.nameIfMissing("conversation-1");
    expect(complete).toHaveBeenCalledOnce();
  });

  it("uses the user's words when the model returns nothing usable", async () => {
    const conversations = repository(null);
    const namer = new ConversationNamer(conversations as never, {
      complete: vi.fn(async () => ({
        content: "   ",
        toolCalls: [],
        promptTokens: 1,
        completionTokens: 1,
        model: "llama3.1:8b",
        citations: [],
      })),
    });

    await namer.nameIfMissing("conversation-1");

    expect(conversations.setTitleIfEmpty).toHaveBeenCalledWith(
      "conversation-1",
      "Please add a doc about customer",
    );
  });
});

function repository(title: string | null) {
  return {
    findConversation: vi.fn(async () => ({ id: "conversation-1", title })),
    listMessages: vi.fn(async () => [
      {
        role: "user",
        content: "Please add a doc about customer feedback in the Todex folder",
      },
    ]),
    setTitleIfEmpty: vi.fn(),
  };
}
