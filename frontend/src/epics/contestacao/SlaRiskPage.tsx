import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, RefreshCw } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  Tabs,
} from '@/ds';
import type { Column } from '@/ds';
import { fetchEscalationsLive, fetchSlaCasesLive } from '@/api/dispute';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  escalations,
  slaCases,
  slaPolicies,
  stageLabel,
  type Escalation,
  type SlaCase,
} from '@/epics/contestacao/data';

const bandTone = {
  no_prazo: 'success',
  atencao: 'info',
  risco: 'warning',
  estourado: 'danger',
} as const;

const bandLabel: Record<SlaCase['band'], string> = {
  no_prazo: 'No prazo',
  atencao: 'Atenção',
  risco: 'Risco',
  estourado: 'Estourado',
};

const bandFilters = [
  { value: 'todas', label: 'Todas as faixas' },
  { value: 'estourado', label: 'Apenas estourados' },
  { value: 'risco', label: 'Apenas em risco' },
  { value: 'atencao', label: 'Apenas em atenção' },
  { value: 'no_prazo', label: 'Apenas no prazo' },
];

const allBands: SlaCase['band'][] = ['no_prazo', 'atencao', 'risco', 'estourado'];

export function SlaRiskPage() {
  const navigate = useNavigate();
  const [nonce, setNonce] = useState(0);
  const [band, setBand] = useState('todas');

  const casesQuery = useDataQuery(
    () => slaCases.filter((item) => band === 'todas' || item.band === band),
    async () => {
      const cases = await fetchSlaCasesLive();
      return cases.filter((item) => band === 'todas' || item.band === band);
    },
    {
      latency: 320,
      deps: [nonce, band],
      refetchInterval: 45_000,
      isEmpty: (rows) => rows.length === 0,
    },
  );

  const escalationsQuery = useDataQuery(() => escalations, fetchEscalationsLive, {
    latency: 260,
    deps: [nonce],
  });

  const caseColumns: Column<SlaCase>[] = [
    {
      key: 'protocol',
      header: 'Protocolo',
      render: (row) => <code className="text-xs">{row.protocol}</code>,
    },
    { key: 'stage', header: 'Etapa', render: (row) => stageLabel[row.stage] },
    {
      key: 'channel',
      header: 'Canal',
      align: 'center',
      render: (row) => row.channel,
    },
    {
      key: 'hoursRemaining',
      header: 'Horas restantes',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.hoursRemaining < 0 ? 'font-semibold text-eqx-danger' : undefined}>
          {formatNumber(row.hoursRemaining)} h
        </span>
      ),
    },
    {
      key: 'consumo',
      header: 'Consumo do SLA',
      render: (row) => (
        <ProgressBar
          label={`${formatNumber(((row.slaHours - row.hoursRemaining) / row.slaHours) * 100)}% de ${row.slaHours} h`}
          value={Math.max(row.slaHours - row.hoursRemaining, 0)}
          max={row.slaHours}
          tone={row.band === 'estourado' ? 'danger' : row.band === 'risco' ? 'warning' : 'action'}
        />
      ),
    },
    {
      key: 'band',
      header: 'Faixa',
      align: 'center',
      render: (row) => <Badge tone={bandTone[row.band]}>{bandLabel[row.band]}</Badge>,
    },
    {
      key: 'assignee',
      header: 'Responsável',
      render: (row) => row.assignee ?? <Badge tone="warning">não atribuído</Badge>,
    },
  ];

  const escalationColumns: Column<Escalation>[] = [
    { key: 'at', header: 'Quando', render: (row) => formatDateTime(row.at) },
    {
      key: 'protocol',
      header: 'Protocolo',
      render: (row) => <code className="text-xs">{row.protocol}</code>,
    },
    { key: 'from', header: 'De', render: (row) => row.from },
    {
      key: 'to',
      header: 'Para',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold">
          <ArrowUpRight size={12} aria-hidden="true" />
          {row.to}
        </span>
      ),
    },
    { key: 'reason', header: 'Motivo', render: (row) => row.reason },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F06-US-FE-01"
      title="Monitor de risco de SLA"
      description="Painel de gestão do prazo regulatório: consumo do SLA por caso, faixas de risco, escalonamento automático por canal e histórico de repasses entre times."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /disputas/sla
        </Badge>,
      ]}
      actions={
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => setNonce((value) => value + 1)}
        >
          Atualizar
        </Button>
      }
      wide
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader
            eyebrow="filtro"
            title="Faixa de prazo"
            description="GET /api/v1/disputes/sla — recorte usado nos indicadores e na tabela."
          />
          <div className="max-w-xs">
            <SelectField
              label="Faixa"
              value={band}
              onChange={(event) => setBand(event.target.value)}
              options={bandFilters}
            />
          </div>
        </Card>

        <QueryBoundary
          query={casesQuery}
          loadingRows={6}
          empty={{
            title: 'Nenhum caso com prazo em curso.',
            description:
              'Não há contestação com SLA aberto neste momento — nada a priorizar. O painel volta a listar casos assim que uma nova contestação entrar na fila.',
          }}
          noResults={{
            active: band !== 'todas',
            description: `Nenhum caso está na faixa "${
              bandFilters.find((option) => option.value === band)?.label ?? band
            }" agora. Volte para todas as faixas para ver a carteira completa de prazos.`,
            onClear: () => setBand('todas'),
          }}
        >
          {(cases) => {
            const compliance =
              (cases.filter((item) => item.band !== 'estourado').length / cases.length) * 100;
            const distribution = allBands.map((item) => ({
              band: item,
              count: cases.filter((entry) => entry.band === item).length,
            }));
            return (
              <div className="grid gap-5">
                {cases.some((item) => item.band === 'estourado') ? (
                  <Notice tone="danger" title="SLA estourado exige justificativa formal">
                    Casos fora do prazo geram notificação à coordenação e entram no relatório mensal
                    ao regulador. Registre a causa raiz antes de concluir a tratativa.
                  </Notice>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    value={`${formatNumber(compliance, 1)}%`}
                    label="Aderência ao SLA"
                    tone={compliance >= 95 ? 'success' : 'warning'}
                    hint="meta: 98%"
                  />
                  <Metric
                    value={cases.filter((item) => item.band === 'risco').length}
                    label="Casos em risco"
                    tone="warning"
                    icon={<AlertTriangle size={18} aria-hidden="true" />}
                  />
                  <Metric
                    value={cases.filter((item) => item.band === 'estourado').length}
                    label="Casos estourados"
                    tone="danger"
                  />
                  <Metric
                    value={cases.length}
                    label="Casos monitorados"
                    hint="atualização automática a cada 45 s"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
                  <Card>
                    <CardHeader eyebrow="distribuição" title="Casos por faixa de prazo" />
                    <BarChart
                      ariaLabel="Distribuição de casos por faixa de SLA"
                      data={distribution.map((item) => ({
                        label: bandLabel[item.band],
                        value: item.count,
                        tone:
                          item.band === 'estourado'
                            ? 'danger'
                            : item.band === 'risco'
                              ? 'warning'
                              : item.band === 'atencao'
                                ? 'action'
                                : 'success',
                      }))}
                    />
                  </Card>
                  <Card>
                    <CardHeader
                      eyebrow="política"
                      title="Regras de escalonamento por canal"
                      description="Disparo automático ao atingir o percentual configurado do prazo."
                    />
                    <ul className="grid gap-3">
                      {slaPolicies.map((policy) => (
                        <li
                          key={policy.channel}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-eqx-border px-3 py-2 text-sm"
                        >
                          <span className="font-semibold">{policy.channel}</span>
                          <span className="text-eqx-text-muted">SLA {policy.slaHours} h</span>
                          <Badge tone="info">escala em {policy.escalateAtPct}%</Badge>
                          <code className="text-xs">{policy.notify}</code>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <Tabs
                  items={[
                    {
                      id: 'casos',
                      label: 'Casos monitorados',
                      content: (
                        <DataTable
                          caption="Casos com consumo de SLA"
                          columns={caseColumns}
                          rows={cases}
                          rowKey={(row) => row.id}
                          onRowClick={() => navigate('/disputas/fila')}
                          footer="Selecione um caso para abrir a fila de tratativa. Atualização automática a cada 45 segundos."
                        />
                      ),
                    },
                    {
                      id: 'escalonamentos',
                      label: 'Escalonamentos',
                      content: (
                        <QueryBoundary
                          query={escalationsQuery}
                          loadingRows={3}
                          empty={{
                            title: 'Nenhum escalonamento nos últimos 7 dias.',
                            description:
                              'Nenhum caso precisou ser repassado a outro time no período — sinal de que os prazos estão sendo tratados na primeira fila.',
                          }}
                        >
                          {(rows) => (
                            <DataTable
                              caption="Histórico de escalonamentos"
                              columns={escalationColumns}
                              rows={rows}
                              rowKey={(row) => `${row.protocol}-${row.at}`}
                              footer={`${rows.length} escalonamento(s) automático(s) e manual(is) nos últimos 7 dias.`}
                            />
                          )}
                        </QueryBoundary>
                      ),
                    },
                  ]}
                />
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </ScreenLayout>
  );
}
