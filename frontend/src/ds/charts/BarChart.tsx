import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

export interface BarDatum {
  label: string;
  value: number;
  tone?: 'action' | 'success' | 'warning' | 'danger' | 'accent' | 'brand' | 'muted';
  hint?: string;
}

const fills: Record<string, string> = {
  action: 'bg-eqx-action',
  success: 'bg-eqx-success',
  warning: 'bg-eqx-warning',
  danger: 'bg-eqx-danger',
  accent: 'bg-eqx-accent',
  brand: 'bg-eqx-brand',
  muted: 'bg-eqx-border-strong',
};

export function BarChart({
  data,
  ariaLabel,
  unit = '',
  digits = 0,
  className,
  max,
}: {
  data: BarDatum[];
  ariaLabel: string;
  unit?: string;
  digits?: number;
  className?: string;
  max?: number;
}) {
  const ceiling = max ?? Math.max(...data.map((item) => Math.abs(item.value)), 1);
  return (
    /* `group` preserva os rótulos e valores já escritos em texto; `img` os
       silenciaria e deixaria só o resumo do aria-label. */
    <div className={cn('grid gap-3', className)} role="group" aria-label={ariaLabel}>
      {data.map((item) => {
        const pct = Math.min((Math.abs(item.value) / ceiling) * 100, 100);
        return (
          <div key={item.label} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{item.label}</span>
              <span className="tabular-nums text-eqx-text-muted">
                {formatNumber(item.value, digits)}
                {unit}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-pill bg-eqx-surface-subtle">
              <div
                className={cn('h-full rounded-pill', fills[item.tone ?? 'action'])}
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.hint ? <p className="text-xs text-eqx-text-muted">{item.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function ColumnChart({
  data,
  ariaLabel,
  unit = '',
  digits = 0,
  className,
}: {
  data: BarDatum[];
  ariaLabel: string;
  unit?: string;
  digits?: number;
  className?: string;
}) {
  const ceiling = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className={cn('grid gap-2', className)}>
      <div
        className="flex h-48 items-end gap-2 border-b border-eqx-border pb-1"
        role="group"
        aria-label={ariaLabel}
      >
        {data.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-xs tabular-nums text-eqx-text-muted">
              {formatNumber(item.value, digits)}
              {unit}
            </span>
            <div
              className={cn('w-full rounded-t-sm', fills[item.tone ?? 'action'])}
              style={{ height: `${Math.max((item.value / ceiling) * 100, 2)}%` }}
              title={`${item.label}: ${formatNumber(item.value, digits)}${unit}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((item) => (
          <span
            key={item.label}
            className="min-w-0 flex-1 truncate text-center text-xs text-eqx-text-muted"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DivergingBars({
  data,
  ariaLabel,
  unit = '',
  digits = 1,
  className,
}: {
  data: BarDatum[];
  ariaLabel: string;
  unit?: string;
  digits?: number;
  className?: string;
}) {
  const ceiling = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  return (
    <div className={cn('grid gap-2', className)} role="group" aria-label={ariaLabel}>
      {data.map((item) => {
        const positive = item.value >= 0;
        const pct = (Math.abs(item.value) / ceiling) * 50;
        return (
          <div key={item.label} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{item.label}</span>
              <span
                className={cn(
                  'tabular-nums font-semibold',
                  positive ? 'text-eqx-success' : 'text-eqx-danger',
                )}
              >
                {positive ? '+' : '−'}
                {formatNumber(Math.abs(item.value), digits)}
                {unit}
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-pill bg-eqx-surface-subtle">
              <div className="absolute left-1/2 top-0 h-full w-px bg-eqx-border-strong" />
              <div
                className={cn(
                  'absolute top-0 h-full rounded-pill',
                  positive ? 'bg-eqx-success' : 'bg-eqx-danger',
                )}
                style={
                  positive
                    ? { left: '50%', width: `${pct}%` }
                    : { right: '50%', width: `${pct}%` }
                }
              />
            </div>
            {item.hint ? <p className="text-xs text-eqx-text-muted">{item.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
