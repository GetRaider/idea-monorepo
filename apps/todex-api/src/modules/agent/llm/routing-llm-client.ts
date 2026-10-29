import { Injectable } from "@nestjs/common";

import { env } from "../../../env/env";
import type { LlmClient, LlmCompletion, LlmCompletionInput } from "./llm-client";
import { OpenAiCompatibleLlmClient } from "./openai-compatible-llm-client";
import { OpenAiResponsesLlmClient } from "./openai-responses-llm-client";

@Injectable()
export class RoutingLlmClient implements LlmClient {
  constructor(
    private readonly local: OpenAiCompatibleLlmClient,
    private readonly hosted: OpenAiResponsesLlmClient,
  ) {}

  complete(input: LlmCompletionInput): Promise<LlmCompletion> {
    return selectChatClient(env.ai.provider, this.local, this.hosted).complete(input);
  }
}

export function selectChatClient(
  provider: "ollama" | "openai",
  local: LlmClient,
  hosted: LlmClient,
): LlmClient {
  return provider === "openai" ? hosted : local;
}
