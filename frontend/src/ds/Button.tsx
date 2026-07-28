import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';
type Size = 'sm' | 'md';

const variants: Record<Variant, string> = {
  primary:
    'bg-eqx-action text-white border-transparent hover:bg-eqx-action-hover disabled:bg-eqx-border',
  secondary:
    'bg-transparent text-eqx-action border-eqx-action hover:bg-eqx-action/10 disabled:text-eqx-text-muted disabled:border-eqx-border',
  ghost:
    'bg-transparent text-eqx-text border-transparent hover:bg-eqx-surface-subtle disabled:text-eqx-text-muted',
  danger:
    'bg-eqx-danger text-white border-transparent hover:bg-eqx-brand-strong disabled:bg-eqx-border',
  brand:
    'bg-eqx-brand text-white border-transparent hover:bg-eqx-brand-strong disabled:bg-eqx-border',
};

/** Alturas conforme seção 08 do DS: alvo recomendado 48px; `sm` só em barras densas. */
const sizes: Record<Size, string> = {
  sm: 'min-h-[2.5rem] px-3 text-sm gap-2',
  md: 'min-h-target px-5 text-base gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-sm border-2 font-bold ' +
  'transition-[background-color,transform,border-color] duration-fast ease-standard ' +
  'active:translate-y-[0.0625rem] ' +
  'disabled:cursor-not-allowed disabled:opacity-70 disabled:active:translate-y-0';

/** Aplica a aparência de botão do DS em elementos não-button, como links de navegação. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});
