// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AiroveApi, HubState } from "../../shared";
import { App } from "./App";

let root: Root;
let container: HTMLDivElement;
let snapshot: HubState;
let listener: ((state: HubState) => void) | undefined;
let api: AiroveApi;

beforeEach(async () => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  snapshot = createState();
  api = {
    getState: vi.fn(async () => snapshot),
    subscribe: vi.fn((callback) => {
      listener = callback;
      return () => {
        listener = undefined;
      };
    }),
    select: vi.fn(async (provider) => {
      snapshot = { ...snapshot, selected: provider };
      listener?.(snapshot);
      return snapshot;
    }),
    selectSpace: vi.fn(async (spaceId) => {
      snapshot = { ...snapshot, selectedSpaceId: spaceId };
      listener?.(snapshot);
      return snapshot;
    }),
    showComposer: vi.fn(async (composing) => {
      snapshot = { ...snapshot, composing };
      listener?.(snapshot);
    }),
    newChat: vi.fn(async () => {}),
    retryDraft: vi.fn(async () => {}),
    copyDraft: vi.fn(async () => {}),
    dismissDraft: vi.fn(async () => {}),
    requestMicrophone: vi.fn(async () => true),
    openChat: vi.fn(async () => {}),
    editLibrary: vi.fn(async () => {}),
    navigate: vi.fn(async () => {}),
  };
  window.airove = api;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<App />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

function button(text: string): HTMLButtonElement {
  const element = [...container.querySelectorAll("button")].find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!element) throw new Error(`Missing button: ${text}`);
  return element;
}
async function click(element: HTMLElement) {
  await act(async () => element.click());
}
async function change(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) {
  await act(async () => {
    const prototype =
      element instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLSelectElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
      element,
      value,
    );
    element.dispatchEvent(
      new Event(element instanceof HTMLSelectElement ? "change" : "input", {
        bubbles: true,
      }),
    );
  });
}
function savedChats() {
  return container.querySelector('section[aria-label="Saved chats"]')!;
}

function createState(): HubState {
  const now = "2026-11-12T00:00:00.000Z";
  const providerState = {
    title: "",
    loading: false,
    canGoBack: false,
    canGoForward: false,
    conversation: false,
    timestamp: now,
    error: null,
  };
  return {
    composing: false,
    drafts: {},
    selected: "chatgpt",
    selectedSpaceId: null,
    metadataError: null,
    providers: {
      chatgpt: {
        ...providerState,
        provider: "chatgpt",
        url: "https://chatgpt.com/",
      },
      claude: {
        ...providerState,
        provider: "claude",
        url: "https://claude.ai/",
      },
    },
    library: {
      lastProvider: "chatgpt",
      folders: [
        { id: "folder", name: "Products", createdAt: now, updatedAt: now },
      ],
      spaces: [
        {
          id: "space",
          name: "Project",
          folderId: "folder",
          preferredProvider: "claude",
          createdAt: now,
          updatedAt: now,
        },
      ],
      chats: [
        {
          id: "chat-one",
          provider: "chatgpt",
          url: "https://chatgpt.com/c/one",
          title: "Project planning",
          spaceId: "space",
          createdAt: now,
          updatedAt: now,
          lastOpenedAt: now,
        },
        {
          id: "chat-two",
          provider: "claude",
          url: "https://claude.ai/chat/two",
          title: "Unassigned research",
          spaceId: null,
          createdAt: now,
          updatedAt: now,
          lastOpenedAt: now,
        },
      ],
    },
  };
}

describe("Space-first library UI", () => {
  it("shows both providers in All Chats and filters by Space without opening or resetting a chat", async () => {
    expect(savedChats().textContent).toContain("Project planning");
    expect(savedChats().textContent).toContain("Unassigned research");
    await click(button("Project"));
    expect(api.selectSpace).toHaveBeenCalledWith("space");
    expect(savedChats().textContent).toContain("Project planning");
    expect(savedChats().textContent).not.toContain("Unassigned research");
    expect(api.openChat).not.toHaveBeenCalled();
    expect(api.newChat).not.toHaveBeenCalled();
    await click(
      [...container.querySelectorAll("button")].find((element) =>
        element.textContent?.startsWith("All Chats"),
      )!,
    );
    expect(savedChats().textContent).toContain("Unassigned research");
  });
  it("uses explicit provider selection and New Chat, and reopens saved chats by ID", async () => {
    await click(button("Claude"));
    expect(api.select).toHaveBeenCalledWith("claude");
    expect(button("Claude").getAttribute("aria-pressed")).toBe("true");
    await click(button("New Chat"));
    expect(api.newChat).not.toHaveBeenCalled();
    expect(api.showComposer).toHaveBeenCalledWith(true);
    await change(container.querySelector("textarea")!, "My first question");
    await change(container.querySelector('[aria-label="Space"]')!, "space");
    await click(button("Continue in Claude →"));
    expect(api.newChat).toHaveBeenCalledWith({
      provider: "claude",
      spaceId: "space",
      text: "My first question",
    });
    const open = [...savedChats().querySelectorAll("button")].find((element) =>
      element.textContent?.includes("Project planning"),
    )!;
    await click(open);
    expect(api.openChat).toHaveBeenCalledWith("chat-one");
  });
  it("creates Folders and Spaces using scoped metadata commands", async () => {
    await click(button("+ Folder"));
    await change(container.querySelector("input")!, "New folder");
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(api.editLibrary).toHaveBeenCalledWith({
      type: "folder:create",
      name: "New folder",
    });
    await click(button("+ Space"));
    await change(container.querySelector("input")!, "New Space");
    await change(container.querySelector("select")!, "folder");
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(api.editLibrary).toHaveBeenCalledWith({
      type: "space:create",
      name: "New Space",
      folderId: "folder",
    });
  });
  it("moves chats out of a Space and removes only their local record", async () => {
    await click(
      container.querySelector('[aria-label="Edit chat Project planning"]')!,
    );
    await change(container.querySelector("select")!, "");
    await click(button("Move"));
    expect(api.editLibrary).toHaveBeenCalledWith({
      type: "chat:move",
      id: "chat-one",
      spaceId: null,
    });
    await click(
      container.querySelector('[aria-label="Edit chat Project planning"]')!,
    );
    expect(container.textContent).toContain(
      "The provider conversation is kept.",
    );
    await click(button("Remove local chat"));
    expect(api.editLibrary).toHaveBeenCalledWith({
      type: "chat:remove",
      id: "chat-one",
    });
  });
  it("shows an action error and retains the displayed library on failure", async () => {
    vi.mocked(api.newChat).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    await click(button("New Chat"));
    await change(container.querySelector("textarea")!, "Keep this draft");
    await click(button("Continue in ChatGPT →"));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not open the provider",
    );
    expect(savedChats().textContent).toContain("Project planning");
  });
});
