import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftStatus, Provider } from "../shared";
import { DraftHandoff, type DraftTarget } from "./draft";
import { validateNewChat } from "./validation";

let target: DraftTarget;
let handoff: DraftHandoff;
let statuses: Partial<Record<Provider, DraftStatus>>;
beforeEach(() => {
  statuses = {};
  target = {
    active: vi.fn(() => true),
    getURL: vi.fn(() => "https://chatgpt.com/"),
    isLoading: vi.fn(() => false),
    executeJavaScript: vi.fn(async () => "focused"),
    insertText: vi.fn(async () => {}),
  };
  handoff = new DraftHandoff(
    () => target,
    (next) => {
      statuses = next;
    },
  );
});
afterEach(() => {
  handoff.dispose();
  vi.useRealTimers();
});

describe("draft handoff", () => {
  it("waits for the new page to load, inserts text once and drops the in-memory draft", async () => {
    const text = "Private draft\nwith `code` and ${text}";
    handoff.queue("chatgpt", text);
    handoff.observe("chatgpt");
    expect(target.insertText).not.toHaveBeenCalled();
    handoff.arm("chatgpt");
    await vi.waitFor(() => expect(statuses.chatgpt).toBe("ready"));
    handoff.observe("chatgpt");
    expect(target.insertText).toHaveBeenCalledExactlyOnceWith(text);
    expect(
      vi.mocked(target.executeJavaScript).mock.calls[0]?.[0],
    ).not.toContain(text);
    expect(handoff.text("chatgpt")).toBeNull();
  });
  it("keeps occupied composers unchanged and retains the draft for copying", async () => {
    vi.mocked(target.executeJavaScript).mockResolvedValue("occupied");
    handoff.queue("chatgpt", "New draft");
    handoff.arm("chatgpt");
    await vi.waitFor(() => expect(statuses.chatgpt).toBe("occupied"));
    expect(target.insertText).not.toHaveBeenCalled();
    expect(handoff.text("chatgpt")).toBe("New draft");
    vi.mocked(target.executeJavaScript).mockResolvedValue("focused");
    await handoff.retry("chatgpt");
    expect(statuses.chatgpt).toBe("ready");
  });
  it("waits through sign-in and avoids inactive views and existing conversation pages", async () => {
    vi.mocked(target.getURL).mockReturnValue("https://auth.openai.com/login");
    handoff.queue("chatgpt", "Draft");
    handoff.arm("chatgpt");
    expect(target.executeJavaScript).not.toHaveBeenCalled();
    vi.mocked(target.getURL).mockReturnValue("https://chatgpt.com/");
    vi.mocked(target.active).mockReturnValue(false);
    handoff.observe("chatgpt");
    expect(target.executeJavaScript).not.toHaveBeenCalled();
    vi.mocked(target.active).mockReturnValue(true);
    handoff.observe("chatgpt");
    await vi.waitFor(() => expect(statuses.chatgpt).toBe("ready"));
    vi.mocked(target.getURL).mockReturnValue(
      "https://chatgpt.com/c/new-conversation",
    );
    handoff.observe("chatgpt");
    expect(statuses.chatgpt).toBeUndefined();
    handoff.queue("chatgpt", "Another");
    handoff.arm("chatgpt");
    expect(handoff.text("chatgpt")).toBe("Another");
    expect(target.insertText).toHaveBeenCalledOnce();
  });
  it("handles late results from a dismissed or replaced draft", async () => {
    let finish!: (value: string) => void;
    vi.mocked(target.executeJavaScript).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    handoff.queue("chatgpt", "Old");
    handoff.arm("chatgpt");
    handoff.queue("chatgpt", "Replacement");
    finish("focused");
    await Promise.resolve();
    await Promise.resolve();
    expect(target.insertText).not.toHaveBeenCalled();
    expect(handoff.text("chatgpt")).toBe("Replacement");
  });
  it("stops retrying a missing composer and retains text for explicit fallback", async () => {
    vi.useFakeTimers();
    vi.mocked(target.executeJavaScript).mockResolvedValue("missing");
    handoff.queue("chatgpt", "Draft");
    handoff.arm("chatgpt");
    await vi.advanceTimersByTimeAsync(11000);
    expect(statuses.chatgpt).toBe("unavailable");
    expect(target.executeJavaScript).toHaveBeenCalledTimes(20);
    expect(target.insertText).not.toHaveBeenCalled();
    expect(handoff.text("chatgpt")).toBe("Draft");
  });
  it("validates the exact new-chat payload and preserves multiline text", () => {
    expect(
      validateNewChat({
        provider: "claude",
        spaceId: null,
        text: "  Hello\nworld  ",
        url: "https://evil.test",
      }),
    ).toEqual({ provider: "claude", spaceId: null, text: "  Hello\nworld  " });
    for (const input of [
      null,
      {},
      { provider: "chatgpt", spaceId: null, text: " " },
      { provider: "other", spaceId: null, text: "Hi" },
      { provider: "claude", spaceId: null, text: "x".repeat(32001) },
    ])
      expect(() => validateNewChat(input)).toThrow();
  });
});
