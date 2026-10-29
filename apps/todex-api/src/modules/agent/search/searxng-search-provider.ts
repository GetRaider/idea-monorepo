import { env } from "../../../env/env";
import { normalizeHttpUrl } from "../llm/sources";
import { SearchProviderError, type SearchProvider, type SearchResult } from "./search-provider";

const MAX_BODY_BYTES = 1_000_000;

export class SearxngSearchProvider implements SearchProvider {
  constructor(
    private readonly baseUrl = env.ai.searxngBaseUrl ?? "",
    private readonly timeoutMs = env.ai.searxngTimeoutMs,
    private readonly maxSnippetChars = env.ai.searxngMaxSnippetChars,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(
    query: string,
    options: { maxResults: number; signal?: AbortSignal },
  ): Promise<SearchResult[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onAbort);
    try {
      const url = new URL("/search", this.baseUrl);
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      const response = await this.fetchImpl(url, { signal: controller.signal });
      if (response.status === 429) throw new SearchProviderError("rate_limited");
      if (!response.ok) throw new SearchProviderError("invalid_response");
      const body = await readLimitedBody(response);
      return mapResults(body, options.maxResults, this.maxSnippetChars);
    } catch (error) {
      if (error instanceof SearchProviderError) throw error;
      if (controller.signal.aborted || options.signal?.aborted) {
        throw new SearchProviderError("timeout");
      }
      throw new SearchProviderError("unavailable");
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }
  }
}

export function mapResults(
  body: string,
  maxResults: number,
  maxSnippetChars: number,
): SearchResult[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    throw new SearchProviderError("invalid_response");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { results?: unknown }).results)) {
    throw new SearchProviderError("invalid_response");
  }
  const results: SearchResult[] = [];
  for (const entry of (parsed as { results: unknown[] }).results) {
    if (results.length >= maxResults) break;
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.url !== "string" || typeof row.title !== "string") continue;
    const url = normalizeHttpUrl(row.url);
    if (!url) continue;
    const result: SearchResult = {
      title: row.title.slice(0, 300),
      url,
      snippet: (typeof row.content === "string" ? row.content : "").slice(0, maxSnippetChars),
    };
    if (typeof row.publishedDate === "string" && row.publishedDate) {
      result.publishedAt = row.publishedDate;
    }
    results.push(result);
  }
  return results;
}

async function readLimitedBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (text.length > MAX_BODY_BYTES) throw new SearchProviderError("invalid_response");
    return text;
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new SearchProviderError("invalid_response");
    }
    chunks.push(next.value);
  }
  return new TextDecoder().decode(concat(chunks, size));
}

function concat(chunks: Uint8Array[], size: number): Uint8Array {
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
