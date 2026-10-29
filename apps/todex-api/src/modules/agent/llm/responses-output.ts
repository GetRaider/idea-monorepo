import type { LlmToolCall, UrlCitation } from "./llm-client";
import { acceptCitation } from "./sources";

export function readResponsesOutput(output: unknown): ResponsesRead {
  const providerItems = Array.isArray(output) ? output : [];
  const toolCalls: LlmToolCall[] = [];
  const rawCitations: UrlCitation[] = [];
  const text: string[] = [];
  for (const item of providerItems) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "function_call" && typeof record.name === "string") {
      const id = typeof record.call_id === "string" ? record.call_id : "";
      if (!id || record.name === "web_search") continue;
      toolCalls.push({
        id,
        name: record.name,
        arguments: parseArguments(
          typeof record.arguments === "string" ? record.arguments : "",
        ),
      });
      continue;
    }
    if (record.type !== "message" || !Array.isArray(record.content)) continue;
    for (const part of record.content) {
      if (!part || typeof part !== "object") continue;
      const content = part as Record<string, unknown>;
      if (typeof content.text === "string") text.push(content.text);
      if (!Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        const citation = readCitation(annotation);
        if (citation) rawCitations.push(citation);
      }
    }
  }
  const content = text.join("");
  return {
    content,
    toolCalls,
    citations: keepCitations(rawCitations, content),
    providerItems,
  };
}

export function keepCitations(citations: UrlCitation[], content = ""): UrlCitation[] {
  const kept: UrlCitation[] = [];
  const spans: { startIndex: number; endIndex: number }[] = [];
  for (const citation of citations) {
    const accepted = acceptCitation(citation, content, { maxSnippetChars: 500 });
    if (!accepted) continue;
    if (accepted.startIndex !== undefined && accepted.endIndex !== undefined) {
      const overlaps = spans.some(
        (span) =>
          accepted.startIndex! < span.endIndex && accepted.endIndex! > span.startIndex,
      );
      if (overlaps) {
        delete accepted.startIndex;
        delete accepted.endIndex;
      } else {
        spans.push({ startIndex: accepted.startIndex, endIndex: accepted.endIndex });
      }
    }
    kept.push(accepted);
  }
  return kept;
}

function readCitation(value: unknown): UrlCitation | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.type !== "url_citation" || typeof record.url !== "string") return null;
  return {
    url: record.url,
    title: typeof record.title === "string" ? record.title : "",
    ...(typeof record.start_index === "number" ? { startIndex: record.start_index } : {}),
    ...(typeof record.end_index === "number" ? { endIndex: record.end_index } : {}),
  };
}

function parseArguments(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

interface ResponsesRead {
  content: string;
  toolCalls: LlmToolCall[];
  citations: UrlCitation[];
  providerItems: unknown[];
}
