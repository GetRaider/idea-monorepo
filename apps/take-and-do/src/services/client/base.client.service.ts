import {
  HttpClient,
  type IBaseRequest,
  type IHttpResponse,
} from "@repo/api/client";

import { urlHelper } from "@repo/shared";

export class BaseClientService {
  protected readonly httpClient = new HttpClient();
  protected readonly baseUrl = "/api";
  protected readonly defaultHeaders = {
    // TODO: Define default headers
    // Accept: "*/*",
    // "Accept-Encoding": "gzip, deflate, br",
    // "Accept-Language": "en-US,en;q=0.9",
    // "User-Agent": "Mozilla/5.0",
    // Connection: "keep-alive",
  };

  protected constructor(protected readonly relativeUrl: string) {}

  protected async get<T>({
    pathParams,
    queries,
    token,
  }: IBaseRequest = {}): Promise<IHttpResponse<T>> {
    return this.httpClient.get({
      url: this.getUrl(pathParams, queries),
      headers: this.getDefaultHeaders(token),
    });
  }

  // protected async getAtPath<T>(
  //   pathSegments: string[],
  //   queries: Record<string, string> = {},
  // ): Promise<IHttpResponse<T>> {
  //   const url = urlHelper.construct({
  //     base: this.baseUrl,
  //     params: pathSegments,
  //     queries,
  //   });
  //   return this.httpClient.get({
  //     url,
  //     headers: this.getDefaultHeaders(),
  //   });
  // }

  protected async post<T>({
    body,
    pathParams,
    queries,
    token,
  }: IBaseRequest = {}): Promise<IHttpResponse<T>> {
    return this.httpClient.post({
      url: this.getUrl(pathParams, queries),
      headers: this.getDefaultHeaders(token),
      body,
    });
  }

  protected async put<T>({
    pathParams,
    queries,
    body,
    token,
  }: IBaseRequest = {}): Promise<IHttpResponse<T>> {
    return this.httpClient.put({
      url: this.getUrl(pathParams, queries),
      headers: this.getDefaultHeaders(token),
      body,
    });
  }

  protected async patch<T>({
    pathParams,
    queries,
    body,
    token,
  }: IBaseRequest = {}): Promise<IHttpResponse<T>> {
    return this.httpClient.patch({
      url: this.getUrl(pathParams, queries),
      headers: this.getDefaultHeaders(token),
      body,
    });
  }

  protected async delete<T>({
    pathParams,
    queries,
    token,
    body,
  }: IBaseRequest = {}): Promise<IHttpResponse<T>> {
    return this.httpClient.delete({
      url: this.getUrl(pathParams, queries),
      headers: this.getDefaultHeaders(token),
      body,
    });
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
}
