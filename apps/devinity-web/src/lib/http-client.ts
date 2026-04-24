import { httpClient, type IHttpResponse } from "@repo/api/client";

import { env } from "./env";

const baseURL = env.api.baseUrl.replace(/\/$/, "");

export const api = {
  async get<T>(path: string) {
    const res = await httpClient.get<T>({
      url: resolveUrl(path),
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return throwIfNotOk(res);
  },
};

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseURL}${p}`;
}

function throwIfNotOk<T>(res: IHttpResponse<T>): IHttpResponse<T> {
  if (res.status < 400) return res;
  const body = res.data as unknown;
  let message = `Request failed (${res.status})`;
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) message = m;
  }
  throw new Error(message);
}
