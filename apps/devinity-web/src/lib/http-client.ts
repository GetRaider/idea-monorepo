import { HttpClient } from "@repo/api/client";

import { env } from "./env";

const http = new HttpClient();

const baseURL = env.api.baseUrl.replace(/\/$/, "");

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseURL}${p}`;
}

export const api = {
  get<T>(path: string) {
    return http.get<T>({
      url: resolveUrl(path),
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
  },
};
