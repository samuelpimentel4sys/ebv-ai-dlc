import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/shell/AppShell';
import { NAV_ITEMS } from '@/app/navigation';
import { EpicLandingPage } from '@/app/EpicLandingPage';
import { lazyScreen } from '@/app/lazyScreen';
import { SectionWrapper } from '@/shell/SectionWrapper';
import { EmptyState } from '@/ds/Feedback';

const DemoScriptPage = lazyScreen(() => import('@/app/DemoScriptPage'), 'DemoScriptPage');

function NotFound() {
  return (
    <SectionWrapper>
      <EmptyState
        title="Tela não encontrada"
        description="A rota acessada não faz parte das telas publicadas neste showcase. Use Ctrl+K para buscar."
      />
    </SectionWrapper>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {NAV_ITEMS.map((item) => (
            <Route key={item.href} path={item.path} element={item.element} />
          ))}
          {NAV_ITEMS.filter((item) => item.path !== item.href).map((item) => (
            <Route key={`alias-${item.href}`} path={item.href} element={item.element} />
          ))}
          <Route path="/epicos/:epicId" element={<EpicLandingPage />} />
          <Route path="/roteiro" element={<DemoScriptPage />} />
          <Route path="/inicio" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
