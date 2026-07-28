import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

export function Stepper({
  steps,
  currentIndex,
  className,
}: {
  steps: StepperStep[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={cn('flex flex-wrap gap-2', className)}>
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex min-w-[12rem] flex-1 items-start gap-3 rounded-md border px-4 py-3',
              active && 'border-eqx-action bg-eqx-action/10',
              done && 'border-eqx-success bg-eqx-success-bg/50',
              !active && !done && 'border-eqx-border bg-eqx-surface',
            )}
          >
            <span
              className={cn(
                'grid h-7 w-7 shrink-0 place-items-center rounded-pill text-xs font-bold',
                done && 'bg-eqx-success text-eqx-text-inverse',
                active && 'bg-eqx-action text-eqx-text-inverse',
                !active && !done && 'bg-eqx-surface-subtle text-eqx-text-muted',
              )}
            >
              {done ? <Check size={14} aria-hidden="true" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{step.label}</span>
              {step.description ? (
                <span className="block text-xs text-eqx-text-muted">{step.description}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
