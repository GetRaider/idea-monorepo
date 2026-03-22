import axios, { AxiosHeaders, RawAxiosRequestHeaders } from "axios";
import { logger } from "./logger.helper";
import { primitiveHelper } from "@repo/shared";

export interface IHttpRequest {
  url: string;
  headers?:
    | RawAxiosRequestHeaders
    | Record<string, string | string[] | number | boolean | null>;
  body?: unknown;
  timeout?: number;
}

export interface IHttpResponse<T> {
  data: T;
  headers: unknown;
  status: number;
  config: unknown;
}

export interface IBaseRequest {
  queries?: Record<string, string>;
  pathParams?: string[];
  body?: unknown;
  timeout?: number;
  token?: string;
}

interface IHttpClient {
  get<T>(args: IHttpRequest): Promise<IHttpResponse<T>>;
  post<T>(args: IHttpRequest): Promise<IHttpResponse<T>>;
  put<T>(args: IHttpRequest): Promise<IHttpResponse<T>>;
  patch<T>(args: IHttpRequest): Promise<IHttpResponse<T>>;
  delete<T>(args: IHttpRequest): Promise<IHttpResponse<T>>;
}

export class HttpClient implements IHttpClient {
  async get<T>(args: IHttpRequest): Promise<IHttpResponse<T>> {
    return this.sendRequest<T>("GET", args);
  }

  async post<T>(args: IHttpRequest): Promise<IHttpResponse<T>> {
    return this.sendRequest<T>("POST", args);
  }

  async put<T>(args: IHttpRequest): Promise<IHttpResponse<T>> {
    return this.sendRequest<T>("PUT", args);
  }

  async patch<T>(args: IHttpRequest): Promise<IHttpResponse<T>> {
    return this.sendRequest<T>("PATCH", args);
  }

  async delete<T>(args: IHttpRequest): Promise<IHttpResponse<T>> {
    return this.sendRequest<T>("DELETE", args);
  }

  private async sendRequest<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    { url, headers, body, timeout = 0 }: IHttpRequest,
  ): Promise<IHttpResponse<T>> {
    const requestConfig = {
      url,
      method,
      data: body,
      timeout,
      headers:
        headers instanceof AxiosHeaders
          ? headers
          : new AxiosHeaders(headers ?? {}),
    };
    try {
      const response = await axios.request(requestConfig);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        config: response.config,
      };
    } catch (error) {
      // TODO: Think about better error handling on different levels besides here.
      const errorMessage = `Failed to send request.\nRequest: ${primitiveHelper.jsonStringify(requestConfig)}\nError: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export const httpClient = new HttpClient();
