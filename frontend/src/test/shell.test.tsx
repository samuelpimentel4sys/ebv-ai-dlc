import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { AppShell } from '@/shell/AppShell';
import { NAV_ITEMS } from '@/app/navigation';

function mountShell(initial = '/') {
  const home = NAV_ITEMS.find((item) => item.path === '/')!;
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={home.element} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('shell da aplicação', () => {
  it('expõe landmarks, atalho para o conteúdo e navegação por grupos', async () => {
    mountShell();
    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir para o conteúdo/i })).toHaveAttribute(
      'href',
      '#conteudo',
    );
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /trilha de navegação/i })).toBeInTheDocument();
  });

  it('abre a busca com Ctrl+K e filtra telas pelo termo digitado', async () => {
    const user = userEvent.setup();
    mountShell();
    await screen.findByRole('main');

    await user.keyboard('{Control>}k{/Control}');
    const field = await screen.findByRole('combobox');
    await user.type(field, 'contagio');

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveTextContent(/dominó|contágio/i);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('alterna tema e densidade preservando o atributo no documento', async () => {
    const user = userEvent.setup();
    mountShell();
    await screen.findByRole('main');

    await user.click(screen.getByRole('button', { name: /tema/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: /tema/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('não apresenta violações de axe-core no shell completo', async () => {
    const { container } = mountShell();
    await screen.findByRole('main');
    const results = await axe.run(container, {
      runOnly: {
        type: 'rule',
        values: [
          'aria-allowed-attr',
          'aria-required-attr',
          'aria-roles',
          'aria-valid-attr-value',
          'button-name',
          'duplicate-id-aria',
          'heading-order',
          'label',
          'link-name',
          'list',
          'listitem',
          'nested-interactive',
          'region',
        ],
      },
    });
    expect(
      results.violations.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([]);
  }, 20_000);
});
