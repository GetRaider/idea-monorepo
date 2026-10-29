import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

import { env } from "../../../env/env";
import type { LlmClient, LlmCompletion, LlmCompletionInput } from "./llm-client";
import { responseTools, toResponsesInput } from "./responses-input";
import { readResponsesOutput } from "./responses-output";

const HOSTED_TIMEOUT_MS = 180_000;

@Injectable()
export class OpenAiResponsesLlmClient implements LlmClient {
  private readonly client = new OpenAI({
    apiKey: env.ai.openaiApiKey || "missing",
    timeout: HOSTED_TIMEOUT_MS,
    maxRetries: 0,
  });

  async complete(input: LlmCompletionInput): Promise<LlmCompletion> {
    const tools = responseTools(input.tools, input.webSearch === true);
    const stream = this.client.responses.stream(
      {
        model: env.ai.model,
        input: toResponsesInput(input.messages) as unknown as OpenAI.Responses.ResponseInput,
        ...(tools.length > 0 ? { tools: tools as OpenAI.Responses.Tool[] } : {}),
      },
      { timeout: HOSTED_TIMEOUT_MS },
    );
    stream.on("response.output_text.delta", (event) => {
      input.onDelta?.(event.delta);
    });
    const response = await stream.finalResponse();
    const read = readResponsesOutput(response.output);
    const usage = response.usage;
    return {
      content: read.content,
      toolCalls: read.toolCalls,
      promptTokens: usage ? usage.input_tokens : null,
      completionTokens: usage ? usage.output_tokens : null,
      webSearchCalls: usage ? countWebSearchCalls(read.providerItems) : null,
      model: env.ai.model,
      citations: read.citations,
      providerItems: read.providerItems,
    };
  }
}

function countWebSearchCalls(items: unknown[]): number {
  return items.filter((item) => {
    return Boolean(item && typeof item === "object" && (item as { type?: unknown }).type === "web_search_call");
  }).length;
}

export { HOSTED_TIMEOUT_MS };
