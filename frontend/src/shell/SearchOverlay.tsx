import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search } from 'lucide-react';
import { searchNav } from '@/app/navigation';
import { cn } from '@/lib/cn';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => searchNav(), []);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return items.slice(0, 12);
    return items
      .filter((item) => {
        const haystack = normalize(
          [item.label, item.group, item.description, item.usId, item.path, ...(item.keywords ?? [])]
            .filter(Boolean)
            .join(' '),
        );
        return term.split(/\s+/).every((part) => haystack.includes(part));
      })
      .slice(0, 30);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((value) => Math.min(value + 1, results.length - 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((value) => Math.max(value - 1, 0));
      }
      if (event.key === 'Enter') {
        const target = results[cursor];
        if (target) {
          navigate(target.href);
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, cursor, navigate, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-modal grid place-items-start justify-center p-4 pt-[10vh]">
          <motion.div
            className="absolute inset-0 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar telas do Prisma"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[44rem] overflow-hidden rounded-md bg-eqx-surface shadow-3"
          >
            <div className="brand-bar h-1.5 w-full" />
            <div className="flex items-center gap-3 border-b border-eqx-border px-4 py-3">
              <Search size={18} aria-hidden="true" className="text-eqx-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                placeholder="Buscar tela, épico, US-FE ou rota…"
                aria-label="Termo de busca"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="busca-telas-resultados"
                aria-autocomplete="list"
                aria-activedescendant={results[cursor] ? `busca-opcao-${cursor}` : undefined}
                className="min-h-[2.5rem] w-full bg-transparent text-base outline-none placeholder:text-eqx-text-muted"
              />
              <kbd className="rounded-sm border border-eqx-border px-1.5 py-0.5 font-mono text-[0.65rem] text-eqx-text-muted">
                Esc
              </kbd>
            </div>
            <ul
              id="busca-telas-resultados"
              role="listbox"
              aria-label="Telas encontradas"
              className="max-h-[54vh] overflow-y-auto eqx-scrollbar"
            >
              {results.length === 0 ? (
                <li className="px-4 py-6 text-sm text-eqx-text-muted">
                  Nenhuma tela encontrada para “{query}”.
                </li>
              ) : null}
              {results.map((item, index) => (
                <li key={item.href} role="option" aria-selected={index === cursor}>
                  <button
                    type="button"
                    id={`busca-opcao-${index}`}
                    tabIndex={-1}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => {
                      navigate(item.href);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left',
                      index === cursor ? 'bg-eqx-action/12' : 'hover:bg-eqx-surface-subtle',
                    )}
                  >
                    <span className="mt-0.5 w-14 shrink-0 font-mono text-[0.7rem] text-eqx-text-muted">
                      {item.epic ?? 'HOME'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs text-eqx-text-muted">
                        {item.group} · {item.path}
                      </span>
                    </span>
                    {index === cursor ? (
                      <CornerDownLeft size={14} aria-hidden="true" className="mt-1 text-eqx-text-muted" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
