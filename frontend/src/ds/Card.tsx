import type { HTMLAttributes, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'brand' | 'action' | 'accent' | 'success' | 'warning' | 'danger';
  interactive?: boolean;
}

const accents: Record<NonNullable<CardProps['accent']>, string> = {
  none: '',
  brand: 'border-t-[3px] border-t-eqx-brand',
  action: 'border-t-[3px] border-t-eqx-action',
  accent: 'border-t-[3px] border-t-eqx-accent',
  success: 'border-t-[3px] border-t-eqx-success',
  warning: 'border-t-[3px] border-t-eqx-warning',
  danger: 'border-t-[3px] border-t-eqx-danger',
};

export function Card({
  accent = 'none',
  interactive,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-eqx-border bg-eqx-surface shadow-1',
        'p-[var(--density-card-p)]',
        accents[accent],
        interactive &&
          'transition-shadow duration-base ease-standard hover:border-eqx-action hover:shadow-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-eqx-accent-text">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-eqx-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  value,
  label,
  hint,
  tone = 'default',
  icon,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'action';
  icon?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  /** `default` segue o `.metric` do DS, que é escrito na cor da marca. */
  const tones: Record<string, string> = {
    default: 'text-eqx-brand-text',
    success: 'text-eqx-success',
    warning: 'text-eqx-warning',
    danger: 'text-eqx-danger',
    action: 'text-eqx-action',
  };
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.28, ease: [0, 0, 0.2, 1] }}
      className={cn('rounded-md border border-eqx-border bg-eqx-surface p-4 shadow-1', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-3xl font-bold tabular-nums', tones[tone])}>{value}</p>
        {icon ? <span className="text-eqx-text-muted">{icon}</span> : null}
      </div>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {hint ? <p className="mt-1 text-xs text-eqx-text-muted">{hint}</p> : null}
    </motion.div>
  );
}
