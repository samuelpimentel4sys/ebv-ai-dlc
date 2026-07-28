import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HttpError } from '@/lib/httpClient';

/** Estados exigidos pela seção 21 do DS para todo componente de dados. */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'empty' | 'partial' | 'error';

export interface ApiErrorShape {
  status: number;
  error: string;
  message: string;
  path: string;
  correlationId: string;
}

export interface QueryState<T> {
  status: QueryStatus;
  data: T | null;
  error: ApiErrorShape | null;
  /** Fonte indisponível quando `status === 'partial'`. */
  degraded?: string;
}

interface Options<T> {
  /** Latência simulada da chamada, em ms. */
  latency?: number;
  /** Considera resposta vazia (renderiza EmptyState). */
  isEmpty?: (data: T) => boolean;
  /** Resposta servida com alguma fonte indisponível; recebe o nome da fonte. */
  isPartial?: (data: T) => string | null;
  /** Falha simulada — usada nas telas de demonstração de erro. */
  failWith?: ApiErrorShape;
  /** Dependências que disparam refetch. */
  deps?: unknown[];
  /** Intervalo de repolling, em ms. */
  refetchInterval?: number;
  /** Mantém a query em `idle` até o pré-requisito ser atendido. */
  enabled?: boolean;
}

function newCorrelationId(): string {
  return `prisma-${Math.random().toString(16).slice(2, 10)}`;
}

export type DemoState = 'error' | 'empty' | 'partial';

const DEMO_STATES: DemoState[] = ['error', 'empty', 'partial'];

/**
 * Permite demonstrar os estados de exceção de qualquer tela pela URL
 * (`?state=error`, `?state=empty` ou `?state=partial`) sem alterar o mock da tela.
 */
export function demoStateFromUrl(search?: string): DemoState | null {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const value = new URLSearchParams(source).get('state') as DemoState | null;
  return value && DEMO_STATES.includes(value) ? value : null;
}

export function makeApiError(path: string, status = 503): ApiErrorShape {
  return {
    status,
    error: status === 403 ? 'Forbidden' : 'Service Unavailable',
    message:
      status === 403
        ? 'Seu perfil não tem permissão para esta operação.'
        : 'O serviço não respondeu no tempo esperado. Tente novamente.',
    path,
    correlationId: newCorrelationId(),
  };
}

/**
 * Executa um loader mock com a máquina de estados prevista nas US-FE
 * (idle → loading → success | empty | error), com abort no unmount.
 */
export function useMockQuery<T>(
  loader: () => T | Promise<T>,
  options: Options<T> = {},
): QueryState<T> & { reload: () => void; setData: (updater: (current: T) => T) => void } {
  const {
    latency = 420,
    isEmpty,
    isPartial,
    failWith,
    deps = [],
    refetchInterval,
    enabled = true,
  } = options;
  const [state, setState] = useState<QueryState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    const demo = demoStateFromUrl();
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      const forcedError = failWith ?? (demo === 'error' ? makeApiError(window.location.pathname) : null);
      if (forcedError) {
        setState({ status: 'error', data: null, error: forcedError });
        return;
      }
      try {
        const data = await loaderRef.current();
        if (cancelled) return;
        if (demo === 'empty') {
          setState({ status: 'empty', data: null, error: null });
          return;
        }
        if (isEmpty?.(data)) {
          setState({ status: 'empty', data, error: null });
          return;
        }
        const degraded = demo === 'partial' ? 'Bureau parceiro' : (isPartial?.(data) ?? null);
        setState(
          degraded
            ? { status: 'partial', data, error: null, degraded }
            : { status: 'success', data, error: null },
        );
      } catch (caught) {
        if (cancelled) return;
        setState({
          status: 'error',
          data: null,
          error: caught instanceof HttpError ? caught.shape : makeApiError('/api/v1/mock'),
        });
      }
    }, latency);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, nonce, latency, failWith, enabled]);

  useEffect(() => {
    if (!refetchInterval) return;
    const id = window.setInterval(() => setNonce((value) => value + 1), refetchInterval);
    return () => window.clearInterval(id);
  }, [refetchInterval]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const setData = useCallback((updater: (current: T) => T) => {
    setState((prev) => (prev.data ? { ...prev, data: updater(prev.data) } : prev));
  }, []);

  // A demonstração de estado é resolvida por URL, então precisa refazer a query
  // quando o operador entra ou sai de `?state=` sem recarregar a página.
  const demo = demoStateFromUrl();
  const lastDemo = useRef(demo);
  useEffect(() => {
    if (lastDemo.current === demo) return;
    lastDemo.current = demo;
    setNonce((value) => value + 1);
  }, [demo]);

  return { ...state, reload, setData };
}
