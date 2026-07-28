import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, KeyRound, TrendingUp } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  ColumnChart,
  DataTable,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  Tabs,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { fetchConsoleLive } from '@/api/b2bConsole';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { sumBy } from '@/lib/number';
import { VEGA } from '@/app/story';
import {
  contracts,
  invoices,
  orgUsers,
  usageSeries,
  type ContractItem,
  type Invoice,
  type OrgUser,
} from '@/epics/contestacao/data';

const invoiceTone = {
  paga: 'success',
  aberta: 'info',
  vencida: 'danger',
} as const;
const roleLabel: Record<OrgUser['role'], string> = {
  admin: 'Administrador',
  desenvolvedor: 'Desenvolvedor',
  financeiro: 'Financeiro',
  leitura: 'Somente leitura',
};

const DEFAULT_MONTHS = '6';

export function ConsolePage() {
  const toast = useToast();
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const query = useDataQuery(
    () => ({
      usage: usageSeries.slice(-Number(months)),
      invoices,
      contracts,
      users: orgUsers,
    }),
    async () => {
      const data = await fetchConsoleLive();
      return {
        usage: data.usage.slice(-Number(months)),
        invoices: data.invoices,
        contracts: data.contracts,
        users: orgUsers,
      };
    },
    {
      latency: 380,
      deps: [months],
      isEmpty: (data) => data.usage.length === 0,
    },
  );

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'invoiceId',
      header: 'Fatura',
      render: (row) => <code className="text-xs">{row.invoiceId}</code>,
    },
    { key: 'period', header: 'Competência', render: (row) => row.period },
    {
      key: 'calls',
      header: 'Consultas',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.calls),
    },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'dueDate',
      header: 'Vencimento',
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={invoiceTone[row.status]}>{row.status}</Badge>,
    },
  ];

  const contractColumns: Column<ContractItem>[] = [
    { key: 'product', header: 'Produto', render: (row) => row.product },
    {
      key: 'plan',
      header: 'Plano',
      align: 'center',
      render: (row) => <Badge tone="accent">{row.plan}</Badge>,
    },
    {
      key: 'unitPrice',
      header: 'Preço unitário',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.unitPrice, 3),
    },
    {
      key: 'minimumCalls',
      header: 'Mínimo mensal',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.minimumCalls),
    },
    {
      key: 'renewalAt',
      header: 'Renovação',
      render: (row) => formatDate(row.renewalAt),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => (
        <Badge tone={row.status === 'ativo' ? 'success' : 'warning'}>
          {row.status === 'ativo' ? 'ativo' : 'em renovação'}
        </Badge>
      ),
    },
  ];

  const userColumns: Column<OrgUser>[] = [
    { key: 'email', header: 'Usuário', render: (row) => row.email },
    { key: 'role', header: 'Perfil', render: (row) => roleLabel[row.role] },
    {
      key: 'mfa',
      header: 'MFA',
      align: 'center',
      render: (row) => (
        <Badge tone={row.mfa ? 'success' : 'danger'}>{row.mfa ? 'ativo' : 'pendente'}</Badge>
      ),
    },
    {
      key: 'lastAccessAt',
      header: 'Último acesso',
      render: (row) => formatDateTime(row.lastAccessAt),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F04-US-FE-01"
      title="Console de consumo e faturamento"
      description="Autoatendimento do cliente B2B: consumo por período, projeção de fatura, histórico financeiro, contratos vigentes e gestão de usuários com perfis de acesso."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Console B2B
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /b2b/console
        </Badge>,
        <Badge key="client" tone="neutral" className="font-mono">
          {VEGA.clientId}
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={7}
        empty={{
          title: 'Nenhuma consulta faturável neste período.',
          description: `A conta ${VEGA.name} ainda não registrou chamadas nas competências selecionadas. Faça a primeira consulta no playground com a credencial de sandbox: o consumo aparece aqui em poucos minutos.`,
          action: (
            <Link to="/integracao/playground/decisoes" className={buttonClass('secondary', 'sm')}>
              Fazer a primeira consulta
            </Link>
          ),
        }}
        noResults={{
          active: months !== DEFAULT_MONTHS,
          description:
            'A janela escolhida não tem competência fechada com consumo. Volte para 6 meses para ver a série completa.',
          onClear: () => setMonths(DEFAULT_MONTHS),
        }}
      >
        {(data) => {
          const last = data.usage.at(-1);
          const previous = data.usage.at(-2);
          const calls = sumBy(data.usage, (point) => point.calls);
          const cost = sumBy(data.usage, (point) => point.cost);
          const growth =
            last && previous ? ((last.calls - previous.calls) / previous.calls) * 100 : 0;

          return (
            <div className="grid gap-5">
              {data.invoices.some((invoice) => invoice.status === 'vencida') ? (
                <Notice tone="danger" title="Fatura vencida identificada">
                  A fatura INV-2026-04 está vencida. O acesso à API é suspenso automaticamente após
                  15 dias de atraso.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={formatNumber(last?.calls ?? 0)}
                  label="Consultas no mês atual"
                  icon={<TrendingUp size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatCurrency(last?.cost ?? 0)}
                  label="Fatura projetada"
                  hint="fecha em 31/07/2026"
                />
                <Metric
                  value={`${growth >= 0 ? '+' : ''}${formatNumber(growth, 1)}%`}
                  label="Variação vs. mês anterior"
                  tone={growth >= 0 ? 'success' : 'warning'}
                />
                <Metric
                  value={formatCurrency(cost)}
                  label={`Acumulado em ${months} meses`}
                  hint={`${formatNumber(calls)} consultas`}
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="GET /api/v1/console/usage"
                  title="Consumo mensal"
                  description="Volume de chamadas faturáveis por competência."
                  actions={
                    <div className="flex flex-wrap items-end gap-2">
                      <SelectField
                        label="Janela"
                        value={months}
                        onChange={(event) => setMonths(event.target.value)}
                        options={[
                          { value: '3', label: '3 meses' },
                          { value: '6', label: '6 meses' },
                        ]}
                      />
                      <Button
                        variant="secondary"
                        icon={<Download size={16} aria-hidden="true" />}
                        onClick={() => toast.success('Exportação gerada', 'consumo-prisma.csv')}
                      >
                        CSV
                      </Button>
                    </div>
                  }
                />
                <ColumnChart
                  data={data.usage.map((point) => ({
                    label: point.label,
                    value: point.calls,
                  }))}
                  ariaLabel="Consultas faturáveis por mês"
                />
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {data.contracts.map((contract) => (
                    <ProgressBar
                      key={contract.contractId}
                      label={`${contract.product} — mínimo contratado`}
                      value={Math.min(contract.minimumCalls * 1.35, contract.minimumCalls * 1.5)}
                      max={contract.minimumCalls * 1.5}
                      tone="success"
                    />
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/integracao/playground/decisoes"
                    className={buttonClass('secondary', 'sm')}
                  >
                    Testar nova consulta
                  </Link>
                  <Link to="/b2b/credenciais" className={buttonClass('ghost', 'sm')}>
                    <KeyRound size={14} aria-hidden="true" />
                    Gerenciar credenciais
                  </Link>
                </div>
              </Card>

              <Tabs
                items={[
                  {
                    id: 'faturas',
                    label: 'Faturas',
                    content: (
                      <DataTable
                        caption="Histórico de faturas"
                        columns={invoiceColumns}
                        rows={data.invoices}
                        rowKey={(row) => row.invoiceId}
                        footer="Nota fiscal e boleto disponíveis por 5 anos."
                      />
                    ),
                  },
                  {
                    id: 'contratos',
                    label: 'Contratos',
                    content: (
                      <DataTable
                        caption="Contratos vigentes"
                        columns={contractColumns}
                        rows={data.contracts}
                        rowKey={(row) => row.contractId}
                        footer="Alterações de plano entram em vigor na competência seguinte."
                      />
                    ),
                  },
                  {
                    id: 'usuarios',
                    label: 'Usuários',
                    badge: <Badge tone="neutral">{data.users.length}</Badge>,
                    content: (
                      <div className="grid gap-4">
                        {data.users.some((user) => !user.mfa) ? (
                          <Notice tone="warning" title="Usuário sem MFA">
                            Contas com perfil financeiro devem ativar autenticação em dois fatores.
                          </Notice>
                        ) : null}
                        <DataTable
                          caption="Usuários da organização"
                          columns={userColumns}
                          rows={data.users}
                          rowKey={(row) => row.email}
                          footer="Somente administradores podem convidar ou remover usuários."
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
