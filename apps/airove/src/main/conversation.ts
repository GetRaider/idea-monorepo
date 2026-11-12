import { newChatUrls, providers, type Provider } from "../shared";

export function conversationUrl(
  provider: Provider,
  value: string,
): string | null {
  try {
    const url = new URL(value);
    if (
      url.origin !== new URL(providers[provider]).origin ||
      url.username ||
      url.password
    )
      return null;
    // ChatGPT also puts project conversations under /g/<project-or-GPT>/c/<id>.
    const pattern =
      provider === "chatgpt"
        ? /^\/(?:g\/[A-Za-z0-9_-]+\/)?c\/([A-Za-z0-9_-]+)\/?$/
        : /^\/chat\/([A-Za-z0-9_-]+)\/?$/;
    const identifier = pattern.exec(url.pathname)?.[1];
    if (!identifier) return null;
    return `${new URL(providers[provider]).origin}/${provider === "chatgpt" ? "c" : "chat"}/${identifier}`;
  } catch {
    return null;
  }
}

export function isNewChatPage(provider: Provider, value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.origin === new URL(newChatUrls[provider]).origin &&
      (url.pathname === "/" ||
        (provider === "claude" && /^\/new\/?$/.test(url.pathname)))
    );
  } catch {
    return false;
  }
}

export function meaningfulTitle(
  provider: Provider,
  value: string,
): string | null {
  const title = value
    .trim()
    .replace(/\s+[-–—|]\s+(ChatGPT|Claude)$/i, "")
    .trim();
  if (
    !title ||
    /^(chatgpt|claude|new chat|new conversation|untitled|loading[.…]*|just a moment[.…]*)$/i.test(
      title,
    )
  )
    return null;
  if (title === new URL(providers[provider]).hostname) return null;
  return title.slice(0, 240);
}
