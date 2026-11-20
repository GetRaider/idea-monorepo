import { describe, expect, it } from "vitest";

import {
  isConversation,
  isEmbeddedDestination,
  isHttps,
  isProviderOrigin,
  safeUrl,
} from "./policy";

describe("remote content boundaries", () => {
  it("rejects executable schemes, credentials, HTTP and lookalike hosts", () => {
    for (const url of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "http://chatgpt.com",
      "https://chatgpt.com.evil.test",
      "https://user:secret@chatgpt.com",
    ]) {
      expect(isEmbeddedDestination("chatgpt", url)).toBe(false);
    }
    expect(isHttps("not a url")).toBe(false);
  });
  it("allows official provider and known authentication destinations without granting auth origins provider permissions", () => {
    expect(
      isEmbeddedDestination(
        "chatgpt",
        "https://auth.openai.com/authorize?code=secret",
      ),
    ).toBe(true);
    expect(
      isEmbeddedDestination("claude", "https://accounts.google.com/"),
    ).toBe(true);
    expect(isProviderOrigin("claude", "https://accounts.google.com/")).toBe(
      false,
    );
    expect(isProviderOrigin("chatgpt", "https://chatgpt.com:444/")).toBe(false);
  });
  it("redacts OAuth details and conversation identifiers from logs", () => {
    expect(
      safeUrl(
        "https://auth.openai.com/callback/secret?code=token#access_token=secret",
      ),
    ).toBe("https://auth.openai.com/");
    expect(safeUrl("https://chatgpt.com/c/private-id?token=secret")).toBe(
      "https://chatgpt.com/[conversation]",
    );
  });
  it("only identifies conversation paths on the selected provider", () => {
    expect(isConversation("chatgpt", "https://chatgpt.com/c/123")).toBe(true);
    expect(isConversation("claude", "https://claude.ai/chat/123")).toBe(true);
    expect(isConversation("claude", "https://evil.test/chat/123")).toBe(false);
    expect(isConversation("chatgpt", "https://chatgpt.com/")).toBe(false);
  });
});
