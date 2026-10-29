import { describe, expect, it } from "vitest";

import { OpenAiResponsesLlmClient } from "./openai-responses-llm-client";

const apiKey = process.env.AI_OPENAI_API_KEY;

describe.skipIf(!apiKey)("OpenAI responses continuation", () => {
  it("replays stored output without previous_response_id", async () => {
    const first = new OpenAiResponsesLlmClient();
    const started = await first.complete({
      messages: [{ role: "user", content: "Search the web for the current Node.js LTS version and then stop." }],
      tools: [
        {
          name: "list_tasks",
          description: "List tasks. Call this after you search.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      ],
      webSearch: true,
    });
    expect(started.providerItems?.length).toBeGreaterThan(0);
    const second = new OpenAiResponsesLlmClient();
    const continued = await second.complete({
      messages: [
        { role: "user", content: "Search the web for the current Node.js LTS version and then stop." },
        {
          role: "assistant",
          content: started.content,
          providerItems: started.providerItems,
          toolCalls: started.toolCalls,
        },
        ...started.toolCalls.map((toolCall) => ({
          role: "tool" as const,
          content: JSON.stringify({ tasks: [] }),
          toolCallId: toolCall.id,
        })),
      ],
      tools: [],
      webSearch: true,
    });
    expect(continued.content.length + continued.toolCalls.length).toBeGreaterThan(0);
  });
});
