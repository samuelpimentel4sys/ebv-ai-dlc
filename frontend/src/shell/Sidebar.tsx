import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { PrismaLogo } from '@/shell/PrismaLogo';
import { NAV_ITEMS } from '@/app/navigation';
import {
  navItemsForModule,
  productModuleForPathname,
  resolvedProductModules,
} from '@/app/modules';
import { isDemoMode } from '@/lib/productMode';
import { EPICS } from '@/app/epics';
import { JOURNEYS, journeyPersona, journeyPosition, journeyItems } from '@/app/journeys';

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

/** Navegação por módulo de produto (default) ou por épico/trilha (?demo=1). */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const home = useMemo(() => NAV_ITEMS.find((item) => item.path === '/'), []);
  const { pathname, search } = useLocation();
  const demo = isDemoMode(search);
  const activeModule = useMemo(() => productModuleForPathname(pathname)?.id, [pathname]);
  const activeEpic = useMemo(() => journeyPosition(pathname)?.journey.epic, [pathname]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed);
  const modules = useMemo(() => resolvedProductModules(), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  function isCollapsed(key: string, fallbackOpenKey: string | undefined) {
    return collapsed[key] ?? (fallbackOpenKey ? key !== fallbackOpenKey : key !== modules[0]?.id);
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
        {demo
          ? `${EPICS.length} épicos · ${JOURNEYS.length} trilhas · demo`
          : `${modules.length} módulos · Prisma Equifax`}
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
                Início
              </NavLink>
            </li>
            {demo ? (
              <li>
                <NavLink
                  to="/roteiro"
                  onClick={onNavigate}
                  className={({ isActive }) => cn(itemLink, isActive && itemActive)}
                >
                  Roteiro da demo
                </NavLink>
              </li>
            ) : null}
          </ul>
        ) : null}

        {demo
          ? EPICS.map((epic) => {
              const folded = isCollapsed(epic.id, activeEpic);
              const journeys = JOURNEYS.filter((journey) => journey.epic === epic.id);
              return (
                <section key={epic.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [epic.id]: !folded }))}
                    aria-expanded={!folded}
                    className="flex w-full min-h-11 items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-eqx-text-muted hover:bg-eqx-surface hover:text-eqx-text"
                  >
                    <span className="truncate">
                      {epic.id} · {epic.shortName}
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={cn('shrink-0 transition-transform', !folded && 'rotate-180')}
                    />
                  </button>
                  {!folded ? (
                    <div className="mb-2 ml-1 border-l border-eqx-border pl-1">
                      {journeys.map((journey) => (
                        <div key={journey.id} className="mb-2">
                          <p className="px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-eqx-text-muted">
                            {journeyPersona(journey).name} · {journey.title}
                          </p>
                          <ul className="grid gap-0.5">
                            {journeyItems(journey).map((item) => (
                              <li key={item.href}>
                                <NavLink
                                  to={item.href}
                                  onClick={onNavigate}
                                  className={({ isActive }) => cn(itemLink, isActive && itemActive)}
                                >
                                  <span className="truncate">{item.label}</span>
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <NavLink
                        to={`/epicos/${epic.id}`}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(itemLink, 'text-xs text-eqx-text-muted', isActive && itemActive)
                        }
                      >
                        Ver trilhas do épico
                      </NavLink>
                    </div>
                  ) : null}
                </section>
              );
            })
          : modules.map((mod) => {
              const folded = isCollapsed(mod.id, activeModule);
              const items = navItemsForModule(mod);
              return (
                <section key={mod.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [mod.id]: !folded }))}
                    aria-expanded={!folded}
                    className="flex w-full min-h-11 items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-eqx-text-muted hover:bg-eqx-surface hover:text-eqx-text"
                  >
                    <span className="truncate">{mod.label}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={cn('shrink-0 transition-transform', !folded && 'rotate-180')}
                    />
                  </button>
                  {!folded ? (
                    <ul className="mb-2 ml-1 grid gap-0.5 border-l border-eqx-border pl-1">
                      {items.map((item) => (
                        <li key={item.href}>
                          <NavLink
                            to={item.href}
                            onClick={onNavigate}
                            className={({ isActive }) => cn(itemLink, isActive && itemActive)}
                          >
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
      </div>

      <div className="border-t border-eqx-border px-4 py-3 text-[0.65rem] text-eqx-text-muted">
        Equifax · Prisma
        {!demo ? (
          <span className="mt-1 block">
            Demo:{' '}
            <a className="text-eqx-action underline" href="?demo=1">
              ?demo=1
            </a>
          </span>
        ) : null}
      </div>
    </nav>
  );
}
