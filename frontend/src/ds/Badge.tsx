import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'accent';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-eqx-surface-subtle text-eqx-text border-eqx-border',
  info: 'bg-eqx-info-bg text-eqx-info border-eqx-info/40',
  success: 'bg-eqx-success-bg text-eqx-success border-eqx-success/40',
  warning: 'bg-eqx-warning-bg text-eqx-warning border-eqx-warning/40',
  danger: 'bg-eqx-danger-bg text-eqx-danger border-eqx-danger/40',
  brand: 'bg-eqx-brand text-white border-transparent',
  accent: 'bg-eqx-accent/15 text-eqx-accent-text border-eqx-accent-text/40',
};

export function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1 rounded-pill border px-3 text-xs font-bold',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
