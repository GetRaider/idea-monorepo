const GOOGLE_SIGN_IN_HOSTS = new Set([
  "accounts.google.com",
  "accounts.youtube.com",
  "myaccount.google.com",
]);

export function decideNavigation(
  url: string,
  allowedOrigins: readonly string[],
): NavigationDecision {
  const parsed = parseUrl(url);
  if (!parsed || parsed.username || parsed.password) return "deny";
  if (allowedOrigins.includes(parsed.origin)) return "allow";
  if (parsed.protocol === "https:") return "external";
  return "deny";
}

export function isGoogleSignInUrl(url: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  return (
    parsed.protocol === "https:" &&
    (parsed.port === "" || parsed.port === "443") &&
    !parsed.username &&
    !parsed.password &&
    GOOGLE_SIGN_IN_HOSTS.has(parsed.hostname)
  );
}

export function isStatusDocument(url: string, statusPageUrl: string): boolean {
  const parsed = parseUrl(url);
  const statusPage = parseUrl(statusPageUrl);
  if (!parsed || !statusPage) return false;
  return (
    parsed.origin === statusPage.origin &&
    parsed.pathname === statusPage.pathname
  );
}

export function isStackRetry(url: string, statusPageUrl: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed || parsed.searchParams.get("retry") !== "1") return false;
  return isStatusDocument(url, statusPageUrl);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export type NavigationDecision = "allow" | "external" | "deny";
