import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/shell/AppShell';
import { NAV_ITEMS } from '@/app/navigation';
import { EpicLandingPage } from '@/app/EpicLandingPage';
import { lazyScreen } from '@/app/lazyScreen';
import { SectionWrapper } from '@/shell/SectionWrapper';
import { EmptyState } from '@/ds/Feedback';
import { RequireAuth } from '@/app/RequireAuth';
import { LoginPage } from '@/app/LoginPage';
import { AuthCallbackPage } from '@/app/AuthCallbackPage';

const DemoScriptPage = lazyScreen(() => import('@/app/DemoScriptPage'), 'DemoScriptPage');

function NotFound() {
  return (
    <SectionWrapper>
      <EmptyState
        title="Tela não encontrada"
        description="A rota acessada não faz parte do Prisma. Use Ctrl+K para buscar uma tela."
      />
    </SectionWrapper>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            {NAV_ITEMS.map((item) => (
              <Route key={item.href} path={item.path} element={item.element} />
            ))}
            {NAV_ITEMS.filter((item) => {
              const pathname = item.href.split('?')[0] ?? item.href;
              return item.path !== pathname;
            }).map((item) => {
              const pathname = item.href.split('?')[0] ?? item.href;
              return <Route key={`alias-${pathname}`} path={pathname} element={item.element} />;
            })}
            <Route path="/epicos/:epicId" element={<EpicLandingPage />} />
            <Route path="/roteiro" element={<DemoScriptPage />} />
            <Route path="/inicio" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
