import { describe, expect, it } from "vitest";

import { conversationUrl, meaningfulTitle } from "./conversation";

describe("conversation recognition and canonicalization", () => {
  it("normalizes provider paths, queries, fragments and ChatGPT project URLs", () => {
    expect(
      conversationUrl(
        "chatgpt",
        "https://CHATGPT.com/c/conversation-123/?model=test#fragment",
      ),
    ).toBe("https://chatgpt.com/c/conversation-123");
    expect(
      conversationUrl(
        "chatgpt",
        "https://chatgpt.com/g/g-p-project/c/conversation-123?token=secret",
      ),
    ).toBe("https://chatgpt.com/c/conversation-123");
    expect(
      conversationUrl(
        "claude",
        "https://claude.ai/chat/conversation-456/?foo=bar",
      ),
    ).toBe("https://claude.ai/chat/conversation-456");
  });
  it("rejects other providers, auth pages, settings, shared links, malformed paths and credentials", () => {
    const rejected = [
      "https://chatgpt.com/",
      "https://chatgpt.com/settings",
      "https://chatgpt.com/auth/login",
      "https://chatgpt.com/share/id",
      "https://chatgpt.com/c/",
      "https://chatgpt.com/c/id/extra",
      "https://chatgpt.com/c/id%2Fother",
      "https://chatgpt.com.evil.test/c/id",
      "https://chatgpt.com:444/c/id",
      "http://chatgpt.com/c/id",
      "https://user:password@chatgpt.com/c/id",
      "https://claude.ai/chat/id",
      "not a URL",
    ];
    for (const url of rejected)
      expect(conversationUrl("chatgpt", url), url).toBeNull();
    expect(conversationUrl("claude", "https://claude.ai/c/id")).toBeNull();
    expect(
      conversationUrl("chatgpt", "https://chatgpt.com/chat/id"),
    ).toBeNull();
  });
  it("keeps meaningful titles and ignores provider/loading placeholders", () => {
    expect(meaningfulTitle("chatgpt", "  Architecture review - ChatGPT ")).toBe(
      "Architecture review",
    );
    expect(meaningfulTitle("claude", "My planning | Claude")).toBe(
      "My planning",
    );
    for (const title of [
      "",
      "New chat",
      "ChatGPT",
      "Claude",
      "Just a moment...",
      "Loading…",
    ])
      expect(meaningfulTitle("chatgpt", title)).toBeNull();
  });
});
