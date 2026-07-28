import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { NAV_ITEMS } from '@/app/navigation';
import { EPICS } from '@/app/epics';
import { EpicLandingPage } from '@/app/EpicLandingPage';
import { AppShell } from '@/shell/AppShell';

/** Home + 59 telas de produto. */
const SAMPLE_HREFS = NAV_ITEMS.map((item) => item.href);

/**
 * Regras que jsdom consegue avaliar sem layout. Contraste é verificado à parte,
 * em `contrast.test.ts`, porque axe-core não mede cor sem renderização real.
 */
const RULES = [
  'aria-allowed-attr',
  'aria-allowed-role',
  'aria-command-name',
  'aria-hidden-focus',
  'aria-input-field-name',
  'aria-required-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-toggle-field-name',
  'aria-tooltip-name',
  'aria-valid-attr-value',
  'button-name',
  'duplicate-id-aria',
  'empty-heading',
  'empty-table-header',
  'form-field-multiple-labels',
  'heading-order',
  'label',
  'landmark-unique',
  'link-name',
  'list',
  'listitem',
  'meta-viewport',
  'nested-interactive',
  'presentation-role-conflict',
  'select-name',
  'svg-img-alt',
  'table-duplicate-name',
  'td-headers-attr',
  'th-has-data-cells',
];

async function auditScreen(href: string) {
  const item = NAV_ITEMS.find((entry) => entry.href === href);
  if (!item) throw new Error(`Tela não encontrada no registro: ${href}`);

  const { container, unmount } = render(
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

  await screen.findAllByRole('heading', { level: 1 }, { timeout: 5_000 });

  const results = await axe.run(container, {
    runOnly: { type: 'rule', values: RULES },
  });

  unmount();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
  }));
}

async function auditEpicLanding(epicId: string) {
  const { container, unmount } = render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/epicos/${epicId}`]}>
          <Routes>
            <Route path="/epicos/:epicId" element={<EpicLandingPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );

  await screen.findAllByRole('heading', { level: 1 });
  const results = await axe.run(container, { runOnly: { type: 'rule', values: RULES } });
  unmount();
  return results.violations.map((violation) => ({ id: violation.id, help: violation.help }));
}

describe('acessibilidade WCAG 2.2 AA', () => {
  it.each(SAMPLE_HREFS)('%s não apresenta violações de axe-core', async (href) => {
    const violations = await auditScreen(href);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  }, 15_000);

  it.each(EPICS.map((epic) => epic.id))(
    'landing de %s não apresenta violações de axe-core',
    async (epicId) => {
      const violations = await auditEpicLanding(epicId);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    },
  );

  it('todas as telas declaram descrição navegável e palavras-chave de busca', () => {
    for (const item of NAV_ITEMS) {
      expect(item.description.length, `${item.label} sem descrição`).toBeGreaterThan(20);
      expect(item.group.length).toBeGreaterThan(0);
    }
  });

  it('o shell posiciona todo conteúdo dentro de marcos e sem armadilha de foco', async () => {
    const { container, unmount } = render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={NAV_ITEMS[0].element} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>,
    );

    await screen.findByRole('main');
    const results = await axe.run(container, {
      runOnly: { type: 'rule', values: [...RULES, 'region', 'landmark-one-main', 'bypass'] },
    });
    unmount();

    const violations = results.violations.map((violation) => ({
      id: violation.id,
      help: violation.help,
    }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  }, 20_000);
});
