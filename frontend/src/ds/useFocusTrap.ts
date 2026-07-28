import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Cumpre a seção 25 do DS ("sem armadilhas de foco", "foco visível e não obscurecido"):
 * move o foco para o painel, cicla Tab dentro dele, devolve o foco ao disparador
 * e bloqueia o scroll do documento enquanto o overlay está aberto.
 */
export function useFocusTrap(open: boolean, panelRef: React.RefObject<HTMLElement>) {
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !panel) return;
      const targets = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
      if (targets.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const start = targets[0];
      const end = targets[targets.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && (active === end || !panel.contains(active))) {
        event.preventDefault();
        start.focus();
      } else if (event.shiftKey && (active === start || !panel.contains(active))) {
        event.preventDefault();
        end.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, panelRef]);
}
