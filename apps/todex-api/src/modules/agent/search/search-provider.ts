export interface SearchProvider {
  search(
    query: string,
    options: { maxResults: number; signal?: AbortSignal },
  ): Promise<SearchResult[]>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
}

export type SearchFailure = "unavailable" | "timeout" | "rate_limited" | "invalid_response";

export class SearchProviderError extends Error {
  constructor(readonly code: SearchFailure) {
    super(code);
  }
}
