import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

const config: Record<NoticeTone, { className: string; icon: ReactNode; role: 'status' | 'alert' }> =
  {
    info: {
      className: 'border-l-eqx-info bg-eqx-info-bg/60',
      icon: <Info size={18} aria-hidden="true" />,
      role: 'status',
    },
    success: {
      className: 'border-l-eqx-success bg-eqx-success-bg/60',
      icon: <CheckCircle2 size={18} aria-hidden="true" />,
      role: 'status',
    },
    warning: {
      className: 'border-l-eqx-warning bg-eqx-warning-bg/60',
      icon: <AlertTriangle size={18} aria-hidden="true" />,
      role: 'status',
    },
    danger: {
      className: 'border-l-eqx-danger bg-eqx-danger-bg/60',
      icon: <XCircle size={18} aria-hidden="true" />,
      role: 'alert',
    },
  };

export function Notice({
  tone = 'info',
  title,
  children,
  actions,
  className,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const { className: toneClass, icon, role } = config[tone];
  return (
    <div
      role={role}
      className={cn(
        'flex flex-wrap items-start gap-3 rounded-md border border-eqx-border border-l-4 px-4 py-3',
        toneClass,
        className,
      )}
    >
      <span className="mt-[0.15rem] shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-sm text-eqx-text">{children}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
