export interface LlmToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: LlmToolCall[];
  toolCallId?: string;
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmCompletion {
  content: string;
  toolCalls: LlmToolCall[];
  promptTokens: number;
  completionTokens: number;
}

export interface LlmClient {
  complete(input: {
    messages: LlmMessage[];
    tools: LlmToolDefinition[];
  }): Promise<LlmCompletion>;
}

export const LLM_CLIENT = "LLM_CLIENT";
