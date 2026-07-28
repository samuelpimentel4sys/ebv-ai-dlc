import { useState } from 'react';
import { Activity, PlayCircle, TriangleAlert } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  KeyValueList,
  LineChart,
  Metric,
  Notice,
  QueryBoundary,
  Tabs,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  driftFeatures,
  monitoringAlerts,
  monitoringThresholds,
  vintages,
  type DriftFeature,
  type MonitoringAlert,
  type VintagePerformance,
} from '@/epics/thinfile/data';

const driftTone = {
  estavel: 'success',
  atencao: 'warning',
  deriva: 'danger',
} as const;
const severityTone = {
  alta: 'danger',
  media: 'warning',
  baixa: 'info',
} as const;
const alertStatusTone = {
  aberto: 'danger',
  em_analise: 'warning',
  resolvido: 'success',
} as const;

export function DriftPage() {
  const toast = useToast();
  const [nonce, setNonce] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const query = useMockQuery(
    () => ({
      features: driftFeatures,
      vintages,
      alerts: monitoringAlerts,
      thresholds: monitoringThresholds,
    }),
    { latency: 400, deps: [nonce] },
  );

  const featureColumns: Column<DriftFeature>[] = [
    { key: 'feature', header: 'Feature', render: (row) => row.feature },
    {
      key: 'psi',
      header: 'PSI',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.psi > row.threshold ? 'font-semibold text-eqx-danger' : undefined}>
          {formatNumber(row.psi, 2)}
        </span>
      ),
    },
    {
      key: 'threshold',
      header: 'Limite',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.threshold, 2),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={driftTone[row.status]}>{row.status}</Badge>,
    },
    { key: 'note', header: 'Observação', render: (row) => row.note },
  ];

  const vintageColumns: Column<VintagePerformance>[] = [
    { key: 'vintage', header: 'Safra', render: (row) => row.vintage },
    {
      key: 'ks',
      header: 'KS',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.ks < monitoringThresholds.ksFloor ? 'font-semibold text-eqx-danger' : undefined
          }
        >
          {formatNumber(row.ks, 1)}
        </span>
      ),
    },
    {
      key: 'auc',
      header: 'AUC',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.auc, 3),
    },
    {
      key: 'badRate',
      header: 'Inadimplência',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.badRate, 1)}%`,
    },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.volume),
    },
  ];

  const alertColumns: Column<MonitoringAlert>[] = [
    { key: 'at', header: 'Quando', render: (row) => formatDateTime(row.at) },
    {
      key: 'severity',
      header: 'Severidade',
      align: 'center',
      render: (row) => <Badge tone={severityTone[row.severity]}>{row.severity}</Badge>,
    },
    {
      key: 'title',
      header: 'Alerta',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold">{row.title}</p>
          <p className="text-xs text-eqx-text-muted">{row.detail}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Tratativa',
      align: 'center',
      render: (row) => (
        <Badge tone={alertStatusTone[row.status]}>{row.status.replace('_', ' ')}</Badge>
      ),
    },
  ];

  function evaluate() {
    setEvaluating(true);
    toast.info('Avaliação disparada', 'POST /api/v1/thinfile/monitoring/evaluate');
    setTimeout(() => {
      setEvaluating(false);
      setNonce((value) => value + 1);
      toast.success('Avaliação concluída', 'Métricas recalculadas na safra corrente');
    }, 1_400);
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F09-US-FE-01"
      title="Deriva e performance do modelo thin-file"
      description="Monitoramento contínuo do modelo em produção: PSI por feature contra limites definidos, performance por safra, alertas com tratativa e disparo manual de reavaliação antes do gatilho de retreino."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Thin-file
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /thinfile/monitoramento
        </Badge>,
      ]}
      actions={
        <Button
          icon={<PlayCircle size={16} aria-hidden="true" />}
          loading={evaluating}
          onClick={evaluate}
        >
          Reavaliar agora
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={7}
        empty={{
          title: 'Ainda não há safra fechada para avaliar deriva.',
          description:
            'O monitoramento precisa de pelo menos uma safra com janela de observação completa para calcular PSI e KS. Dispare "Reavaliar agora" após o próximo fechamento para popular o painel.',
        }}
      >
        {(data) => {
          const drifting = data.features.filter((item) => item.status === 'deriva');
          const lastVintage = data.vintages.at(-1);

          return (
            <div className="grid gap-5">
              {drifting.length > 0 ? (
                <Notice
                  tone="danger"
                  title={`${drifting.length} feature(s) com deriva acima do limite`}
                >
                  O gatilho de retreino é: {data.thresholds.retrainTrigger}. Enquanto houver deriva,
                  as decisões seguem válidas, mas a área de modelagem precisa registrar a análise de
                  causa.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={formatNumber(lastVintage?.ks ?? 0, 1)}
                  label="KS da safra atual"
                  tone={(lastVintage?.ks ?? 0) < data.thresholds.ksFloor ? 'danger' : 'success'}
                  hint={`piso operacional: ${data.thresholds.ksFloor}`}
                  icon={<Activity size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatNumber(lastVintage?.auc ?? 0, 3)}
                  label="AUC da safra atual"
                  hint="referência de publicação: 0,782"
                />
                <Metric
                  value={drifting.length}
                  label="Features em deriva"
                  tone={drifting.length > 0 ? 'danger' : 'success'}
                  icon={<TriangleAlert size={18} aria-hidden="true" />}
                />
                <Metric
                  value={data.alerts.filter((alert) => alert.status !== 'resolvido').length}
                  label="Alertas em aberto"
                  tone="warning"
                  hint={`última avaliação: ${formatDateTime(data.thresholds.lastEvaluationAt)}`}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/thinfile/monitoring"
                    title="Evolução do KS por safra"
                    description="Queda sustentada abaixo do piso aciona o gatilho de retreino."
                  />
                  <LineChart
                    ariaLabel="Evolução do KS por safra"
                    points={data.vintages.map((vintage) => ({
                      label: vintage.vintage,
                      value: vintage.ks,
                      meta: `AUC ${formatNumber(vintage.auc, 3)} · inadimplência ${formatNumber(vintage.badRate, 1)}%`,
                      highlight: vintage.vintage === lastVintage?.vintage,
                    }))}
                    band={{
                      min: data.thresholds.ksFloor,
                      max: 45,
                      label: 'faixa operacional saudável',
                    }}
                  />
                </Card>
                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/thinfile/drift"
                    title="PSI por feature"
                    description={`Alerta em ${data.thresholds.psiWarning}; crítico em ${data.thresholds.psiCritical}.`}
                  />
                  <BarChart
                    ariaLabel="PSI por feature do modelo thin-file"
                    digits={2}
                    max={data.thresholds.psiCritical}
                    data={data.features.map((feature) => ({
                      label: feature.feature,
                      value: feature.psi,
                      tone:
                        feature.status === 'deriva'
                          ? 'danger'
                          : feature.status === 'atencao'
                            ? 'warning'
                            : 'success',
                    }))}
                  />
                </Card>
              </div>

              <Tabs
                items={[
                  {
                    id: 'features',
                    label: 'Deriva por feature',
                    content: (
                      <DataTable
                        caption="PSI por feature contra limite"
                        columns={featureColumns}
                        rows={data.features}
                        rowKey={(row) => row.feature}
                      />
                    ),
                  },
                  {
                    id: 'safras',
                    label: 'Comparativo de safras',
                    content: (
                      <DataTable
                        caption="Performance por safra"
                        columns={vintageColumns}
                        rows={data.vintages}
                        rowKey={(row) => row.vintage}
                        footer="Safras trimestrais com janela de observação de 12 meses."
                      />
                    ),
                  },
                  {
                    id: 'alertas',
                    label: 'Alertas',
                    badge: (
                      <Badge tone="neutral">
                        {data.alerts.filter((alert) => alert.status !== 'resolvido').length}
                      </Badge>
                    ),
                    content: (
                      <DataTable
                        caption="Alertas de monitoramento"
                        columns={alertColumns}
                        rows={data.alerts}
                        rowKey={(row) => row.alertId}
                      />
                    ),
                  },
                  {
                    id: 'politica',
                    label: 'Política de monitoramento',
                    content: (
                      <Card>
                        <CardHeader
                          eyebrow="governança"
                          title="Limites e gatilhos"
                          description="Parâmetros aprovados pelo comitê de modelos."
                        />
                        <KeyValueList
                          items={[
                            {
                              label: 'PSI de alerta',
                              value: formatNumber(data.thresholds.psiWarning, 2),
                            },
                            {
                              label: 'PSI crítico',
                              value: formatNumber(data.thresholds.psiCritical, 2),
                            },
                            {
                              label: 'Piso de KS',
                              value: data.thresholds.ksFloor,
                            },
                            {
                              label: 'Última avaliação',
                              value: formatDateTime(data.thresholds.lastEvaluationAt),
                            },
                            {
                              label: 'Gatilho de retreino',
                              value: data.thresholds.retrainTrigger,
                            },
                            {
                              label: 'Frequência',
                              value: 'diária às 06h (America/Sao_Paulo)',
                            },
                          ]}
                        />
                      </Card>
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
