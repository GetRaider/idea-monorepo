import type {
  ConversationMessageRow,
  MessageCitation,
  PendingToolCall,
} from "../../../db/schema";
import { acceptCitation, type RawCitation } from "../llm/sources";
import type { SearchResult } from "../search/search-provider";

export class ResearchSourceCollector {
  private readonly known = new Map<string, MessageCitation>();
  private open: MessageCitation[] = [];
  private previous: MessageCitation[] = [];
  readonly pendingSnapshots: MessageCitation[][];

  private constructor(pendingSnapshots: MessageCitation[][]) {
    this.pendingSnapshots = pendingSnapshots;
  }

  static create(): ResearchSourceCollector {
    return new ResearchSourceCollector([]);
  }

  static reload(
    messages: ConversationMessageRow[],
    pendingToolCalls: PendingToolCall[] | null,
  ): ResearchSourceCollector {
    const collector = new ResearchSourceCollector(
      (pendingToolCalls ?? []).map((toolCall) => toolCall.sources ?? []),
    );
    for (const message of messages) {
      const citations = message.citations ?? [];
      if (message.role === "assistant" && message.content.trim()) {
        for (const citation of citations) collector.rememberPrevious(citation);
        collector.open = [];
        continue;
      }
      for (const citation of citations) collector.rememberOpen(citation);
    }
    return collector;
  }

  add(citations: RawCitation[], content: string, maxSnippetChars: number): MessageCitation[] {
    const accepted: MessageCitation[] = [];
    const keptSpans: { startIndex: number; endIndex: number }[] = [];
    for (const citation of citations) {
      const stored = acceptCitation(citation, content, { maxSnippetChars });
      if (!stored) continue;
      if (stored.startIndex !== undefined && stored.endIndex !== undefined) {
        const overlaps = keptSpans.some(
          (span) => stored.startIndex! < span.endIndex && stored.endIndex! > span.startIndex,
        );
        if (overlaps) {
          delete stored.startIndex;
          delete stored.endIndex;
        } else {
          keptSpans.push({ startIndex: stored.startIndex, endIndex: stored.endIndex });
        }
      }
      accepted.push(this.rememberOpen(stored));
    }
    return accepted;
  }

  addResults(results: SearchResult[], maxSnippetChars: number): MessageCitation[] {
    return this.add(
      results.map((result) => ({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        publishedAt: result.publishedAt,
      })),
      "",
      maxSnippetChars,
    );
  }

  citationsFor(text: string): MessageCitation[] {
    const referenced = this.previous.filter((source) => text.includes(source.url));
    return dedupe([...this.open, ...referenced]);
  }

  finishVisibleAnswer(): void {
    for (const source of this.open) this.previous.push(source);
    this.previous = dedupe(this.previous);
    this.open = [];
  }

  private rememberOpen(citation: MessageCitation): MessageCitation {
    const existing = this.known.get(citation.url);
    if (existing) return existing;
    this.known.set(citation.url, citation);
    this.open.push(citation);
    return citation;
  }

  private rememberPrevious(citation: MessageCitation): void {
    if (!this.known.has(citation.url)) this.known.set(citation.url, citation);
    this.previous.push(this.known.get(citation.url)!);
    this.previous = dedupe(this.previous);
  }
}

function dedupe(citations: MessageCitation[]): MessageCitation[] {
  const seen = new Set<string>();
  const unique: MessageCitation[] = [];
  for (const citation of citations) {
    if (seen.has(citation.url)) continue;
    seen.add(citation.url);
    unique.push(citation);
  }
  return unique;
}
