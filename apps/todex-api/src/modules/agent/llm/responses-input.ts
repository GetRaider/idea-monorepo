import type { LlmMessage } from "./llm-client";

export class ProviderStateMissingError extends Error {
  readonly code = "provider_state_missing";

  constructor() {
    super("The model reply cannot be continued.");
  }
}

export function toResponsesInput(messages: LlmMessage[]): ResponsesInputItem[] {
  const items: ResponsesInputItem[] = [];
  const callIds = new Set<string>();
  for (const message of messages) {
    if (message.role === "assistant" && message.providerItems) {
      for (const item of message.providerItems) {
        items.push(item as ResponsesInputItem);
        const callId = functionCallId(item);
        if (callId) callIds.add(callId);
      }
      continue;
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      throw new ProviderStateMissingError();
    }
    if (message.role === "tool") {
      const callId = message.toolCallId ?? "";
      if (!callIds.has(callId)) throw new ProviderStateMissingError();
      items.push({
        type: "function_call_output",
        call_id: callId,
        output: message.content,
      });
      continue;
    }
    items.push({
      role: message.role === "assistant" ? "assistant" : message.role,
      content: message.content,
    });
  }
  return items;
}

export function responseTools(
  tools: { name: string; description: string; parameters: Record<string, unknown> }[],
  webSearch: boolean,
): ResponsesTool[] {
  const functions: ResponsesTool[] = tools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: false,
  }));
  if (!webSearch) return functions;
  return [{ type: "web_search", search_context_size: "medium" }, ...functions];
}

function functionCallId(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  if (record.type !== "function_call" || typeof record.call_id !== "string") return null;
  return record.call_id;
}

export type ResponsesInputItem = Record<string, unknown>;

export interface ResponsesTool {
  type: string;
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  strict?: boolean;
  search_context_size?: string;
}
