import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { AppShell } from '@/shell/AppShell';
import { NAV_ITEMS } from '@/app/navigation';
import { JOURNEYS, journeyItems, journeyPersona, journeyPosition } from '@/app/journeys';
import { EPICS } from '@/app/epics';
import { WelcomeTour } from '@/shell/WelcomeTour';

const productScreens = NAV_ITEMS.filter((item) => Boolean(item.usId));

describe('trilhas de jornada', () => {
  it('cobre todas as telas de produto exatamente uma vez', () => {
    const steps = JOURNEYS.flatMap((journey) => journey.steps);
    expect(new Set(steps).size).toBe(steps.length);
    expect(steps.sort()).toEqual(productScreens.map((item) => item.href).sort());
  });

  it('resolve todos os passos para telas registradas e mantém o épico da trilha', () => {
    for (const journey of JOURNEYS) {
      const items = journeyItems(journey);
      expect(items).toHaveLength(journey.steps.length);
      for (const item of items) expect(item.epic).toBe(journey.epic);
    }
  });

  it('todo épico possui ao menos uma trilha com persona nomeada, objetivo e fecho', () => {
    for (const epic of EPICS) {
      const journeys = JOURNEYS.filter((journey) => journey.epic === epic.id);
      expect(journeys.length).toBeGreaterThan(0);
      expect(epic.businessOutcome.length).toBeGreaterThan(20);
      expect(epic.connectsTo.length).toBeGreaterThan(20);
      for (const journey of journeys) {
        const persona = journeyPersona(journey);
        expect(persona.name).toMatch(/\s/);
        expect(persona.role.length).toBeGreaterThan(5);
        expect(journey.goal.length).toBeGreaterThan(10);
        expect(journey.payoff.length).toBeGreaterThan(10);
      }
    }
  });

  it('reconhece a trilha por padrão de rota, e não só pelo href de exemplo', () => {
    const outroProtocolo = journeyPosition('/titular/contestacoes/CT-2026-999999');
    expect(outroProtocolo?.journey.id).toBe('ep05-titular');
    expect(outroProtocolo?.index).toBe(1);
  });

  it('encadeia passo anterior e próximo dentro da trilha', () => {
    const journey = JOURNEYS.find((entry) => entry.steps.length > 2)!;
    const first = journeyPosition(journey.steps[0])!;
    expect(first.previous).toBeUndefined();
    expect(first.next?.href).toBe(journey.steps[1]);

    const last = journeyPosition(journey.steps[journey.steps.length - 1])!;
    expect(last.next).toBeUndefined();
    expect(last.previous?.href).toBe(journey.steps[journey.steps.length - 2]);
  });
});

function mountJourneyScreen(href: string) {
  const item = NAV_ITEMS.find((entry) => entry.href === href)!;
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[href]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path={href} element={item.element} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('navegação de jornada na tela', () => {
  it('exibe o rodapé com o próximo passo e a posição na trilha', async () => {
    const journey = JOURNEYS.find((entry) => entry.id === 'ep03-parecer')!;
    mountJourneyScreen(journey.steps[0]);

    // As telas entram por import dinâmico: esperar o h1 garante que o chunk
    // resolveu antes de procurar o rodapé de trilha.
    await screen.findByRole('heading', { level: 1 }, { timeout: 5_000 });

    const nav = await screen.findByRole('navigation', { name: /próximo passo da jornada/i });
    expect(nav).toHaveTextContent(journey.title);
    // textContent concatena nós sem espaço: "aprovado1/8Bruno" — checa o fragmento.
    expect(nav.textContent ?? '').toContain(`1/${journey.steps.length}`);

    const next = NAV_ITEMS.find((item) => item.href === journey.steps[1])!;
    expect(within(nav).getByRole('link', { name: new RegExp(next.label, 'i') })).toHaveAttribute(
      'href',
      journey.steps[1],
    );
  });

  it('desabilita o passo anterior no início da trilha', async () => {
    const journey = JOURNEYS.find((entry) => entry.id === 'ep06-titular')!;
    mountJourneyScreen(journey.steps[0]);
    await screen.findByRole('main');

    expect(screen.getByRole('button', { name: /passo anterior da jornada/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /próximo passo da jornada/i })).toBeEnabled();
  });
});

describe('tour de primeira visita', () => {
  it('aparece uma única vez e registra a dispensa', async () => {
    window.localStorage.removeItem('prisma.tour');
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <WelcomeTour />
      </MemoryRouter>,
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/trilhas por persona/i);

    await user.click(screen.getByRole('button', { name: /começar/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.localStorage.getItem('prisma.tour')).toBe('visto');
  });
});
