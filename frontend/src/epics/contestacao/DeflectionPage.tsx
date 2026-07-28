import { PhoneOff, Sparkles } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Card,
  CardHeader,
  Gauge,
  LineChart,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
} from '@/ds';
import { fetchDeflectionLive } from '@/api/b2bConsole';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatCurrency, formatNumber } from '@/lib/format';
import { deflectionFunnel, deflectionSeries, sacEconomics } from '@/epics/contestacao/data';

export function DeflectionPage() {
  const query = useDataQuery(
    () => ({
      series: deflectionSeries,
      funnel: deflectionFunnel,
      economics: sacEconomics,
    }),
    async () => {
      const data = await fetchDeflectionLive();
      return {
        series: data.deflectionSeries,
        funnel: data.deflectionFunnel,
        economics: data.sacEconomics,
      };
    },
    { latency: 340 },
  );

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F09-US-FE-01"
      title="Desvio de atendimento humano"
      description="Indicador de negócio do épico: percentual de contestações resolvidas no autoatendimento digital, funil de conclusão no portal e economia gerada frente ao custo do atendimento humano."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /disputas/indicadores
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Ainda não há histórico de atendimento para comparar.',
          description:
            'Nenhum mês fechado tem contestação registrada nos canais digital e humano, então não há desvio a calcular. O painel volta a preencher no primeiro fechamento com movimento.',
        }}
      >
        {(data) => {
          const last = data.series.at(-1);
          const first = data.series[0];
          const humanAvoided = last && first ? first.humanCalls - last.humanCalls : 0;
          const funnelEnd = data.funnel.at(-1);
          const conversion =
            funnelEnd && data.funnel.length > 1
              ? (funnelEnd.value / data.funnel[0].value) * 100
              : 0;

          return (
            <div className="grid gap-5">
              <Notice tone="success" title="Meta do épico atingida com folga">
                A meta SMART previa 45% de desvio digital até dezembro de 2026. O patamar atual de{' '}
                {formatNumber(last?.digitalPct ?? 0, 1)}% foi alcançado em julho, cinco meses antes
                do prazo.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={`${formatNumber(last?.digitalPct ?? 0, 1)}%`}
                  label="Desvio digital atual"
                  tone="success"
                  icon={<Sparkles size={18} aria-hidden="true" />}
                  hint={`baseline: ${formatNumber(data.economics.baselineDigitalPct, 1)}%`}
                />
                <Metric
                  value={formatNumber(humanAvoided)}
                  label="Atendimentos humanos evitados"
                  icon={<PhoneOff size={18} aria-hidden="true" />}
                  hint="comparado a fevereiro/2026"
                />
                <Metric
                  value={formatCurrency(data.economics.monthSavings)}
                  label="Economia no mês"
                  tone="success"
                />
                <Metric
                  value={formatCurrency(data.economics.yearToDateSavings)}
                  label="Economia acumulada no ano"
                  hint="custo humano R$ 14,80 vs. digital R$ 0,92"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/disputes/metrics/deflection"
                    title="Evolução do desvio digital"
                    description="Percentual de contestações concluídas sem intervenção humana."
                  />
                  <LineChart
                    ariaLabel="Percentual de desvio digital por mês"
                    unit="%"
                    points={data.series.map((point) => ({
                      label: point.label,
                      value: point.digitalPct,
                      meta: `${formatNumber(point.digitalCalls)} casos digitais`,
                      highlight: point.label === last?.label,
                    }))}
                    band={{ min: 45, max: 60, label: 'faixa de meta' }}
                  />
                </Card>
                <Card>
                  <CardHeader eyebrow="meta" title="Atingimento da meta SMART" />
                  <Gauge
                    value={last?.digitalPct ?? 0}
                    max={60}
                    label="Desvio digital (%)"
                    bands={[
                      {
                        upTo: 30,
                        color: 'rgb(var(--color-danger))',
                        label: 'abaixo do esperado',
                      },
                      {
                        upTo: 45,
                        color: 'rgb(var(--color-warning))',
                        label: 'em evolução',
                      },
                      {
                        upTo: 60,
                        color: 'rgb(var(--color-success))',
                        label: 'meta atingida',
                      },
                    ]}
                  />
                  <div className="mt-5 grid gap-3">
                    <ProgressBar
                      label="Meta 2026 (45%)"
                      value={last?.digitalPct ?? 0}
                      max={45}
                      tone="success"
                    />
                    <ProgressBar
                      label="Ambição de longo prazo (60%)"
                      value={last?.digitalPct ?? 0}
                      max={60}
                      tone="action"
                    />
                  </div>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader
                    eyebrow="funil"
                    title="Conclusão no portal do titular"
                    description={`Conversão de ponta a ponta: ${formatNumber(conversion, 1)}%`}
                  />
                  <BarChart
                    ariaLabel="Funil de conclusão da contestação digital"
                    data={data.funnel.map((step, index, all) => ({
                      label: step.step,
                      value: step.value,
                      tone: index === all.length - 1 ? ('success' as const) : ('action' as const),
                      hint:
                        index > 0
                          ? `${formatNumber((step.value / all[index - 1].value) * 100, 1)}% da etapa anterior`
                          : 'base de acessos autenticados',
                    }))}
                  />
                </Card>
                <Card>
                  <CardHeader
                    eyebrow="composição"
                    title="Canal humano vs. digital"
                    description="Volume mensal de contestações por canal de resolução."
                  />
                  <BarChart
                    ariaLabel="Comparação entre canal humano e digital"
                    data={data.series.flatMap((point) =>
                      point.label === last?.label || point.label === first?.label
                        ? [
                            {
                              label: `${point.label} · humano`,
                              value: point.humanCalls,
                              tone: 'danger' as const,
                            },
                            {
                              label: `${point.label} · digital`,
                              value: point.digitalCalls,
                              tone: 'success' as const,
                            },
                          ]
                        : [],
                    )}
                  />
                  <p className="mt-4 text-sm text-eqx-text-muted">
                    A economia projetada considera {formatCurrency(data.economics.costPerHumanCall)}{' '}
                    por atendimento humano e {formatCurrency(data.economics.costPerDigitalCall)} por
                    atendimento digital, incluindo infraestrutura e custo de modelo.
                  </p>
                </Card>
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
