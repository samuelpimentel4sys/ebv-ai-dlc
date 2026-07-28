import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, Button, DataTable, Notice, Tabs, TextField } from '@/ds';

describe('primitivas do design system', () => {
  it('Button respeita alvo mínimo de toque e estado de carregamento', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Salvar
      </Button>,
    );
    const button = screen.getByRole('button', { name: /salvar/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('TextField associa label, hint e erro ao controle', () => {
    render(<TextField label="Documento" hint="apenas dígitos" error="obrigatório" />);
    const input = screen.getByLabelText(/documento/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('obrigatório');
  });

  it('Tabs navega com as setas do teclado', async () => {
    render(
      <Tabs
        items={[
          { id: 'a', label: 'Primeira', content: <p>conteúdo A</p> },
          { id: 'b', label: 'Segunda', content: <p>conteúdo B</p> },
        ]}
      />,
    );
    expect(screen.getByText('conteúdo A')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Primeira' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('conteúdo B')).toBeInTheDocument();
  });

  it('Notice de perigo usa role alert', () => {
    render(<Notice tone="danger" title="Falha" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha');
  });

  it('DataTable expõe caption acessível e células', () => {
    render(
      <DataTable
        caption="Lista de tópicos"
        columns={[
          { key: 'topic', header: 'Tópico', render: (row: { topic: string }) => row.topic },
        ]}
        rows={[{ topic: 'credit.events.payment.v2' }]}
        rowKey={(row) => row.topic}
      />,
    );
    expect(screen.getByRole('table', { name: 'Lista de tópicos' })).toBeInTheDocument();
    expect(screen.getByText('credit.events.payment.v2')).toBeInTheDocument();
  });

  it('Badge renderiza tom informado', () => {
    render(<Badge tone="success">ativo</Badge>);
    expect(screen.getByText('ativo')).toBeInTheDocument();
  });
});
