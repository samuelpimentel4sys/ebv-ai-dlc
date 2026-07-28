import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, Moon, Rows3, Search, Sun } from 'lucide-react';
import { useTheme } from '@/app/ThemeContext';
import { navItemByPathname } from '@/app/navigation';
import { journeyPosition } from '@/app/journeys';
import { productModuleForPathname } from '@/app/modules';
import { cn } from '@/lib/cn';
import { Badge } from '@/ds/Badge';
import { DemoStateMenu } from '@/shell/DemoStateMenu';
import { dataMode } from '@/lib/config';
import { isDemoMode, isDevMode } from '@/lib/productMode';

const iconButton =
  'grid h-11 w-11 place-items-center rounded-sm text-eqx-text-muted transition-colors duration-fast ' +
  'hover:bg-eqx-surface-subtle hover:text-eqx-text disabled:opacity-40 disabled:hover:bg-transparent';

export function TopBar({
  onOpenMenu,
  onOpenSearch,
}: {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = navItemByPathname(location.pathname);
  const demo = isDemoMode(location.search);
  const dev = isDevMode(location.search);
  const position = journeyPosition(location.pathname);
  const previous = position?.previous;
  const next = position?.next;
  const module = productModuleForPathname(location.pathname);

  return (
    <header
      className="z-sticky flex shrink-0 items-center gap-1 border-b border-eqx-border bg-eqx-surface px-3 py-2"
      role="banner"
    >
      <button type="button" onClick={onOpenMenu} className={cn(iconButton, 'lg:hidden')} aria-label="Abrir menu">
        <Menu size={18} aria-hidden="true" />
      </button>

      <nav aria-label="Trilha de navegação" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden sm:block">
            <Link to="/" className="text-eqx-text-muted hover:text-eqx-action">
              Prisma
            </Link>
          </li>
          <li className="hidden text-eqx-text-muted sm:block" aria-hidden="true">
            /
          </li>
          {module ? (
            <li className="hidden text-eqx-text-muted md:block">{module.label}</li>
          ) : (
            <li className="hidden text-eqx-text-muted md:block">{current?.group ?? 'Início'}</li>
          )}
          <li className="text-eqx-text-muted" aria-hidden="true">
            /
          </li>
          <li className="min-w-0 truncate font-semibold">{current?.label ?? 'Início'}</li>
          {demo && position ? (
            <li className="hidden lg:block">
              <Badge tone="accent">
                Passo {position.index + 1}/{position.total}
              </Badge>
            </li>
          ) : null}
          {dev && current?.usId ? (
            <li className="hidden xl:block">
              <Badge tone="neutral" className="font-mono">
                {current.usId}
              </Badge>
            </li>
          ) : null}
          <li className="hidden sm:block">
            <Badge tone={dataMode() === 'live' ? 'success' : 'warning'} className="font-mono">
              {dataMode() === 'live' ? 'API live' : 'mock'}
            </Badge>
          </li>
        </ol>
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        className="mr-1 hidden min-h-[2.25rem] items-center gap-2 rounded-sm border border-eqx-border px-3 text-sm text-eqx-text-muted hover:border-eqx-action hover:text-eqx-text md:flex"
      >
        <Search size={15} aria-hidden="true" />
        Buscar
        <kbd className="rounded-sm border border-eqx-border px-1 font-mono text-[0.65rem]">Ctrl K</kbd>
      </button>
      <button type="button" onClick={onOpenSearch} className={cn(iconButton, 'md:hidden')} aria-label="Buscar">
        <Search size={18} aria-hidden="true" />
      </button>

      {demo || dev ? <DemoStateMenu /> : null}

      {demo ? (
        <>
          <button
            type="button"
            onClick={() => previous && navigate(previous.href)}
            disabled={!previous}
            className={iconButton}
            aria-label={previous ? `Passo anterior da jornada: ${previous.label}` : 'Passo anterior da jornada'}
            title={previous?.label}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => next && navigate(next.href)}
            disabled={!next}
            className={iconButton}
            aria-label={next ? `Próximo passo da jornada: ${next.label}` : 'Próximo passo da jornada'}
            title={next?.label}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </>
      ) : null}

      <DensityToggle />
      <ThemeToggle />
    </header>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={iconButton}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

function DensityToggle() {
  const { density, cycleDensity } = useTheme();
  return (
    <button
      type="button"
      onClick={cycleDensity}
      className={iconButton}
      aria-label={`Densidade atual: ${density}. Alternar densidade.`}
      title={`Densidade: ${density}`}
    >
      <Rows3 size={18} aria-hidden="true" />
    </button>
  );
}
