import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConversationCapture } from "./capture";
import { openLibrary, type ChatLibrary } from "./library";

let directory: string;
let library: ChatLibrary;
const chatgptUrl = "https://chatgpt.com/c/conversation-123";
const claudeUrl = "https://claude.ai/chat/conversation-456";

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "airove-test-"));
  library = await openLibrary(join(directory, "airove.sqlite"));
});
afterEach(() => {
  library.close();
  rmSync(directory, { recursive: true, force: true });
});

function createSpace(name = "Project", folderId: string | null = null) {
  library.edit({ type: "space:create", name, folderId });
  return library.snapshot().spaces.find((space) => space.name === name)!;
}

describe("persistent library", () => {
  it("persists folders, spaces, chats, manual titles and provider preferences across restart", async () => {
    library.edit({ type: "folder:create", name: "Products" });
    const folder = library.snapshot().folders[0]!;
    const space = createSpace("Project", folder.id);
    library.rememberProvider("claude", space.id);
    library.capture(
      "chatgpt",
      chatgptUrl,
      "Original - ChatGPT",
      space.id,
      true,
    );
    library.capture("claude", claudeUrl, "Claude planning", space.id, true);
    const chat = library
      .snapshot()
      .chats.find((candidate) => candidate.provider === "chatgpt")!;
    library.edit({ type: "chat:rename", id: chat.id, name: "My local title" });
    const snapshot = library.snapshot();
    library.close();
    library = await openLibrary(join(directory, "airove.sqlite"));
    expect(library.snapshot()).toEqual(snapshot);
    library.capture(
      "chatgpt",
      chatgptUrl,
      "Provider changed the title",
      null,
      false,
    );
    expect(library.getChat(chat.id).title).toBe("My local title");
    expect(snapshot.lastProvider).toBe("claude");
    expect(snapshot.spaces[0]?.preferredProvider).toBe("claude");
  });
  it("deduplicates canonical URLs without moving existing chats and updates useful titles", () => {
    const first = createSpace("First");
    const second = createSpace("Second");
    library.capture(
      "chatgpt",
      chatgptUrl + "?model=one",
      "ChatGPT",
      first.id,
      true,
    );
    library.capture(
      "chatgpt",
      chatgptUrl + "/#fragment",
      "Useful title - ChatGPT",
      second.id,
      true,
    );
    library.capture(
      "chatgpt",
      "https://chatgpt.com/g/g-project/c/conversation-123",
      "New chat",
      null,
      true,
    );
    expect(library.snapshot().chats).toHaveLength(1);
    const chat = library.snapshot().chats[0]!;
    expect(chat.spaceId).toBe(first.id);
    expect(chat.title).toBe("Useful title");
    expect(chat.lastOpenedAt).not.toBeNull();
  });
  it("renames and moves containers and chats; deleting containers preserves their children", () => {
    library.edit({ type: "folder:create", name: "Folder" });
    const folder = library.snapshot().folders[0]!;
    library.edit({
      type: "folder:rename",
      id: folder.id,
      name: "Renamed folder",
    });
    const space = createSpace();
    library.edit({ type: "space:rename", id: space.id, name: "Renamed Space" });
    library.edit({ type: "space:move", id: space.id, folderId: folder.id });
    library.capture("chatgpt", chatgptUrl, "Chat", null, true);
    const chat = library.snapshot().chats[0]!;
    library.edit({ type: "chat:move", id: chat.id, spaceId: space.id });
    library.edit({ type: "folder:delete", id: folder.id });
    expect(library.snapshot().spaces[0]?.folderId).toBeNull();
    expect(library.getChat(chat.id).spaceId).toBe(space.id);
    library.edit({ type: "space:delete", id: space.id });
    expect(library.getChat(chat.id).spaceId).toBeNull();
    library.edit({ type: "chat:remove", id: chat.id });
    expect(library.snapshot().chats).toHaveLength(0);
  });
  it("removes associations explicitly and rejects missing parents without partial edits", () => {
    const space = createSpace();
    library.capture("claude", claudeUrl, "Plan", space.id, true);
    const chat = library.snapshot().chats[0]!;
    library.edit({ type: "chat:move", id: chat.id, spaceId: null });
    expect(library.getChat(chat.id).spaceId).toBeNull();
    expect(() =>
      library.edit({ type: "space:move", id: space.id, folderId: "missing" }),
    ).toThrow();
    const snapshot = library.snapshot();
    expect(() => library.rememberProvider("claude", "missing")).toThrow();
    expect(library.snapshot()).toEqual(snapshot);
  });
  it("rolls back memory on a failed atomic disk write, preserving the previous database", async () => {
    createSpace("Saved");
    const snapshot = library.snapshot();
    renameSync(directory, directory + "-moved");
    try {
      expect(() =>
        library.edit({ type: "folder:create", name: "Unsaved" }),
      ).toThrow();
      expect(library.snapshot()).toEqual(snapshot);
    } finally {
      renameSync(directory + "-moved", directory);
    }
    library.close();
    library = await openLibrary(join(directory, "airove.sqlite"));
    expect(library.snapshot()).toEqual(snapshot);
    library.edit({ type: "folder:create", name: "Retry" });
    expect(library.snapshot().folders[0]?.name).toBe("Retry");
  });
});

describe("new-chat context and navigation capture", () => {
  it("captures only after a conversation URL exists and retains the initiating Space", () => {
    const first = createSpace("First");
    createSpace("Second");
    const capture = new ConversationCapture(library);
    capture.begin("chatgpt", first.id);
    capture.observe("chatgpt", chatgptUrl, "Old page title", "title");
    capture.observe("chatgpt", "https://chatgpt.com/", "ChatGPT", "navigation");
    expect(library.snapshot().chats).toHaveLength(0);
    // A Sidebar selection does not change the pending context.
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    capture.observe(
      "chatgpt",
      chatgptUrl,
      "New project plan - ChatGPT",
      "title",
    );
    expect(library.snapshot().chats[0]).toMatchObject({
      spaceId: first.id,
      title: "New project plan",
    });
    capture.observe(
      "chatgpt",
      "https://chatgpt.com/c/unknown-existing",
      "",
      "navigation",
    );
    expect(
      library
        .snapshot()
        .chats.find((chat) => chat.url.endsWith("unknown-existing"))?.spaceId,
    ).toBeNull();
  });
  it("tracks simultaneous provider intents independently, including an unassigned new chat", () => {
    const space = createSpace();
    const capture = new ConversationCapture(library);
    capture.begin("chatgpt", space.id);
    capture.begin("claude", null);
    capture.observe("claude", "https://claude.ai/new", "", "navigation");
    capture.observe("chatgpt", "https://chatgpt.com/", "", "navigation");
    capture.observe("claude", claudeUrl, "", "navigation");
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    expect(
      library.snapshot().chats.find((chat) => chat.provider === "claude")
        ?.spaceId,
    ).toBeNull();
    expect(
      library.snapshot().chats.find((chat) => chat.provider === "chatgpt")
        ?.spaceId,
    ).toBe(space.id);
  });
  it("preserves known chat association and does not reuse a consumed intent", () => {
    const original = createSpace("Original");
    const other = createSpace("Other");
    library.capture("claude", claudeUrl, "Existing", original.id, true);
    const capture = new ConversationCapture(library);
    capture.begin("claude", other.id);
    capture.observe("claude", "https://claude.ai/new", "", "navigation");
    capture.observe("claude", claudeUrl, "", "navigation");
    capture.observe(
      "claude",
      "https://claude.ai/chat/another-existing",
      "",
      "navigation",
    );
    expect(
      library.snapshot().chats.find((chat) => chat.url === claudeUrl)?.spaceId,
    ).toBe(original.id);
    expect(
      library
        .snapshot()
        .chats.find((chat) => chat.url.endsWith("another-existing"))?.spaceId,
    ).toBeNull();
  });
  it("handles deleted Spaces, cancelled navigation and superseded requests", () => {
    const space = createSpace();
    const capture = new ConversationCapture(library);
    const oldToken = capture.begin("chatgpt", null);
    capture.begin("chatgpt", space.id);
    capture.cancel("chatgpt", oldToken);
    capture.observe("chatgpt", "https://chatgpt.com/", "", "navigation");
    library.edit({ type: "space:delete", id: space.id });
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    expect(library.snapshot().chats[0]?.spaceId).toBeNull();
    const nextSpace = createSpace();
    capture.begin("claude", nextSpace.id);
    capture.observe("claude", "https://claude.ai/new", "", "navigation");
    capture.observe("claude", "https://claude.ai/settings", "", "navigation");
    capture.observe("claude", claudeUrl, "", "navigation");
    expect(
      library.snapshot().chats.find((chat) => chat.provider === "claude")
        ?.spaceId,
    ).toBeNull();
  });
  it("does not immediately recapture a removed local entry on title events or reload", () => {
    library.capture("chatgpt", chatgptUrl, "Plan", null, true);
    const chat = library.snapshot().chats[0]!;
    const capture = new ConversationCapture(library);
    library.edit({ type: "chat:remove", id: chat.id });
    capture.removed("chatgpt", chat.url);
    capture.observe("chatgpt", chatgptUrl, "Changed title", "title");
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    expect(library.snapshot().chats).toHaveLength(0);
    capture.observe("chatgpt", "https://chatgpt.com/", "", "navigation");
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    expect(library.snapshot().chats).toHaveLength(1);
  });
});

describe("capture event ordering and recency", () => {
  it("captures a meaningful title when the native title event precedes the URL event", () => {
    const space = createSpace();
    const capture = new ConversationCapture(library);
    capture.begin("chatgpt", space.id);
    capture.observe("chatgpt", "https://chatgpt.com/", "", "navigation");
    capture.observe(
      "chatgpt",
      chatgptUrl,
      "Early useful title - ChatGPT",
      "title",
    );
    expect(library.snapshot().chats).toHaveLength(0);
    capture.observe("chatgpt", chatgptUrl, "", "navigation");
    expect(library.snapshot().chats[0]).toMatchObject({
      title: "Early useful title",
      spaceId: space.id,
    });
  });
  it("sorts by the latest opening or edit while retaining creation timestamps", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
      library.capture("chatgpt", chatgptUrl, "First", null, true);
      const first = library.snapshot().chats[0]!;
      vi.setSystemTime(new Date("2026-11-12T11:00:00Z"));
      library.capture("claude", claudeUrl, "Second", null, true);
      expect(library.snapshot().chats[0]?.provider).toBe("claude");
      vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
      library.capture("chatgpt", chatgptUrl, "", null, true);
      expect(library.snapshot().chats[0]?.id).toBe(first.id);
      expect(library.getChat(first.id).createdAt).toBe(first.createdAt);
      const second = library
        .snapshot()
        .chats.find((chat) => chat.provider === "claude")!;
      vi.setSystemTime(new Date("2026-11-12T13:00:00Z"));
      library.edit({ type: "chat:rename", id: second.id, name: "Edited" });
      expect(library.snapshot().chats[0]?.id).toBe(second.id);
    } finally {
      vi.useRealTimers();
    }
  });
});
