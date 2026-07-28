import { useState } from 'react';
import { Coins, Route } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  Gauge,
  Metric,
  Notice,
  QueryBoundary,
  TextAreaField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import {
  costBudget,
  costByAnalyst,
  costByModel,
  routingPolicy,
  type CostByAnalyst,
  type CostByModel,
} from '@/epics/copiloto-pj/data';

export function CostTelemetryPage() {
  const toast = useToast();
  const query = useMockQuery(
    () => ({ models: costByModel, analysts: costByAnalyst, budget: costBudget }),
    { latency: 380 },
  );
  const [rule, setRule] = useState(routingPolicy.rule);

  const modelColumns: Column<CostByModel>[] = [
    { key: 'model', header: 'Modelo', render: (row) => <code className="text-xs">{row.model}</code> },
    {
      key: 'calls',
      header: 'Chamadas',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.calls),
    },
    {
      key: 'inputTokens',
      header: 'Tokens entrada',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.inputTokens / 1_000_000, 1) + ' mi',
    },
    {
      key: 'outputTokens',
      header: 'Tokens saída',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.outputTokens / 1_000_000, 1) + ' mi',
    },
    {
      key: 'avgLatencyMs',
      header: 'Latência média',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.avgLatencyMs / 1000, 2)} s`,
    },
    {
      key: 'cost',
      header: 'Custo',
      align: 'right',
      numeric: true,
      render: (row) => <strong>{formatCurrency(row.cost)}</strong>,
    },
  ];

  const analystColumns: Column<CostByAnalyst>[] = [
    { key: 'analyst', header: 'Analista', render: (row) => row.analyst },
    {
      key: 'opinions',
      header: 'Pareceres',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.opinions),
    },
    {
      key: 'cost',
      header: 'Custo total',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.cost),
    },
    {
      key: 'avgCost',
      header: 'Custo por parecer',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.avgCost > costBudget.targetCostPerOpinion ? 'font-semibold text-eqx-danger' : undefined
          }
        >
          {formatCurrency(row.avgCost)}
        </span>
      ),
    },
    {
      key: 'reworkPct',
      header: 'Retrabalho',
      align: 'right',
      numeric: true,
      render: (row) => (
        <Badge tone={row.reworkPct > 15 ? 'danger' : row.reworkPct > 10 ? 'warning' : 'success'}>
          {formatPercent(row.reworkPct)}
        </Badge>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F09-US-FE-01"
      title="Custo de inferência por parecer"
      description="Telemetria de custo do copiloto: consumo contra o orçamento mensal, custo por modelo e por analista, retrabalho associado e política de roteamento entre modelo completo e econômico."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/telemetria/custo
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Ainda não há consumo de inferência neste ciclo.',
          description:
            'A telemetria começa a preencher no primeiro parecer gerado do mês. Sem consumo, o custo por parecer não é calculado para não exibir média sobre base zero.',
        }}
      >
        {(data) => {
          const usage = data.budget.consumed / data.budget.monthlyBudget;
          return (
            <div className="grid gap-5">
              <Notice
                tone={usage > 0.9 ? 'danger' : usage > 0.75 ? 'warning' : 'success'}
                title={`${formatPercent(usage * 100, 1)} do orçamento mensal consumido`}
              >
                {formatCurrency(data.budget.consumed)} de{' '}
                {formatCurrency(data.budget.monthlyBudget)} em{' '}
                {formatNumber(data.budget.opinionsMonth)} pareceres. O roteamento por complexidade
                economiza {formatPercent(routingPolicy.savingsPct, 0)} em relação a usar sempre o
                modelo completo.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={formatCurrency(data.budget.actualCostPerOpinion)}
                  label="Custo por parecer"
                  tone={
                    data.budget.actualCostPerOpinion <= data.budget.targetCostPerOpinion
                      ? 'success'
                      : 'danger'
                  }
                  hint={`meta ${formatCurrency(data.budget.targetCostPerOpinion)}`}
                  icon={<Coins size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatCurrency(data.budget.consumed)}
                  label="Consumo no mês"
                  hint={`orçamento ${formatCurrency(data.budget.monthlyBudget)}`}
                />
                <Metric
                  value={formatNumber(data.budget.opinionsMonth)}
                  label="Pareceres emitidos"
                  tone="action"
                />
                <Metric
                  value={formatPercent(routingPolicy.fullModelSharePct, 0)}
                  label="Uso do modelo completo"
                  hint="restante no modelo econômico"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <Card>
                  <CardHeader eyebrow="orçamento" title="Consumo do mês" />
                  <Gauge
                    value={data.budget.consumed}
                    max={data.budget.monthlyBudget}
                    label={`${formatCurrency(data.budget.consumed)} consumidos`}
                    bands={[
                      {
                        upTo: data.budget.monthlyBudget * 0.75,
                        color: 'rgb(var(--color-success))',
                        label: 'saudável',
                      },
                      {
                        upTo: data.budget.monthlyBudget * 0.9,
                        color: 'rgb(var(--color-warning))',
                        label: 'atenção',
                      },
                      {
                        upTo: data.budget.monthlyBudget,
                        color: 'rgb(var(--color-danger))',
                        label: 'limite',
                      },
                    ]}
                  />
                </Card>
                <Card>
                  <CardHeader
                    eyebrow="composição"
                    title="Custo por modelo"
                    description="GET /api/v1/pj/telemetry/cost"
                  />
                  <BarChart
                    ariaLabel="Custo mensal por modelo de inferência"
                    unit=""
                    digits={0}
                    data={data.models.map((row) => ({
                      label: row.model,
                      value: row.cost,
                      tone: row.model.includes('mini') ? 'success' : 'action',
                      hint: `${formatNumber(row.calls)} chamadas · ${formatCurrency(row.cost)}`,
                    }))}
                  />
                </Card>
              </div>

              <Card>
                <CardHeader eyebrow="detalhe" title="Consumo por modelo" />
                <DataTable
                  caption="Custo e latência por modelo"
                  columns={modelColumns}
                  rows={data.models}
                  rowKey={(row) => row.model}
                  footer={`Total ${formatCurrency(
                    data.models.reduce((sum, row) => sum + row.cost, 0),
                  )}`}
                />
              </Card>

              <Card>
                <CardHeader
                  eyebrow="por analista"
                  title="Custo e retrabalho por analista"
                  description="Retrabalho elevado indica necessidade de treinamento no uso do copiloto."
                />
                <DataTable
                  caption="Custo por analista"
                  columns={analystColumns}
                  rows={data.analysts}
                  rowKey={(row) => row.analyst}
                />
              </Card>

              <Card accent="action">
                <CardHeader
                  eyebrow="operação"
                  title="Política de roteamento de modelos"
                  description="POST /api/v1/pj/routing/policy"
                  actions={<Route size={18} aria-hidden="true" />}
                />
                <TextAreaField
                  label="Regra de roteamento"
                  value={rule}
                  onChange={(event) => setRule(event.target.value)}
                  rows={4}
                  hint="Casos complexos vão ao modelo completo; o restante usa o econômico."
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      toast.success('Política atualizada', 'Vigente para novas requisições')
                    }
                  >
                    Salvar política
                  </Button>
                  <Button variant="ghost" onClick={() => setRule(routingPolicy.rule)}>
                    Restaurar padrão
                  </Button>
                </div>
              </Card>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
