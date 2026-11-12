import type { DraftStatus, Provider } from "../shared";
import { conversationUrl, isNewChatPage } from "./conversation";

export class DraftHandoff {
  private drafts = new Map<Provider, PendingDraft>();
  private statuses: Partial<Record<Provider, DraftStatus>> = {};

  constructor(
    private target: (provider: Provider) => DraftTarget,
    private changed: (statuses: Partial<Record<Provider, DraftStatus>>) => void,
  ) {}

  queue(provider: Provider, text: string): void {
    this.clear(provider);
    this.drafts.set(provider, {
      text,
      attempts: 0,
      inserting: false,
      armed: false,
    });
    this.status(provider, "waiting");
  }

  arm(provider: Provider): void {
    const draft = this.drafts.get(provider);
    if (draft) draft.armed = true;
    this.observe(provider);
  }

  observe(provider: Provider): void {
    const draft = this.drafts.get(provider);
    const target = this.target(provider);
    if (conversationUrl(provider, target.getURL()) && (!draft || draft.armed)) {
      if (draft) this.status(provider, "unavailable");
      else if (this.statuses[provider]) this.clear(provider);
      return;
    }
    if (!draft?.armed) return;
    if (this.statuses[provider] === "waiting") void this.insert(provider);
  }

  async retry(provider: Provider): Promise<void> {
    const draft = this.drafts.get(provider);
    if (!draft) return;
    draft.attempts = 0;
    draft.armed = true;
    this.status(provider, "waiting");
    await this.insert(provider);
  }

  text(provider: Provider): string | null {
    return this.drafts.get(provider)?.text ?? null;
  }

  clear(provider: Provider): void {
    const draft = this.drafts.get(provider);
    if (draft?.timer) clearTimeout(draft.timer);
    this.drafts.delete(provider);
    delete this.statuses[provider];
    this.changed({ ...this.statuses });
  }

  dispose(): void {
    for (const provider of this.drafts.keys()) this.clear(provider);
  }

  private async insert(provider: Provider): Promise<void> {
    const draft = this.drafts.get(provider);
    const target = this.target(provider);
    if (
      !draft?.armed ||
      draft.inserting ||
      !target.active() ||
      target.isLoading() ||
      !isNewChatPage(provider, target.getURL())
    )
      return;
    if (draft.timer) clearTimeout(draft.timer);
    draft.inserting = true;
    try {
      const result: unknown = await target.executeJavaScript(
        focusComposerScript(provider),
      );
      if (this.drafts.get(provider) !== draft) return;
      if (result === "occupied") {
        this.status(provider, "occupied");
        return;
      }
      if (
        result === "focused" &&
        target.active() &&
        isNewChatPage(provider, target.getURL())
      ) {
        await target.insertText(draft.text);
        if (this.drafts.get(provider) !== draft) return;
        this.drafts.delete(provider);
        this.status(provider, "ready");
        return;
      }
      draft.attempts += 1;
      if (draft.attempts >= 20) {
        this.status(provider, "unavailable");
        return;
      }
      draft.timer = setTimeout(() => {
        void this.insert(provider);
      }, 500);
    } catch {
      if (this.drafts.get(provider) === draft)
        this.status(provider, "unavailable");
    } finally {
      draft.inserting = false;
    }
  }

  private status(provider: Provider, status: DraftStatus): void {
    this.statuses[provider] = status;
    this.changed({ ...this.statuses });
  }
}

// Only inspect/focus the draft field; text enters through Electron's native insertText.
export function focusComposerScript(provider: Provider): string {
  const origin =
    provider === "chatgpt" ? "https://chatgpt.com" : "https://claude.ai";
  const selectors =
    provider === "chatgpt"
      ? '#prompt-textarea[contenteditable="true"], textarea#prompt-textarea'
      : 'div[contenteditable="true"][data-testid="chat-input"], div[contenteditable="true"].ProseMirror, div[contenteditable="true"][role="textbox"]';
  return `(() => {
    if (location.origin !== ${JSON.stringify(origin)} || !${provider === "chatgpt" ? "/^\\/$/" : "/^\\/(new\\/?)?$/"} .test(location.pathname)) return 'wrong-page';
    const editor = Array.from(document.querySelectorAll(${JSON.stringify(selectors)})).find(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && !element.closest('[aria-hidden="true"]') && !element.disabled && !element.readOnly;
    });
    if (!editor) return 'missing';
    if ((editor.value ?? editor.textContent ?? '').trim()) return 'occupied';
    editor.focus();
    if (document.activeElement !== editor) return 'missing';
    return 'focused';
  })()`;
}

interface PendingDraft {
  text: string;
  armed: boolean;
  attempts: number;
  inserting: boolean;
  timer?: ReturnType<typeof setTimeout>;
}
export interface DraftTarget {
  active: () => boolean;
  getURL: () => string;
  isLoading: () => boolean;
  executeJavaScript: (script: string) => Promise<unknown>;
  insertText: (text: string) => Promise<void>;
}
