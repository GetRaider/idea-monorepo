import { providers, type Provider } from "../shared";

export function isHttps(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isProviderOrigin(provider: Provider, value: string): boolean {
  try {
    return new URL(value).origin === new URL(providers[provider]).origin;
  } catch {
    return false;
  }
}

export function isEmbeddedDestination(
  provider: Provider,
  value: string,
): boolean {
  if (!isHttps(value)) return false;
  const hostname = new URL(value).hostname;
  const hosts =
    provider === "chatgpt"
      ? [
          "chatgpt.com",
          "auth.openai.com",
          "auth0.openai.com",
          "accounts.google.com",
          "appleid.apple.com",
          "login.microsoftonline.com",
          "login.live.com",
        ]
      : ["claude.ai", "accounts.google.com", "appleid.apple.com"];
  return new URL(value).port === "" && hosts.includes(hostname);
}

// Never expose OAuth callback paths, query strings, fragments or conversation IDs in logs.
export function safeUrl(value: string): string {
  if (!isHttps(value)) return "[non-HTTPS URL]";
  const url = new URL(value);
  const conversation = /^\/(c|chat)\/[^/]+/.test(url.pathname);
  return `${url.origin}${conversation ? "/[conversation]" : "/"}`;
}

export function isConversation(provider: Provider, value: string): boolean {
  return (
    isProviderOrigin(provider, value) &&
    /^\/(c|chat)\/[^/]+/.test(new URL(value).pathname)
  );
}
