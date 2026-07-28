import type { ReactNode } from 'react';
import { FilterX, Inbox } from 'lucide-react';
import type { QueryState } from '@/lib/useMockQuery';
import { EmptyState, ErrorState, SkeletonPanel } from '@/ds/Feedback';
import { Notice } from '@/ds/Notice';
import { Button } from '@/ds/Button';

interface EmptyCopy {
  title: string;
  description?: string;
  action?: ReactNode;
}

interface NoResultsCopy {
  /** Verdadeiro quando há filtro aplicado: distingue "sem resultados" de "sem dados". */
  active: boolean;
  onClear: () => void;
  title?: string;
  description?: string;
}

/**
 * Aplica a matriz de estados da seção 21 do DS — loading, empty, no-results,
 * partial e error — para que nenhuma tela invente seu próprio tratamento.
 *
 * Revalidação (refetch com `data` ainda presente) NÃO troca o conteúdo por
 * skeleton: o operador continua vendo o último snapshot enquanto a nova
 * resposta chega. Skeleton só aparece na primeira carga.
 *
 * Filtro no cliente que zera a lista: passe `filteredEmpty` junto com
 * `noResults.active`. O serviço devolveu sucesso, mas a tela não tem o que
 * mostrar — o boundary cobre isso sem a página repetir EmptyState.
 */
export function QueryBoundary<T>({
  query,
  children,
  loadingRows = 4,
  empty,
  noResults,
  filteredEmpty = false,
  onRetry,
  idle,
}: {
  query: QueryState<T> & { reload: () => void };
  children: (data: T) => ReactNode;
  loadingRows?: number;
  empty?: EmptyCopy;
  noResults?: NoResultsCopy;
  /** Lista carregada, mas o filtro do cliente zerou o resultado. */
  filteredEmpty?: boolean;
  onRetry?: () => void;
  /** Conteúdo enquanto a query está `idle` e sem dados (ex.: simulador aguardando envio). */
  idle?: ReactNode;
}) {
  const waitingFirstPaint =
    (query.status === 'idle' || query.status === 'loading') && !query.data;

  if (waitingFirstPaint) {
    if (query.status === 'idle' && idle !== undefined) return <>{idle}</>;
    return <SkeletonPanel rows={loadingRows} />;
  }

  if (query.status === 'error') {
    return (
      <ErrorState
        description={query.error?.message}
        correlationId={query.error?.correlationId}
        onRetry={onRetry ?? query.reload}
      />
    );
  }

  if (query.status === 'empty' || !query.data) {
    if (noResults?.active) {
      return (
        <EmptyState
          icon={<FilterX size={28} aria-hidden="true" />}
          title={noResults.title ?? 'Nenhum resultado para os filtros aplicados.'}
          description={
            noResults.description ??
            'Os filtros atuais excluíram todos os registros. Limpe os filtros para ver a base completa.'
          }
          action={
            <Button variant="secondary" onClick={noResults.onClear}>
              Limpar filtros
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={<Inbox size={28} aria-hidden="true" />}
        title={empty?.title ?? 'Nada para exibir ainda.'}
        description={
          empty?.description ??
          'Nenhum registro foi produzido para este contexto. A tela volta a preencher assim que o serviço enviar dados.'
        }
        action={empty?.action}
      />
    );
  }

  if (filteredEmpty && noResults?.active) {
    return (
      <EmptyState
        icon={<FilterX size={28} aria-hidden="true" />}
        title={noResults.title ?? 'Nenhum resultado para os filtros aplicados.'}
        description={
          noResults.description ??
          'Os filtros atuais excluíram todos os registros. Limpe os filtros para ver a base completa.'
        }
        action={
          <Button variant="secondary" onClick={noResults.onClear}>
            Limpar filtros
          </Button>
        }
      />
    );
  }

  return (
    <>
      {query.status === 'partial' ? (
        <Notice
          tone="warning"
          className="mb-4"
          title="Resposta parcial"
          actions={
            <Button variant="secondary" size="sm" onClick={onRetry ?? query.reload}>
              Recarregar
            </Button>
          }
        >
          {query.degraded} não respondeu. Os números abaixo usam as fontes restantes e podem mudar
          quando a fonte voltar — não use como base para decisão definitiva.
        </Notice>
      ) : null}
      {children(query.data)}
    </>
  );
}
