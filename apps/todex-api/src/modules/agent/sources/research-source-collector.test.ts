import { describe, expect, it } from "vitest";

import type { ConversationMessageRow } from "../../../db/schema";
import { ResearchSourceCollector } from "./research-source-collector";

describe("ResearchSourceCollector", () => {
  it("accumulates searches from one operation onto the answer and the write", () => {
    const collector = ResearchSourceCollector.create();
    collector.addResults([result("https://example.com/a", "A")], 500);
    collector.addResults([result("https://example.com/b", "B")], 500);
    expect(collector.citationsFor("Here is the answer").map((citation) => citation.url)).toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
    const firstWrite = collector.citationsFor(JSON.stringify({ content: "notes" }));
    collector.finishVisibleAnswer();
    collector.addResults([result("https://example.com/c", "C")], 500);
    const secondWrite = collector.citationsFor(JSON.stringify({ content: "later" }));
    expect(firstWrite.map((citation) => citation.url)).toEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
    expect(secondWrite.map((citation) => citation.url)).toEqual(["https://example.com/c"]);
  });

  it("reuses an older source only when the new text contains its url", () => {
    const collector = ResearchSourceCollector.create();
    collector.addResults([result("https://example.com/a", "A")], 500);
    collector.finishVisibleAnswer();
    expect(collector.citationsFor("No link here")).toEqual([]);
    expect(collector.citationsFor("See https://example.com/a").map((citation) => citation.url)).toEqual([
      "https://example.com/a",
    ]);
  });

  it("collapses duplicate urls and restores snapshots from stored rows", () => {
    const collector = ResearchSourceCollector.create();
    collector.addResults(
      [result("https://Example.com/a#section", "A"), result("https://example.com/a", "Again")],
      500,
    );
    expect(collector.citationsFor("answer")).toHaveLength(1);
    const reloaded = ResearchSourceCollector.reload(
      [
        message("assistant", "answer", [
          { url: "https://example.com/a", title: "A" },
        ]),
      ],
      [
        {
          id: "call-1",
          name: "create_doc",
          arguments: {},
          sources: [{ url: "https://example.com/a", title: "A" }],
        },
      ],
    );
    expect(reloaded.pendingSnapshots).toEqual([[{ url: "https://example.com/a", title: "A" }]]);
    expect(reloaded.citationsFor("nothing new")).toEqual([]);
  });
});

function result(url: string, title: string) {
  return { url, title, snippet: "snippet" };
}

function message(
  role: string,
  content: string,
  citations: ConversationMessageRow["citations"],
): ConversationMessageRow {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    jobId: "job-1",
    agentRunId: null,
    position: 0,
    role,
    content,
    toolCalls: null,
    toolCallId: null,
    citations,
    providerItems: null,
    createdAt: new Date(),
  };
}
