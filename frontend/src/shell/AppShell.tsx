import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/shell/Sidebar';
import { TopBar } from '@/shell/TopBar';
import { SearchOverlay } from '@/shell/SearchOverlay';
import { WelcomeTour } from '@/shell/WelcomeTour';
import { cn } from '@/lib/cn';
import { isDemoMode } from '@/lib/productMode';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const demo = isDemoMode(location.search);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      if (event.key === '/' && !(event.target as HTMLElement)?.closest('input, textarea, select')) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-modal focus:rounded-sm focus:bg-eqx-action focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Ir para o conteúdo
      </a>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-overlay bg-black/55 lg:hidden"
          onClick={() => setMenuOpen(false)}
          role="presentation"
        />
      ) : null}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-overlay transition-transform duration-base ease-standard lg:static lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main id="conteudo" className="flex-1 overflow-y-auto overflow-x-hidden eqx-scrollbar bg-eqx-bg">
          <Outlet />
        </main>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {demo ? <WelcomeTour /> : null}
    </div>
  );
}
