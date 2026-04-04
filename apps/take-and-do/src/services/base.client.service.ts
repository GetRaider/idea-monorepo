"use client";

import {
  HttpClient,
  type IBaseRequest,
  type IHttpResponse,
} from "@repo/api/client";

import { urlHelper } from "@repo/shared";
import type { ApiOk, ApiResult } from "./api-result.types";
import { getAuthRedirectHandlers } from "./auth-redirect.registry";

export class BaseClientService {
  protected readonly httpClient = new HttpClient();
  protected readonly baseUrl = "/api";
  protected readonly defaultHeaders = {
    // TODO: Define default headers
  };

  protected constructor(protected readonly relativeUrl: string) {}

  protected async get<T>({
    pathParams,
    queries,
    token,
  }: IBaseRequest = {}): Promise<ApiResult<T>> {
    const url = this.getUrl(pathParams, queries);
    return this.executeRequest(
      () =>
        this.httpClient.get<T>({
          url,
          headers: this.getDefaultHeaders(token),
        }),
      { method: "GET", url, body: undefined },
    );
  }

  protected async post<T>({
    body,
    pathParams,
    queries,
    token,
  }: IBaseRequest = {}): Promise<ApiResult<T>> {
    const url = this.getUrl(pathParams, queries);
    return this.executeRequest(
      () =>
        this.httpClient.post<T>({
          url,
          headers: this.getDefaultHeaders(token),
          body,
        }),
      { method: "POST", url, body },
    );
  }

  protected async put<T>({
    pathParams,
    queries,
    body,
    token,
  }: IBaseRequest = {}): Promise<ApiResult<T>> {
    const url = this.getUrl(pathParams, queries);
    return this.executeRequest(
      () =>
        this.httpClient.put<T>({
          url,
          headers: this.getDefaultHeaders(token),
          body,
        }),
      { method: "PUT", url, body },
    );
  }

  protected async patch<T>({
    pathParams,
    queries,
    body,
    token,
  }: IBaseRequest = {}): Promise<ApiResult<T>> {
    const url = this.getUrl(pathParams, queries);
    return this.executeRequest(
      () =>
        this.httpClient.patch<T>({
          url,
          headers: this.getDefaultHeaders(token),
          body,
        }),
      { method: "PATCH", url, body },
    );
  }

  protected async delete<T>({
    pathParams,
    queries,
    token,
    body,
  }: IBaseRequest = {}): Promise<ApiResult<T>> {
    const url = this.getUrl(pathParams, queries);
    return this.executeRequest(
      () =>
        this.httpClient.delete<T>({
          url,
          headers: this.getDefaultHeaders(token),
          body,
        }),
      { method: "DELETE", url, body },
    );
  }

  private async executeRequest<T>(
    operation: () => Promise<IHttpResponse<T>>,
    context: {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      url: string;
      body?: unknown;
    },
  ): Promise<ApiResult<T>> {
    try {
      const response = await operation();
      if (response.status >= 200 && response.status < 300) {
        return { ok: true, data: response.data };
      }
      this.reportIfError({ ...context, response });
      return {
        ok: false,
        kind: "http",
        status: response.status,
        body: response.data,
      };
    } catch (error) {
      this.reportTransportFailure({ ...context, error });
      return { ok: false, kind: "transport", cause: error };
    }
  }

  protected isResultOk<T>(result: ApiResult<T>): result is ApiOk<T> {
    return result.ok === true;
  }

  private getUrl(
    pathParams: string[] = [],
    queries: Record<string, string> = {},
  ): string {
    return urlHelper.construct({
      base: `${this.baseUrl}${this.relativeUrl}`,
      params: pathParams,
      queries,
    });
  }

  private getDefaultHeaders(
    token?: string,
    customHeaders: Record<string, string> = {},
  ): Record<string, string> {
    const headers = {
      ...(token
        ? { Authorization: `Bearer ${token}`, ...this.defaultHeaders }
        : { ...this.defaultHeaders }),
    };

    return {
      ...headers,
      ...customHeaders,
    };
  }

  private reportIfError({
    method,
    url,
    body,
    response,
  }: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    body?: unknown;
    response: IHttpResponse<unknown>;
  }) {
    if (response.status >= 200 && response.status < 300) return;

    if (response.status === 401) {
      getAuthRedirectHandlers().onUnauthorized();
      return;
    }

    if (response.status === 403) {
      getAuthRedirectHandlers().onForbidden();
      return;
    }

    const { message, details } = parseApiError(response.data);
    const summary = formatHttpErrorSummary(message, response.status);
    console.error("[API request failed]", {
      method,
      url,
      status: response.status,
      message,
      details,
      body,
      responseData: response.data,
      response,
      summary,
    });
  }

  private reportTransportFailure({
    method,
    url,
    body,
    error,
  }: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    body?: unknown;
    error: unknown;
  }) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API transport failure — no HTTP response]", {
      method,
      url,
      body,
      message,
      error,
    });
  }
}

function parseApiError(data: unknown): { message?: string; details?: string } {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed ? { message: trimmed } : {};
  }
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const error = record.error;
  const details = record.details;
  return {
    message: typeof error === "string" ? error : undefined,
    details: typeof details === "string" ? details : undefined,
  };
}

function formatHttpErrorSummary(
  message: string | undefined,
  status: number,
): string {
  const trimmed = message?.trim();
  if (
    trimmed &&
    trimmed !== "undefined" &&
    trimmed !== "null" &&
    trimmed !== "[object Object]"
  ) {
    return trimmed;
  }
  return `Request failed (${status})`;
}
