import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Badge } from '@/ds/Badge';

export function PageHeader({
  usId,
  title,
  description,
  actions,
  meta,
  className,
}: {
  usId?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="brand-bar mb-4 h-1 w-24 rounded-pill" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {usId ? (
            <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-eqx-text-muted">
              {usId}
            </p>
          ) : null}
          <h1 className="text-2xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-[70ch] text-sm text-eqx-text-muted">{description}</p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function SectionTitle({
  number,
  title,
  description,
  actions,
}: {
  number?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-eqx-border pb-3">
      <div>
        {number ? <Badge tone="accent">{number}</Badge> : null}
        <h2 className={cn('text-xl', number && 'mt-2')}>{title}</h2>
        {description ? (
          <p className="mt-1 max-w-[80ch] text-sm text-eqx-text-muted">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function KeyValueList({
  items,
  columns = 2,
  className,
}: {
  items: { label: string; value: ReactNode }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const grid = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[columns];
  return (
    <dl className={cn('grid gap-4', grid, className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-bold uppercase tracking-wide text-eqx-text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
