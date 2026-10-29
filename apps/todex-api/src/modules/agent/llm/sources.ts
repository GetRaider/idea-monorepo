import type { MessageCitation } from "../../../db/schema";

export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  publishedAt?: string;
}

export interface Citation {
  sourceId: string;
  startIndex?: number;
  endIndex?: number;
}

export function acceptCitation(
  citation: RawCitation,
  content: string,
  limits: { maxSnippetChars: number },
): MessageCitation | null {
  const normalized = normalizeHttpUrl(citation.url);
  if (!normalized) return null;
  const stored: MessageCitation = {
    url: normalized,
    title: citation.title.slice(0, 300),
  };
  if (citation.snippet) stored.snippet = citation.snippet.slice(0, limits.maxSnippetChars);
  if (citation.publishedAt) stored.publishedAt = citation.publishedAt;
  const span = acceptSpan(content, citation.startIndex, citation.endIndex);
  if (span) {
    stored.startIndex = span.startIndex;
    stored.endIndex = span.endIndex;
  }
  return stored;
}

export function normalizeHttpUrl(value: string): string | null {
  if (!value || value.length > 2000) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  const normalized = parsed.toString();
  return normalized.length > 2000 ? null : normalized;
}

export function acceptSpan(
  content: string,
  startIndex: number | undefined,
  endIndex: number | undefined,
): { startIndex: number; endIndex: number } | null {
  if (startIndex === undefined || endIndex === undefined) return null;
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return null;
  if (startIndex < 0 || endIndex <= startIndex || endIndex > content.length) return null;
  if (splitsSurrogate(content, startIndex) || splitsSurrogate(content, endIndex)) return null;
  return { startIndex, endIndex };
}

function splitsSurrogate(content: string, index: number): boolean {
  if (index <= 0 || index >= content.length) return false;
  const previous = content.charCodeAt(index - 1);
  const next = content.charCodeAt(index);
  return previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff;
}

export interface RawCitation {
  url: string;
  title: string;
  snippet?: string;
  publishedAt?: string;
  startIndex?: number;
  endIndex?: number;
}
