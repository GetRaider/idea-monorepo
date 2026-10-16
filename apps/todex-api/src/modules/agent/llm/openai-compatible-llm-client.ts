import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

import { env } from "../../../env/env";
import type {
  LlmClient,
  LlmCompletion,
  LlmMessage,
  LlmToolCall,
} from "./llm-client";

@Injectable()
export class OpenAiCompatibleLlmClient implements LlmClient {
  private readonly client = new OpenAI({
    apiKey: env.ai.apiKey || "ollama",
    baseURL: env.ai.provider === "local" ? env.ai.baseUrl : undefined,
    timeout: 60_000,
    maxRetries: 1,
  });

  async complete(input: {
    messages: LlmMessage[];
    tools: { name: string; description: string; parameters: Record<string, unknown> }[];
  }): Promise<LlmCompletion> {
    const response = await this.client.chat.completions.create({
      model: env.ai.model,
      messages: input.messages.map(toOpenAiMessage),
      tools: input.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
    });

    const message = response.choices[0]?.message;
    const toolCalls = (message?.tool_calls ?? []).flatMap((toolCall) => {
      if (toolCall.type !== "function") return [];
      return [
        {
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: parseArguments(toolCall.function.arguments),
        },
      ];
    });

    return {
      content: message?.content ?? "",
      toolCalls,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    };
  }
}

function toOpenAiMessage(message: LlmMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (message.role === "tool") {
    return {
      role: "tool",
      content: message.content,
      tool_call_id: message.toolCallId ?? "",
    };
  }
  if (message.role === "assistant" && message.toolCalls?.length) {
    return {
      role: "assistant",
      content: message.content,
      tool_calls: message.toolCalls.map((toolCall) => ({
        id: toolCall.id,
        type: "function" as const,
        function: {
          name: toolCall.name,
          arguments: JSON.stringify(toolCall.arguments ?? {}),
        },
      })),
    };
  }
  if (message.role === "system") {
    return { role: "system", content: message.content };
  }
  return { role: "user", content: message.content };
}

function parseArguments(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export type { LlmToolCall };
