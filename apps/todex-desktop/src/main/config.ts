import type { ReadinessTarget } from "./readiness";

export const DEFAULT_WEB_URL = "http://localhost:3002";
export const DEFAULT_API_URL = "http://localhost:8091";

export function readDesktopConfig(
  env: Record<string, string | undefined>,
): DesktopConfig {
  const webUrl = normalizeBaseUrl(
    env.TODEX_WEB_URL,
    "TODEX_WEB_URL",
    DEFAULT_WEB_URL,
  );
  const apiUrl = normalizeBaseUrl(
    env.TODEX_API_URL,
    "TODEX_API_URL",
    DEFAULT_API_URL,
  );
  return {
    webUrl,
    apiUrl,
    allowedOrigins: [...new Set([originOf(webUrl), originOf(apiUrl)])],
    targets: [
      { name: "api", url: `${apiUrl}/health` },
      { name: "web", url: `${webUrl}/sign-in` },
    ],
  };
}

function normalizeBaseUrl(
  value: string | undefined,
  name: string,
  fallback: string,
): string {
  const candidate = value?.trim() || fallback;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must be an absolute http(s) URL`);
  }
  if (url.username || url.password) {
    throw new Error(`${name} must not include credentials`);
  }
  const pathname = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname}`;
}

function originOf(baseUrl: string): string {
  return new URL(baseUrl).origin;
}

export type DesktopConfig = {
  webUrl: string;
  apiUrl: string;
  allowedOrigins: readonly string[];
  targets: readonly ReadinessTarget[];
};
