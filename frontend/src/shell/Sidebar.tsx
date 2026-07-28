import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { PrismaLogo } from '@/shell/PrismaLogo';
import { NAV_ITEMS } from '@/app/navigation';
import { JOURNEYS, journeyPersona, journeyPosition, journeyItems } from '@/app/journeys';
import { EPICS } from '@/app/epics';

/**
 * Item de navegação da seção 17 do DS: fundo claro, texto de corpo e barra
 * lateral da marca no estado ativo. A versão anterior usava texto branco a 40%
 * de opacidade sobre fundo escuro, que reprovava o contraste mínimo.
 */
const itemLink =
  'flex min-h-[2.5rem] items-center gap-2 border-l-2 border-transparent px-2 py-1.5 text-sm ' +
  'text-eqx-text transition-colors duration-fast ease-standard ' +
  'hover:border-l-eqx-brand-text hover:bg-eqx-surface hover:text-eqx-brand-text';

const itemActive = 'border-l-eqx-brand-text bg-eqx-surface font-bold text-eqx-brand-text';

const STORAGE_KEY = 'prisma.sidebar.collapsed';

function readCollapsed(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/** Navegação por épico e, dentro dele, por trilha de persona. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const home = useMemo(() => NAV_ITEMS.find((item) => item.path === '/'), []);
  const { pathname } = useLocation();
  const activeEpic = useMemo(() => journeyPosition(pathname)?.journey.epic, [pathname]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      // Navegação privada sem storage: o estado vale só para a sessão.
    }
  }, [collapsed]);

  // Épico sem escolha explícita do operador fica fechado quando não é o atual,
  // para que a lista não abra com 56 telas de uma vez.
  function isCollapsed(epicId: string) {
    return collapsed[epicId] ?? (activeEpic ? epicId !== activeEpic : epicId !== EPICS[0].id);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-full w-sidebar flex-col border-r border-eqx-border bg-eqx-surface-subtle"
    >
      <div className="brand-bar h-1.5 w-full shrink-0" />
      <div className="flex items-center gap-2 px-4 py-4">
        <PrismaLogo />
      </div>
      <p className="px-4 pb-3 text-xs text-eqx-text-muted">
        {EPICS.length} épicos · {JOURNEYS.length} trilhas · 56 telas
      </p>

      <div className="flex-1 overflow-y-auto eqx-scrollbar px-2 pb-6">
        {home ? (
          <ul className="mb-3 grid gap-0.5">
            <li>
              <NavLink
                to={home.href}
                onClick={onNavigate}
                end
                className={({ isActive }) => cn(itemLink, isActive && itemActive)}
              >
                {home.label}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/roteiro"
                onClick={onNavigate}
                className={({ isActive }) => cn(itemLink, isActive && itemActive)}
              >
                Roteiro da demo
              </NavLink>
            </li>
          </ul>
        ) : null}

        {EPICS.map((epic) => {
          const folded = isCollapsed(epic.id);
          const journeys = JOURNEYS.filter((journey) => journey.epic === epic.id);
          return (
            <section key={epic.id} className="mb-1">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [epic.id]: !folded }))}
                aria-expanded={!folded}
                className="flex min-h-[2.5rem] w-full items-center justify-between gap-2 rounded-sm px-2 text-left text-[0.7rem] font-bold uppercase tracking-[0.12em] text-eqx-text-muted hover:bg-eqx-surface hover:text-eqx-text"
              >
                <span className="min-w-0 truncate">
                  {epic.id} · {epic.shortName}
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={cn('shrink-0 transition-transform duration-fast', folded && '-rotate-90')}
                />
              </button>

              {!folded ? (
                <div className="mb-2 grid gap-2">
                  <NavLink
                    to={`/epicos/${epic.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'mx-2 min-h-[2rem] text-xs text-eqx-action underline-offset-2 hover:underline',
                        isActive && 'font-bold',
                      )
                    }
                  >
                    Ver trilhas do épico
                  </NavLink>

                  {journeys.map((journey) => (
                    <div key={journey.id}>
                      <p className="px-2 pb-1 text-[0.65rem] uppercase tracking-[0.1em] text-eqx-text-muted">
                        {journey.title} · {journeyPersona(journey).name.split(' ')[0]}
                      </p>
                      <ul className="grid gap-0.5">
                        {journeyItems(journey).map((item, step) => (
                          <li key={item.href}>
                            <NavLink
                              to={item.href}
                              onClick={onNavigate}
                              className={({ isActive }) => cn(itemLink, isActive && itemActive)}
                            >
                              <span className="w-4 shrink-0 font-mono text-[0.65rem] text-eqx-text-muted">
                                {step + 1}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <footer className="border-t border-eqx-border px-4 py-3 text-[0.7rem] text-eqx-text-muted">
        Equifax · Prisma Showcase
      </footer>
    </nav>
  );
}
