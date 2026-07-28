import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Beaker, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { demoStateFromUrl, type DemoState } from '@/lib/useMockQuery';

const OPTIONS: { value: DemoState | 'normal'; label: string; hint: string }[] = [
  { value: 'normal', label: 'Dados normais', hint: 'Resposta completa do serviço' },
  { value: 'empty', label: 'Resposta vazia', hint: 'Sem registros para o contexto' },
  { value: 'partial', label: 'Resposta parcial', hint: 'Uma fonte indisponível' },
  { value: 'error', label: 'Falha de serviço', hint: '503 com correlationId' },
];

/**
 * Torna a demonstração dos estados de exceção alcançável pelo mouse. O
 * parâmetro `?state=` já existia, mas ninguém o descobre sem digitar na URL.
 */
export function DemoStateMenu() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = demoStateFromUrl(search) ?? 'normal';

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function select(value: DemoState | 'normal') {
    navigate(value === 'normal' ? pathname : `${pathname}?state=${value}`);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'grid h-11 w-11 place-items-center rounded-sm transition-colors duration-fast',
          current === 'normal'
            ? 'text-eqx-text-muted hover:bg-eqx-surface-subtle hover:text-eqx-text'
            : 'bg-eqx-warning-bg text-eqx-warning',
        )}
        aria-label={`Simular estado da tela. Atual: ${
          OPTIONS.find((option) => option.value === current)?.label
        }`}
        title="Simular estado da tela"
      >
        <Beaker size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-dropdown w-64 overflow-hidden rounded-md border border-eqx-border bg-eqx-surface shadow-2"
        >
          <p className="border-b border-eqx-border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-eqx-text-muted">
            Simular estado
          </p>
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={current === option.value}
              onClick={() => select(option.value)}
              className="flex w-full min-h-[2.75rem] items-center gap-2 px-3 py-2 text-left text-sm hover:bg-eqx-surface-subtle"
            >
              <Check
                size={14}
                aria-hidden="true"
                className={cn('shrink-0', current === option.value ? 'text-eqx-action' : 'opacity-0')}
              />
              <span className="min-w-0">
                <span className="block font-semibold">{option.label}</span>
                <span className="block text-xs text-eqx-text-muted">{option.hint}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
