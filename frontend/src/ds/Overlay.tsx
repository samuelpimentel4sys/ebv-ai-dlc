import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/ds/useFocusTrap';

function useDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
}) {
  useDismiss(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-modal flex" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: side === 'right' ? 420 : -420 }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? 420 : -420 }}
            transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
            className={cn(
              'relative flex h-full w-full max-w-[34rem] flex-col bg-eqx-surface shadow-3 outline-none',
              side === 'right' ? 'ml-auto' : 'mr-auto',
            )}
          >
            <div className="brand-bar h-1.5 w-full shrink-0" />
            <header className="flex items-start justify-between gap-3 border-b border-eqx-border px-5 py-4">
              <div>
                <h2 className="text-lg">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-eqx-text-muted">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar painel"
                className="grid h-11 w-11 place-items-center rounded-sm hover:bg-eqx-surface-subtle"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto eqx-scrollbar px-5 py-5">{children}</div>
            {footer ? (
              <footer className="border-t border-eqx-border px-5 py-4">{footer}</footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useDismiss(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-modal grid place-items-center p-4" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[36rem] overflow-hidden rounded-md bg-eqx-surface shadow-3 outline-none"
          >
            <div className="brand-bar h-1.5 w-full" />
            <header className="flex items-start justify-between gap-3 border-b border-eqx-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-lg">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-eqx-text-muted">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-sm hover:bg-eqx-surface-subtle"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="max-h-[60vh] overflow-y-auto eqx-scrollbar px-5 py-5">{children}</div>
            {footer ? (
              <footer className="flex flex-wrap justify-end gap-2 border-t border-eqx-border px-5 py-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
