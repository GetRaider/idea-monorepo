import Constants from 'expo-constants';

import { errorEnvelopeSchema, type ErrorEnvelope } from '@repo/evolin-shared';

const apiPort = 8092;

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiClientError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Could not reach Evolin API.',
      details: {},
    });
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const parsedError = errorEnvelopeSchema.safeParse(payload);

    throw new ApiClientError(
      parsedError.success
        ? parsedError.data
        : {
            statusCode: response.status,
            code: 'UNKNOWN_ERROR',
            message: 'The request failed.',
            details: {},
          },
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured && !isLoopbackUrl(configured)) return configured;

  const host = metroHostname();
  if (host && !isLoopbackHost(host)) return `http://${host}:${apiPort}`;

  return configured ?? `http://localhost:${apiPort}`;
}

function metroHostname(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;

  const withProtocol = hostUri.includes('://') ? hostUri : `http://${hostUri}`;
  try {
    return new URL(withProtocol).hostname;
  } catch {
    return hostUri.split(':')[0];
  }
}

function isLoopbackUrl(url: string): boolean {
  return url.includes('://localhost') || url.includes('://127.0.0.1');
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(error: ErrorEnvelope) {
    super(error.message);
    this.name = 'ApiClientError';
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.details = error.details;
  }
}
