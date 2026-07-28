import type { ReactNode } from 'react';
import { Inbox, RefreshCw, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/ds/Button';

/** Shimmer da seção 22 do DS: gradiente de 3 paradas em 200% de largura. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-4 w-full animate-shimmer rounded-sm bg-[linear-gradient(90deg,rgb(var(--color-border))_25%,rgb(var(--color-surface-subtle))_50%,rgb(var(--color-border))_75%)] bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

export function SkeletonPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-eqx-border bg-eqx-surface p-5 shadow-1"
    >
      <span className="visually-hidden">Carregando dados</span>
      <Skeleton className="mb-4 h-6 w-1/3" />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className={index % 3 === 2 ? 'w-2/3' : 'w-full'} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-md border border-dashed border-eqx-border bg-eqx-surface-subtle px-6 py-10 text-center">
      <span className="text-eqx-text-muted">{icon ?? <Inbox size={28} aria-hidden="true" />}</span>
      <p className="text-lg font-semibold">{title}</p>
      {description ? <p className="max-w-[52ch] text-sm text-eqx-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Não foi possível carregar os dados.',
  description,
  correlationId,
  onRetry,
}: {
  title?: string;
  description?: string;
  correlationId?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="grid place-items-center gap-3 rounded-md border border-eqx-danger/50 bg-eqx-danger-bg/50 px-6 py-10 text-center"
    >
      <span className="text-eqx-danger">
        <ServerCrash size={28} aria-hidden="true" />
      </span>
      <p className="text-lg font-semibold">{title}</p>
      {description ? <p className="max-w-[52ch] text-sm">{description}</p> : null}
      {correlationId ? (
        <p className="text-xs text-eqx-text-muted">
          correlationId <code>{correlationId}</code>
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" icon={<RefreshCw size={16} aria-hidden="true" />} onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
