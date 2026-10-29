import { describe, expect, it } from "vitest";

import { embeddingClientConfig } from "./openai-compatible-embedding-client";
import { ProviderStateMissingError, responseTools, toResponsesInput } from "./responses-input";
import { keepCitations, readResponsesOutput } from "./responses-output";

describe("readResponsesOutput", () => {
  it("keeps function calls and citations and drops web search calls", () => {
    const read = readResponsesOutput([
      { type: "web_search_call", id: "ws_1", status: "completed" },
      {
        type: "function_call",
        name: "web_search",
        call_id: "call-search",
        arguments: "{}",
      },
      {
        type: "function_call",
        name: "list_tasks",
        call_id: "call-1",
        arguments: "{}",
      },
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: "See the source",
            annotations: [
              {
                type: "url_citation",
                url: "https://example.com/a",
                title: "Example",
                start_index: 0,
                end_index: 3,
              },
              { type: "url_citation", title: "Missing url" },
            ],
          },
        ],
      },
    ]);

    expect(read.toolCalls).toEqual([
      { id: "call-1", name: "list_tasks", arguments: {} },
    ]);
    expect(read.citations).toEqual([
      {
        url: "https://example.com/a",
        title: "Example",
        startIndex: 0,
        endIndex: 3,
      },
    ]);
    expect(read.content).toBe("See the source");
  });
});

describe("toResponsesInput", () => {
  it("replays stored output and only the matching tool results", () => {
    const providerItems = [
      { type: "reasoning", encrypted_content: "secret" },
      { type: "web_search_call", id: "ws_1" },
      { type: "function_call", call_id: "call-1", name: "list_tasks", arguments: "{}" },
      { type: "message", content: [{ type: "output_text", text: "See the source" }] },
    ];
    expect(
      toResponsesInput([
        { role: "user", content: "Look it up" },
        { role: "assistant", content: "See the source", providerItems, toolCalls: [
          { id: "call-1", name: "list_tasks", arguments: {} },
        ] },
        { role: "tool", content: "{\"ok\":true}", toolCallId: "call-1" },
      ]),
    ).toEqual([
      { role: "user", content: "Look it up" },
      ...providerItems,
      { type: "function_call_output", call_id: "call-1", output: "{\"ok\":true}" },
    ]);
  });

  it("fails before the request when a tool output has no stored call", () => {
    expect(() =>
      toResponsesInput([
        {
          role: "assistant",
          content: "",
          providerItems: [{ type: "function_call", call_id: "call-1", name: "list_tasks" }],
        },
        { role: "tool", content: "{}", toolCallId: "missing" },
      ]),
    ).toThrow(ProviderStateMissingError);
  });

  it("omits hosted web search when the job did not ask for it", () => {
    expect(responseTools([{ name: "list_tasks", description: "List", parameters: {} }], false)).toEqual([
      {
        type: "function",
        name: "list_tasks",
        description: "List",
        parameters: {},
        strict: false,
      },
    ]);
  });
});

describe("keepCitations", () => {
  it("drops a bad span, an overlap, a missing url, and a span that splits an emoji", () => {
    const content = "hi 😀 there";
    expect(
      keepCitations(
        [
          { url: "", title: "Empty", startIndex: 0, endIndex: 1 },
          { url: "https://example.com/a", title: "Bad range", startIndex: 0, endIndex: 99 },
          { url: "https://example.com/b", title: "First", startIndex: 0, endIndex: 2 },
          { url: "https://example.com/c", title: "Overlap", startIndex: 1, endIndex: 3 },
          { url: "javascript:alert(1)", title: "Bad scheme", startIndex: 0, endIndex: 2 },
          { url: "https://example.com/emoji", title: "Emoji", startIndex: 3, endIndex: 4 },
        ],
        content,
      ).map((citation) => citation.title),
    ).toEqual(["Bad range", "First", "Overlap", "Emoji"]);
  });

  it("drops a citation without a url", () => {
    expect(
      keepCitations([
        { url: "", title: "Empty", startIndex: 0, endIndex: 1 },
      ]),
    ).toEqual([]);
  });
});

describe("embeddingClientConfig", () => {
  it("always uses the local key and the given base url", () => {
    expect(embeddingClientConfig("http://localhost:11434/v1")).toEqual({
      apiKey: "ollama",
      baseURL: "http://localhost:11434/v1",
    });
  });
});
