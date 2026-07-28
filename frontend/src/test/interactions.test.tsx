import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { ConsentPage } from '@/epics/thinfile/ConsentPage';
import { SimulatorPage } from '@/epics/thinfile/SimulatorPage';
import { simulationActions } from '@/epics/thinfile/data';
import { OnboardingPage } from '@/epics/contestacao/OnboardingPage';

function mount(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('interações críticas das telas', () => {
  it('revogar consentimento essencial avisa o impacto no score antes de confirmar', async () => {
    const user = userEvent.setup();
    mount(<ConsentPage />);

    const toggles = await screen.findAllByRole('button', { name: /desativar/i });
    await user.click(toggles[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/score thin-file deixará de ser calculado/i);
    expect(screen.getByRole('button', { name: /manter ativa/i })).toBeInTheDocument();
  });

  it('simulador exige seleção de ação e apresenta faixa estimada com ressalva', async () => {
    const user = userEvent.setup();
    mount(<SimulatorPage />);

    expect(await screen.findByText(/estimativa, não promessa de resultado/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /limpar seleção/i }));
    expect(
      screen.getByText(/selecione ações e execute a simulação/i),
    ).toBeInTheDocument();

    // O rótulo vem da fixture canónica (a contestação de Maria em EP-05), então o
    // teste lê a fonte de dados em vez de repetir a cópia da tela.
    await user.click(
      screen.getByRole('button', { name: new RegExp(simulationActions[0].label, 'i') }),
    );
    await user.click(screen.getByRole('button', { name: /simular impacto/i }));

    expect(await screen.findByText(/faixa projetada/i, undefined, { timeout: 4_000 })).toBeInTheDocument();
  });

  it('contratação B2B bloqueia avanço com CNPJ inválido', async () => {
    const user = userEvent.setup();
    mount(<OnboardingPage />);

    await user.type(screen.getByLabelText(/cnpj/i), '123');
    await user.type(screen.getByLabelText(/razão social/i), 'Banco Parceiro');
    await user.click(screen.getByRole('button', { name: /validar cnpj/i }));

    expect(await screen.findByText(/dados incompletos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument();
  });
});
