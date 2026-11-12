// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { focusComposerScript } from "../../main/draft";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});
function focus(provider: "chatgpt" | "claude", url: string) {
  return new Function(
    "document",
    "location",
    `return ${focusComposerScript(provider)}`,
  )(document, new URL(url));
}
function visibleEditor(html: string) {
  document.body.innerHTML =
    "<article>Private conversation message</article>" + html;
  const editor = document.querySelector("textarea, [contenteditable]")!;
  vi.spyOn(editor, "getBoundingClientRect").mockReturnValue({
    width: 200,
    height: 100,
  } as DOMRect);
  vi.spyOn(
    document.querySelector("article")!,
    "textContent",
    "get",
  ).mockImplementation(() => {
    throw new Error("Message content must not be read");
  });
  return editor;
}

describe("provider composer targeting", () => {
  it("focuses the empty ChatGPT input without filling or sending anything from JavaScript", () => {
    const editor = visibleEditor('<textarea id="prompt-textarea"></textarea>');
    const submit = vi.fn();
    document.addEventListener("submit", submit);
    expect(focus("chatgpt", "https://chatgpt.com/")).toBe("focused");
    expect(document.activeElement).toBe(editor);
    expect((editor as HTMLTextAreaElement).value).toBe("");
    expect(submit).not.toHaveBeenCalled();
    document.removeEventListener("submit", submit);
  });
  it("supports the native Claude contenteditable composer", () => {
    const editor = visibleEditor(
      '<div class="ProseMirror" contenteditable="true" tabindex="0"></div>',
    );
    expect(focus("claude", "https://claude.ai/new")).toBe("focused");
    expect(document.activeElement).toBe(editor);
  });
  it("refuses existing drafts, conversation pages and other origins", () => {
    visibleEditor('<textarea id="prompt-textarea">Existing draft</textarea>');
    expect(focus("chatgpt", "https://chatgpt.com/")).toBe("occupied");
    expect(focus("chatgpt", "https://chatgpt.com/c/id")).toBe("wrong-page");
    expect(focus("chatgpt", "https://evil.test/")).toBe("wrong-page");
  });
});
