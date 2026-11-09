import { errorEnvelopeSchema, type ErrorEnvelope } from '@repo/evolin-shared';

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:8092';

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
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
