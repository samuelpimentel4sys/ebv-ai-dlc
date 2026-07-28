import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { NAV_ITEMS } from '@/app/navigation';
import { EPICS } from '@/app/epics';

function renderScreen(item: (typeof NAV_ITEMS)[number]) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[item.href]}>
          <Routes>
            <Route path={item.path} element={item.element} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('telas do showcase', () => {
  it('registra rotas únicas para todas as telas', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('cobre os seis épicos com as telas previstas nas US-FE', () => {
    const expected: Record<string, number> = {
      'EP-01': 10,
      'EP-02': 10,
      'EP-03': 9,
      'EP-04': 9,
      'EP-05': 12,
      'EP-06': 9,
    };
    for (const epic of EPICS) {
      const count = NAV_ITEMS.filter((item) => item.epic === epic.id).length;
      expect(count, `${epic.id} deve ter ${expected[epic.id]} telas`).toBe(expected[epic.id]);
    }
  });

  it('associa uma US-FE a cada tela de produto', () => {
    const productScreens = NAV_ITEMS.filter((item) => Boolean(item.usId));
    expect(productScreens).toHaveLength(59);
    for (const item of productScreens) {
      expect(item.usId, `${item.label} sem US-FE`).toMatch(/^PRISMA-EP-0\d-F\d\d-US-FE-\d\d$/);
    }
  });

  it.each(NAV_ITEMS.map((item) => [item.label, item] as const))(
    'renderiza %s com título único de nível 1',
    async (_label, item) => {
      const { unmount } = renderScreen(item);
      const headings = await screen.findAllByRole('heading', { level: 1 }, { timeout: 5_000 });
      expect(headings).toHaveLength(1);
      unmount();
    },
    12_000,
  );
});
