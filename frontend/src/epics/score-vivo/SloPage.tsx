import { useState } from 'react';
import { Gauge as GaugeIcon, Timer } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Card,
  CardHeader,
  Donut,
  LineChart,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  Tabs,
} from '@/ds';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatNumber, formatPercent } from '@/lib/format';
import { sloSnapshot } from '@/epics/score-vivo/data';
import { fetchSloLive } from '@/api/scorePlatform';
import { cn } from '@/lib/cn';

const traceTone = {
  ok: 'success',
  slow: 'warning',
  error: 'danger',
} as const;

export function SloPage() {
  const query = useDataQuery(sloSnapshot, fetchSloLive, {
    latency: 380,
    refetchInterval: 30_000,
  });
  const [traceIndex, setTraceIndex] = useState(0);

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F08-US-FE-01"
      title="Painel de SLO da decisão"
      description="Percentis de latência contra a meta de 250 ms, disponibilidade, consumo do error budget de 30 dias e inspeção de traces distribuídos por decision_id."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /plataforma/observabilidade/slo
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Sem medições de SLO nesta janela.',
          description:
            'Nenhuma decisão foi observada no período. Amplie a janela ou confirme se o coletor de métricas está publicando latência e disponibilidade.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            {data.latency.p99 > data.latency.target ? (
              <Notice tone="warning" title="p99 acima da meta">
                O percentil 99 está em {data.latency.p99} ms contra a meta de{' '}
                {data.latency.target} ms. O trace <code>dec-2026-07-27-1841</code> aponta
                model-serving como gargalo dominante.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={`${data.latency.p50} ms`}
                label="Latência p50"
                tone="success"
                icon={<Timer size={18} aria-hidden="true" />}
              />
              <Metric
                value={`${data.latency.p95} ms`}
                label="Latência p95"
                tone={data.latency.p95 <= data.latency.target ? 'success' : 'warning'}
                hint={`meta ${data.latency.target} ms`}
              />
              <Metric
                value={`${data.latency.p99} ms`}
                label="Latência p99"
                tone="danger"
                hint="fora da meta"
              />
              <Metric
                value={formatPercent(data.availabilityPct, 2)}
                label="Disponibilidade"
                tone="success"
                hint={data.window}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader
                  eyebrow="latência"
                  title="p95 ao longo do dia"
                  description="GET /api/v1/observability/slo — amostragem a cada 3 horas."
                />
                <LineChart
                  ariaLabel="Percentil 95 de latência ao longo das últimas 24 horas"
                  points={data.series.map((point) => ({ ...point }))}
                  unit=" ms"
                  band={{ min: 0, max: data.latency.target, label: 'dentro da meta' }}
                />
              </Card>
              <Card accent="warning">
                <CardHeader
                  eyebrow="error budget"
                  title={`Consumo de ${data.errorBudget.windowDays} dias`}
                  description="GET /api/v1/observability/budget"
                />
                <Donut
                  ariaLabel={`Error budget consumido: ${data.errorBudget.consumedPct} por cento`}
                  centerValue={`${data.errorBudget.consumedPct}%`}
                  centerLabel="consumido"
                  slices={[
                    {
                      label: 'Consumido',
                      value: data.errorBudget.consumedPct,
                      color: 'rgb(var(--color-danger))',
                    },
                    {
                      label: 'Disponível',
                      value: 100 - data.errorBudget.consumedPct,
                      color: 'rgb(var(--color-success))',
                    },
                  ]}
                />
                <div className="mt-4 grid gap-2">
                  <ProgressBar
                    label="Orçamento restante"
                    value={100 - data.errorBudget.consumedPct}
                    tone="success"
                  />
                  <p className="text-sm text-eqx-text-muted">
                    Restam {data.errorBudget.remainingMinutes} minutos de indisponibilidade
                    admissíveis na janela.
                  </p>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader
                eyebrow="traces"
                title="Traces distribuídos por decisão"
                description="GET /api/v1/observability/traces/{decisionId}"
                actions={
                  <Badge tone="neutral" icon={<GaugeIcon size={12} aria-hidden="true" />}>
                    {data.traces.length} amostras
                  </Badge>
                }
              />
              {data.traces.length === 0 ? (
                <p className="text-sm text-eqx-text-muted">
                  Nenhum trace nesta janela lab. Emita decisões no Playground e consulte traces por
                  decisionId.
                </p>
              ) : (
              <Tabs
                onChange={(id) =>
                  setTraceIndex(data.traces.findIndex((trace) => trace.decisionId === id))
                }
                items={data.traces.map((trace) => ({
                  id: trace.decisionId,
                  label: `${trace.decisionId.slice(-4)} · ${trace.totalMs} ms`,
                  badge: <Badge tone={traceTone[trace.status]}>{trace.status}</Badge>,
                  content: (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-base">Spans</h3>
                        <BarChart
                          ariaLabel={`Duração de cada span do trace ${trace.decisionId}`}
                          unit=" ms"
                          max={Math.max(trace.totalMs, 250)}
                          data={trace.spans.map((span) => ({
                            label: span.name,
                            value: span.ms,
                            tone: span.ms > 150 ? 'danger' : span.ms > 60 ? 'warning' : 'action',
                          }))}
                        />
                      </div>
                      <div>
                        <h3 className="mb-3 text-base">Cascata</h3>
                        <ol className="grid gap-2">
                          {trace.spans.map((span, index) => {
                            const offset = trace.spans
                              .slice(0, index)
                              .reduce((sum, item) => sum + item.ms, 0);
                            return (
                              <li key={span.name} className="text-xs">
                                <div className="mb-1 flex justify-between">
                                  <code>{span.name}</code>
                                  <span className="tabular-nums">{formatNumber(span.ms)} ms</span>
                                </div>
                                <div className="h-3 w-full rounded-pill bg-eqx-surface-subtle">
                                  <div
                                    className={cn(
                                      'h-full rounded-pill',
                                      span.ms > 150 ? 'bg-eqx-danger' : 'bg-eqx-action',
                                    )}
                                    style={{
                                      marginLeft: `${(offset / trace.totalMs) * 100}%`,
                                      width: `${(span.ms / trace.totalMs) * 100}%`,
                                    }}
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                        <p className="mt-3 text-sm text-eqx-text-muted">
                          Trace {traceIndex + 1} de {data.traces.length} · total {trace.totalMs} ms
                        </p>
                      </div>
                    </div>
                  ),
                }))}
              />
              )}
            </Card>
          </div>
        )}
      </QueryBoundary>
    </ScreenLayout>
  );
}
