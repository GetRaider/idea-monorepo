import { describe, expect, it } from "vitest";

import { SearxngSearchProvider, mapResults } from "./searxng-search-provider";
import { SearchProviderError } from "./search-provider";

describe("SearxngSearchProvider", () => {
  it("maps a json body and drops unsafe urls", () => {
    expect(
      mapResults(
        JSON.stringify({
          results: [
            { title: "A", url: "https://example.com/a", content: "x".repeat(20), publishedDate: "2026-01-01" },
            { title: "Bad", url: "javascript:alert(1)", content: "nope" },
            { title: "B", url: "https://example.com/b", content: "ok" },
          ],
        }),
        1,
        5,
      ),
    ).toEqual([
      {
        title: "A",
        url: "https://example.com/a",
        snippet: "xxxxx",
        publishedAt: "2026-01-01",
      },
    ]);
  });

  it("treats an empty result list as success", () => {
    expect(mapResults(JSON.stringify({ results: [] }), 5, 100)).toEqual([]);
  });

  it("rejects a body that is not a result object", () => {
    expect(() => mapResults("[]", 5, 100)).toThrow(SearchProviderError);
  });

  it("maps http failures to typed errors and requests the configured origin", async () => {
    const calls: string[] = [];
    const provider = new SearxngSearchProvider(
      "http://localhost:8080",
      50,
      100,
      async (input) => {
        calls.push(String(input));
        return new Response("nope", { status: 500 });
      },
    );
    await expect(provider.search("todex", { maxResults: 5 })).rejects.toMatchObject({
      code: "invalid_response",
    });
    expect(calls[0]).toBe("http://localhost:8080/search?q=todex&format=json");

    const limited = new SearxngSearchProvider("http://localhost:8080", 50, 100, async () => {
      return new Response("{}", { status: 429 });
    });
    await expect(limited.search("todex", { maxResults: 5 })).rejects.toMatchObject({
      code: "rate_limited",
    });

    const down = new SearxngSearchProvider("http://localhost:8080", 50, 100, async () => {
      throw new Error("connect");
    });
    await expect(down.search("todex", { maxResults: 5 })).rejects.toMatchObject({
      code: "unavailable",
    });
  });
});
