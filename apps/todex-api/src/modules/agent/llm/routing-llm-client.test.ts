import { describe, expect, it, vi } from "vitest";

import { assertTodexAiConfig } from "../../../env/env";
import type { LlmClient } from "./llm-client";
import { selectChatClient } from "./routing-llm-client";

describe("selectChatClient", () => {
  it("uses the local client for ollama even when an OpenAI key is set", () => {
    const local = client();
    const hosted = client();
    expect(selectChatClient("ollama", local, hosted)).toBe(local);
  });

  it("uses the hosted client for openai and does not call local when that client throws", async () => {
    const local = client();
    const hosted = client();
    hosted.complete.mockRejectedValue(new Error("openai down"));
    const selected = selectChatClient("openai", local, hosted);
    expect(selected).toBe(hosted);
    await expect(selected.complete({ messages: [], tools: [] })).rejects.toThrow(
      "openai down",
    );
    expect(local.complete).not.toHaveBeenCalled();
  });

  it("fails boot when openai has an empty key", () => {
    expect(() =>
      assertTodexAiConfig({
        AI_PROVIDER: "openai",
        AI_OPENAI_API_KEY: "",
      }),
    ).toThrow(/AI_OPENAI_API_KEY/);
  });
});

function client(): LlmClient & { complete: ReturnType<typeof vi.fn> } {
  return {
    complete: vi.fn(async () => ({
      content: "",
      toolCalls: [],
      promptTokens: 0,
      completionTokens: 0,
      webSearchCalls: null,
      model: "test",
      citations: [],
    })),
  };
}
