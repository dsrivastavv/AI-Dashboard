import type { ApiErrorResponse } from '../types/api';

export class ApiHttpError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | undefined;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
  }
}

export interface NormalizedRequestError {
  kind: 'auth' | 'forbidden' | 'not_found' | 'network' | 'http' | 'unknown';
  message: string;
  status?: number;
  loginUrl?: string;
  data?: unknown;
}

function isApiErrorPayload(value: unknown): value is ApiErrorResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'ok' in value &&
      (value as { ok?: unknown }).ok === false &&
      'error' in value &&
      typeof (value as { error?: unknown }).error === 'string',
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text || undefined;
  } catch {
    return undefined;
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  let response: Response;
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    response = await fetch(input, {
      credentials: 'include',
      ...init,
      cache: init.cache ?? 'no-store',
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      error.name = 'NetworkError';
    }
    throw error;
  }

  const body = await parseResponseBody(response);
  if (!response.ok) {
    const message = isApiErrorPayload(body)
      ? body.error
      : `Request failed with status ${response.status}`;
    throw new ApiHttpError(message, response.status, body);
  }

  return body as T;
}

export function normalizeRequestError(error: unknown): NormalizedRequestError {
  if (error instanceof ApiHttpError) {
    const payload = error.data;
    const apiPayload = isApiErrorPayload(payload) ? payload : undefined;

    if (error.status === 401) {
      return {
        kind: 'auth',
        message: apiPayload?.error || 'Authentication required.',
        status: error.status,
        loginUrl:
          typeof apiPayload?.login_url === 'string' && apiPayload.login_url
            ? apiPayload.login_url
            : undefined,
        data: payload,
      };
    }

    if (error.status === 403) {
      return {
        kind: 'forbidden',
        message: apiPayload?.error || 'Access denied.',
        status: error.status,
        data: payload,
      };
    }

    if (error.status === 404) {
      return {
        kind: 'not_found',
        message: apiPayload?.error || error.message,
        status: error.status,
        data: payload,
      };
    }

    return {
      kind: 'http',
      message: apiPayload?.error || error.message,
      status: error.status,
      data: payload,
    };
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { kind: 'unknown', message: 'Request canceled.' };
    }
    if (error.name === 'NetworkError' || error instanceof TypeError) {
      return {
        kind: 'network',
        message: 'Network error. Verify the Django backend is running and reachable via Vite proxy.',
      };
    }
    return { kind: 'unknown', message: error.message };
  }

  return { kind: 'unknown', message: 'Unexpected error.' };
}
