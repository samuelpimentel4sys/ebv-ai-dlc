import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, RotateCcw, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'info' | 'warning' | 'danger';

/** Seção 19 do DS: toast 5–8s; snackbar com ação reversível até 10s. */
const TOAST_MS = 6_000;
const SNACKBAR_MS = 10_000;

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  detail?: string;
  undo?: { label: string; run: () => void };
}

interface PushOptions {
  detail?: string;
  /** Torna o aviso um snackbar reversível, conforme a matriz de feedback do DS. */
  undo?: { label?: string; run: () => void };
}

interface ToastApi {
  push: (tone: ToastTone, message: string, detail?: string) => void;
  success: (message: string, detail?: string, options?: PushOptions) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string, detail?: string) => void;
  warning: (message: string, detail?: string) => void;
  /** Confirmação de ação reversível: mantém o desfazer disponível por 10s. */
  undoable: (message: string, detail: string | undefined, undo: () => void, label?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} aria-hidden="true" />,
  info: <Info size={18} aria-hidden="true" />,
  warning: <TriangleAlert size={18} aria-hidden="true" />,
  danger: <XCircle size={18} aria-hidden="true" />,
};

const toneClass: Record<ToastTone, string> = {
  success: 'border-l-eqx-success',
  info: 'border-l-eqx-action',
  warning: 'border-l-eqx-warning',
  danger: 'border-l-eqx-danger',
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const timers = useRef(new Map<number, { expiresAt: number; remaining: number }>());

  const dismiss = useCallback((id: number) => {
    timers.current.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const add = useCallback((item: Omit<ToastItem, 'id'>, ttl: number) => {
    counter += 1;
    const id = counter;
    timers.current.set(id, { expiresAt: Date.now() + ttl, remaining: ttl });
    setItems((prev) => [...prev, { ...item, id }]);
  }, []);

  // Um único relógio governa todos os avisos, para que o hover pause o conjunto.
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (paused) {
        for (const entry of timers.current.values()) entry.expiresAt = Date.now() + entry.remaining;
        return;
      }
      const now = Date.now();
      const expired: number[] = [];
      for (const [id, entry] of timers.current) {
        entry.remaining = entry.expiresAt - now;
        if (entry.remaining <= 0) expired.push(id);
      }
      if (expired.length) {
        for (const id of expired) timers.current.delete(id);
        setItems((prev) => prev.filter((item) => !expired.includes(item.id)));
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [paused]);

  const push = useCallback(
    (tone: ToastTone, message: string, detail?: string) => add({ tone, message, detail }, TOAST_MS),
    [add],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (message, detail, options) =>
        options?.undo
          ? add(
              {
                tone: 'success',
                message,
                detail,
                undo: { label: options.undo.label ?? 'Desfazer', run: options.undo.run },
              },
              SNACKBAR_MS,
            )
          : push('success', message, detail),
      error: (message, detail) => push('danger', message, detail),
      info: (message, detail) => push('info', message, detail),
      warning: (message, detail) => push('warning', message, detail),
      undoable: (message, detail, undo, label) =>
        add({ tone: 'success', message, detail, undo: { label: label ?? 'Desfazer', run: undo } }, SNACKBAR_MS),
    }),
    [add, push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-md border border-eqx-border border-l-4 bg-eqx-surface px-4 py-3 shadow-2',
                toneClass[item.tone],
              )}
            >
              <span className="mt-[0.15rem] shrink-0">{icons[item.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.message}</p>
                {item.detail ? <p className="text-xs text-eqx-text-muted">{item.detail}</p> : null}
                {item.undo ? (
                  <button
                    type="button"
                    onClick={() => {
                      item.undo?.run();
                      dismiss(item.id);
                    }}
                    className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-sm border-2 border-eqx-action px-3 text-xs font-bold text-eqx-action hover:bg-eqx-action/10"
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    {item.undo.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={`Fechar aviso: ${item.message}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-eqx-text-muted hover:bg-eqx-surface-subtle hover:text-eqx-text"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider');
  return context;
}
