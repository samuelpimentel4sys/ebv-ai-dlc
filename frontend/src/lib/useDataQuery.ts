import { isLiveMode } from '@/lib/config';
import { HttpError } from '@/lib/httpClient';
import {
  makeApiError,
  useMockQuery,
  type ApiErrorShape,
  type QueryState,
} from '@/lib/useMockQuery';

type Options<T> = {
  latency?: number;
  isEmpty?: (data: T) => boolean;
  isPartial?: (data: T) => string | null;
  failWith?: ApiErrorShape;
  deps?: unknown[];
  refetchInterval?: number;
  enabled?: boolean;
};

/**
 * Alterna mock ↔ live preservando a máquina de estados do DS (§21).
 * Em live, latência simulada = 0; erros HTTP viram `ApiErrorShape`.
 */
export function useDataQuery<T>(
  mockLoader: () => T | Promise<T>,
  liveLoader: () => Promise<T>,
  options: Options<T> = {},
): QueryState<T> & { reload: () => void; setData: (updater: (current: T) => T) => void } {
  const live = isLiveMode();
  return useMockQuery(
    async () => {
      try {
        return await (live ? liveLoader() : mockLoader());
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw error;
      }
    },
    {
      ...options,
      latency: live ? 0 : (options.latency ?? 420),
      failWith: options.failWith,
    },
  );
}

/** Converte falha de mutation em mensagem de toast. */
export function errorMessage(error: unknown, fallback = 'Falha na chamada à API'): string {
  if (error instanceof HttpError) return error.shape.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function toApiError(error: unknown, path: string): ApiErrorShape {
  if (error instanceof HttpError) return error.shape;
  return makeApiError(path, 503);
}
