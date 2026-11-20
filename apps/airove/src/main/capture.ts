import { type Provider } from "../shared";
import { conversationUrl, isNewChatPage } from "./conversation";
import type { ChatLibrary } from "./library";
import { isProviderOrigin } from "./policy";

export class ConversationCapture {
  private pending = new Map<Provider, PendingConversation>();
  private suppressed = new Map<Provider, string>();
  private sequence = 0;
  private titles = new Map<Provider, { url: string | null; title: string }>();

  constructor(private library: ChatLibrary) {}

  begin(provider: Provider, spaceId: string | null): number {
    const token = ++this.sequence;
    this.pending.set(provider, { spaceId, ready: false, token });
    this.suppressed.delete(provider);
    this.titles.delete(provider);
    return token;
  }

  cancel(provider: Provider, token?: number): void {
    if (token === undefined || this.pending.get(provider)?.token === token)
      this.pending.delete(provider);
  }

  removed(provider: Provider, url: string): void {
    this.suppressed.set(provider, url);
  }

  observe(
    provider: Provider,
    url: string,
    title: string,
    event: "navigation" | "title",
  ): boolean {
    const canonicalUrl = conversationUrl(provider, url);
    const pending = this.pending.get(provider);
    if (
      event === "navigation" &&
      this.suppressed.get(provider) !== canonicalUrl
    )
      this.suppressed.delete(provider);
    if (canonicalUrl && this.suppressed.get(provider) === canonicalUrl)
      return false;
    if (event === "title") {
      this.titles.set(provider, { url: canonicalUrl, title });
      if (
        pending ||
        !canonicalUrl ||
        !this.library.hasChat(provider, canonicalUrl)
      )
        return false;
      return this.library.capture(provider, canonicalUrl, title, null, false);
    }
    if (isNewChatPage(provider, url)) {
      if (pending) pending.ready = true;
      return false;
    }
    if (!canonicalUrl) {
      // A detour to settings or another provider page abandons the new-chat intent.
      if (pending?.ready && isProviderOrigin(provider, url))
        this.cancel(provider);
      return false;
    }
    const spaceId = pending?.ready ? pending.spaceId : null;
    const observedTitle = this.titles.get(provider);
    const matchingTitle =
      observedTitle?.url === canonicalUrl ? observedTitle.title : "";
    const changed = this.library.capture(
      provider,
      canonicalUrl,
      matchingTitle,
      spaceId,
      true,
    );
    this.cancel(provider);
    return changed;
  }
}

interface PendingConversation {
  spaceId: string | null;
  ready: boolean;
  token: number;
}
