import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

const controlBase =
  'w-full rounded-sm border border-eqx-border-strong bg-eqx-surface px-3 py-2 text-eqx-text ' +
  'placeholder:text-eqx-text-muted transition-colors duration-fast ease-standard ' +
  'hover:border-eqx-action focus:border-eqx-action disabled:bg-eqx-surface-subtle disabled:text-eqx-text-muted';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { controlId: string; describedBy: string | undefined }) => ReactNode;
  className?: string;
}

export function FieldShell({
  label,
  hint,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  const base = useId();
  const controlId = `${base}-control`;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('grid gap-2', className)}>
      <label htmlFor={controlId} className="text-sm font-semibold">
        {label}
        {/* Seção 20 do DS: obrigatoriedade não pode depender só do asterisco vermelho. */}
        {required ? (
          <>
            <span className="text-eqx-danger" aria-hidden="true">
              {' '}
              *
            </span>
            <span className="visually-hidden"> (obrigatório)</span>
          </>
        ) : null}
      </label>
      {children({ controlId, describedBy })}
      {hint ? (
        <p id={hintId} className="text-sm text-eqx-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-eqx-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

/** `forwardRef` porque validação inline precisa mover o foco ao primeiro campo inválido. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required} className={className}>
      {({ controlId, describedBy }) => (
        <input
          ref={ref}
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlBase, error && 'border-eqx-danger')}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, options, className, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required} className={className}>
      {({ controlId, describedBy }) => (
        <select
          ref={ref}
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlBase, 'min-h-[2.5rem]', error && 'border-eqx-danger')}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
});

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, className, ...props }, ref) {
    return (
      <FieldShell
        label={label}
        hint={hint}
        error={error}
        required={props.required}
        className={className}
      >
        {({ controlId, describedBy }) => (
          <textarea
            ref={ref}
            id={controlId}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(
              controlBase,
              'min-h-[7rem] font-mono text-sm',
              error && 'border-eqx-danger',
            )}
            {...props}
          />
        )}
      </FieldShell>
    );
  },
);

export interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Aceite de contrato / autorização — o DS não tem checkbox nativo; este fecha o buraco. */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ label, hint, error, className, ...props }, ref) {
    const base = useId();
    const controlId = `${base}-control`;
    const hintId = hint ? `${base}-hint` : undefined;
    const errorId = error ? `${base}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('grid gap-2', className)}>
        <label htmlFor={controlId} className="flex min-h-target cursor-pointer items-start gap-3">
          <input
            ref={ref}
            id={controlId}
            type="checkbox"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(
              'mt-1 h-4 w-4 shrink-0 rounded-sm border border-eqx-border-strong text-eqx-action',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus',
              error && 'border-eqx-danger',
            )}
            {...props}
          />
          <span className="text-sm font-semibold">
            {label}
            {props.required ? (
              <>
                <span className="text-eqx-danger" aria-hidden="true">
                  {' '}
                  *
                </span>
                <span className="visually-hidden"> (obrigatório)</span>
              </>
            ) : null}
          </span>
        </label>
        {hint ? (
          <p id={hintId} className="pl-7 text-sm text-eqx-text-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="pl-7 text-sm font-semibold text-eqx-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
