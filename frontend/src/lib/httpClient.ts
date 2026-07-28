import { apiBaseUrl } from '@/lib/config';
import type { ApiErrorShape } from '@/lib/useMockQuery';

function newCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `prisma-${Math.random().toString(16).slice(2, 10)}`;
}

export class HttpError extends Error {
  readonly shape: ApiErrorShape;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'HttpError';
    this.shape = shape;
  }
}

export interface HttpOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip JSON parse (204 / empty). */
  empty?: boolean;
}

/**
 * Único ponto HTTP do FE. Sempre envia `X-Correlation-ID`.
 * Nunca usar fetch direto nas pages.
 */
export async function httpClient<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const correlationId = newCorrelationId();
  const headers = new Headers(options.headers);
  headers.set('X-Correlation-ID', correlationId);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const bearer = import.meta.env.VITE_API_BEARER;
  if (bearer && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${bearer}`);
  }

  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = response.statusText || 'Erro na API';
    let error = 'HttpError';
    let details: string[] = [];
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
        details?: string[];
        correlationId?: string;
        path?: string;
      };
      message = payload.message ?? message;
      error = payload.error ?? error;
      details = payload.details ?? [];
      throw new HttpError({
        status: response.status,
        error,
        message: details.length ? `${message} (${details.join('; ')})` : message,
        path: payload.path ?? path,
        correlationId: payload.correlationId ?? correlationId,
      });
    } catch (caught) {
      if (caught instanceof HttpError) throw caught;
      throw new HttpError({
        status: response.status,
        error,
        message,
        path,
        correlationId,
      });
    }
  }

  if (options.empty || response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
