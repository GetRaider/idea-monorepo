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
  providerItems?: unknown[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface UrlCitation {
  url: string;
  title: string;
  snippet?: string;
  publishedAt?: string;
  startIndex?: number;
  endIndex?: number;
}

export interface LlmCompletion {
  content: string;
  toolCalls: LlmToolCall[];
  promptTokens: number | null;
  completionTokens: number | null;
  webSearchCalls?: number | null;
  model: string;
  citations: UrlCitation[];
  providerItems?: unknown[];
}

export interface LlmCompletionInput {
  messages: LlmMessage[];
  tools: LlmToolDefinition[];
  webSearch?: boolean;
  onDelta?: (text: string) => void;
}

export interface LlmClient {
  complete(input: LlmCompletionInput): Promise<LlmCompletion>;
}

export const LLM_CLIENT = "LLM_CLIENT";
