import { useState } from 'react';
import { AlertOctagon, ScanSearch } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  ColumnChart,
  DataTable,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  Tabs,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import {
  fairnessAlerts,
  fairnessMetrics,
  fairnessSeries,
  type FairnessAlert,
  type FairnessMetric,
} from '@/epics/explicabilidade/data';

const severityTone = {
  critica: 'danger',
  alta: 'warning',
  media: 'info',
} as const;

export function FairnessPage() {
  const toast = useToast();
  const query = useMockQuery(
    () => ({ metrics: fairnessMetrics, alerts: fairnessAlerts, series: fairnessSeries }),
    { latency: 400 },
  );
  const [alert, setAlert] = useState<FairnessAlert | null>(null);

  const columns: Column<FairnessMetric>[] = [
    { key: 'group', header: 'Grupo comparado', render: (row) => row.group },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.volume),
    },
    {
      key: 'approvalRatePct',
      header: 'Taxa de aprovação',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.approvalRatePct),
    },
    {
      key: 'disparateImpact',
      header: 'Disparate impact',
      align: 'right',
      numeric: true,
      render: (row) => (
        <Badge tone={row.disparateImpact >= 0.8 ? 'success' : row.disparateImpact >= 0.7 ? 'warning' : 'danger'}>
          {formatNumber(row.disparateImpact, 2)}
        </Badge>
      ),
    },
    {
      key: 'equalOpportunityGap',
      header: 'Equal opportunity gap',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.equalOpportunityGap, 1)} p.p.`,
    },
  ];

  const breaches = (query.data?.metrics ?? []).filter((item) => item.disparateImpact < 0.8);

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F07-US-FE-01"
      title="Monitoramento de equidade do modelo"
      description="Painel de fairness com disparate impact e equal opportunity gap por grupo comparado, tendência histórica da razão de aprovação e alertas abertos para o comitê de modelos."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/equidade/painel
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          variant="secondary"
          icon={<ScanSearch size={16} aria-hidden="true" />}
          onClick={() => toast.info('Reavaliação agendada', 'POST /api/v1/fairness/evaluate')}
        >
          Reavaliar agora
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Sem avaliação de equidade nesta janela.',
          description:
            'O volume de decisões foi insuficiente para calcular disparate impact com significância. Amplie a janela ou aguarde o próximo ciclo de avaliação.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            {breaches.length ? (
              <Notice
                tone="danger"
                title={`${breaches.length} grupos abaixo do piso de 0,80 de disparate impact`}
              >
                A política interna exige plano de mitigação em até 5 dias úteis e comunicação ao
                comitê de modelos. Grupos afetados: {breaches.map((item) => item.group).join(', ')}.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={formatNumber(
                  Math.min(...data.metrics.map((item) => item.disparateImpact)),
                  2,
                )}
                label="Pior disparate impact"
                tone="danger"
                hint="piso regulatório interno: 0,80"
              />
              <Metric
                value={`${formatNumber(
                  Math.max(...data.metrics.map((item) => item.equalOpportunityGap)),
                  1,
                )} p.p.`}
                label="Maior equal opportunity gap"
                tone="warning"
                hint="tolerância: 5,0 p.p."
              />
              <Metric
                value={data.alerts.filter((item) => item.status === 'aberto').length}
                label="Alertas abertos"
                tone="danger"
                icon={<AlertOctagon size={18} aria-hidden="true" />}
              />
              <Metric
                value={formatNumber(data.metrics.reduce((sum, item) => sum + item.volume, 0))}
                label="Decisões avaliadas"
                hint="janela de 30 dias"
              />
            </div>

            <Tabs
              items={[
                {
                  id: 'grupos',
                  label: 'Grupos comparados',
                  content: (
                    <Card>
                      <CardHeader
                        eyebrow="métricas"
                        title="Equidade por grupo"
                        description="GET /api/v1/fairness/metrics — comparação contra o grupo de referência."
                      />
                      <DataTable
                        caption="Métricas de equidade por grupo"
                        columns={columns}
                        rows={data.metrics}
                        rowKey={(row) => row.group}
                      />
                    </Card>
                  ),
                },
                {
                  id: 'tendencia',
                  label: 'Tendência',
                  content: (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader
                          eyebrow="série histórica"
                          title="Disparate impact do grupo thin-file"
                          description="Deterioração progressiva desde a ativação da política policy-pf-16."
                        />
                        <ColumnChart
                          ariaLabel="Evolução mensal do disparate impact do grupo thin-file"
                          digits={2}
                          data={data.series.map((point) => ({
                            label: point.label,
                            value: point.value,
                            tone: point.value >= 0.8 ? 'success' : 'danger',
                          }))}
                        />
                        <p className="mt-3 text-sm text-eqx-text-muted">
                          Piso interno de 0,80 rompido a partir de maio; queda acentuada em junho com
                          a entrada da política <code>policy-pf-17</code>.
                        </p>
                      </Card>
                      <Card>
                        <CardHeader eyebrow="comparação" title="Taxa de aprovação por grupo" />
                        <BarChart
                          ariaLabel="Taxa de aprovação por grupo comparado"
                          unit="%"
                          digits={1}
                          data={data.metrics.map((item) => ({
                            label: item.group,
                            value: item.approvalRatePct,
                            tone: item.disparateImpact >= 0.8 ? 'success' : 'danger',
                          }))}
                        />
                      </Card>
                    </div>
                  ),
                },
                {
                  id: 'alertas',
                  label: `Alertas (${data.alerts.length})`,
                  content: (
                    <div className="grid gap-3">
                      {data.alerts.map((item) => (
                        <Card
                          key={item.alertId}
                          interactive
                          accent={item.severity === 'critica' ? 'danger' : 'warning'}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <Badge tone={severityTone[item.severity]}>{item.severity}</Badge>
                                <Badge tone="neutral">{item.status}</Badge>
                                <code className="text-xs text-eqx-text-muted">{item.alertId}</code>
                              </div>
                              <h3 className="text-lg">
                                {item.metric} · {item.group}
                              </h3>
                              <p className="mt-1 text-sm text-eqx-text-muted">{item.detail}</p>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => setAlert(item)}>
                              Investigar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(alert)}
        onClose={() => setAlert(null)}
        title={alert ? `${alert.metric} · ${alert.group}` : ''}
        description="Detalhe do alerta de equidade"
        footer={
          <Button
            onClick={() => {
              toast.success('Plano de mitigação aberto', 'Encaminhado ao comitê de modelos');
              setAlert(null);
            }}
          >
            Abrir plano de mitigação
          </Button>
        }
      >
        {alert ? (
          <div className="grid gap-5">
            <KeyValueList
              columns={1}
              items={[
                { label: 'Alerta', value: <code className="text-xs">{alert.alertId}</code> },
                { label: 'Detectado em', value: formatDateTime(alert.detectedAt) },
                { label: 'Severidade', value: alert.severity },
                { label: 'Situação', value: alert.status },
              ]}
            />
            <Notice tone="warning" title="Diagnóstico">
              {alert.detail}
            </Notice>
            <p className="text-sm text-eqx-text-muted">
              Próximos passos sugeridos: revisar atributos correlacionados ao grupo, avaliar
              reponderação no treino e simular a política alternativa no ensaio de política.
            </p>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
