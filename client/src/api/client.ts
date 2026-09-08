import { API_BASE_URL } from '../lib/env';
import type { ApiErrorResponse } from './contracts';

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  query?: object;
  body?: unknown;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, `${API_BASE_URL}/`);
  for (const [key, value] of Object.entries(
    (query ?? {}) as Record<string, string | number | boolean | undefined>,
  )) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString().replace(/\/$/, '');
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorResponse | undefined;
  try {
    payload = (await response.json()) as ApiErrorResponse;
  } catch {
    // Keep the transport error useful when the server did not return JSON.
  }

  return new ApiError(
    response.status,
    payload?.error.code ?? 'HTTP_ERROR',
    payload?.error.message ?? `Ошибка запроса (${response.status})`,
    payload?.error.details,
  );
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, method = 'GET', headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  const init: RequestInit = { ...rest, method, headers: requestHeaders };

  if (body !== undefined) {
    requestHeaders.set('content-type', 'application/json');
    init.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), init);
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
