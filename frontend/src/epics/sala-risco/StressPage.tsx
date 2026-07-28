import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileStack, Gauge as GaugeIcon, PlayCircle } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Gauge,
  Metric,
  Notice,
  QueryBoundary,
  SkeletonPanel,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatNumber, formatPercent, formatSigned } from '@/lib/format';
import {
  runStress,
  stressScenarios,
  type StressResult,
  type StressScenario,
} from '@/epics/sala-risco/data';
import { cn } from '@/lib/cn';

type Migration = StressResult['ratingMigration'][number];

const CUSTOM_DEFAULTS: StressScenario = {
  id: 'custom',
  name: 'Cenário do comitê',
  selicPp: 2,
  gdpPct: -0.5,
  unemploymentPp: 1.2,
  fxPct: 10,
  description: 'Parametrizado ao vivo na reunião de risco.',
  official: false,
};

export function StressPage() {
  const toast = useToast();
  const query = useMockQuery(() => stressScenarios, { latency: 340 });
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get('cenario') ?? 'adverso');
  const [custom, setCustom] = useState<StressScenario>(CUSTOM_DEFAULTS);
  const [result, setResult] = useState<StressResult | null>(null);
  const [running, setRunning] = useState(false);

  function run(scenario: StressScenario) {
    setRunning(true);
    toast.info('Execução enfileirada', 'POST /api/v1/portfolio/stress/run');
    window.setTimeout(() => {
      setResult(runStress(scenario));
      setRunning(false);
    }, 900);
  }

  const migrationColumns: Column<Migration>[] = [
    { key: 'from', header: 'Rating origem', render: (row) => row.from },
    { key: 'to', header: 'Rating destino', render: (row) => row.to },
    {
      key: 'volume',
      header: 'Clientes migrados',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.volume),
    },
    {
      key: 'impact',
      header: 'Direção',
      align: 'center',
      render: (row) => (
        <Badge tone={row.to === 'default' ? 'danger' : 'warning'}>
          {row.to === 'default' ? 'inadimplência' : 'rebaixamento'}
        </Badge>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F03-US-FE-01"
      title="Execução de cenário em reunião"
      description="Console de estresse macro pensado para uso ao vivo em comitê: cenários oficiais pré-configurados, ajuste de variáveis em tempo real e resultado com perda esperada, impacto de capital e migração de rating."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/estresse
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhum cenário de estresse está publicado.',
          description:
            'A execução ao vivo depende de cenários macro publicados pela área de modelos. Solicite a publicação do cenário base e do adverso regulatório para reabrir o console.',
        }}
      >
        {(list) => {
          const scenario =
            scenarioId === 'custom'
              ? custom
              : (list.find((item) => item.id === scenarioId) ?? custom);
          return (
            <div className="grid gap-5">
              <Card>
                <CardHeader
                  eyebrow="cenários"
                  title="Escolha do cenário"
                  description="GET /api/v1/portfolio/stress/scenarios"
                />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {list.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={scenarioId === item.id}
                      onClick={() => setScenarioId(item.id)}
                      className={cn(
                        'min-h-target rounded-md border p-4 text-left transition-colors',
                        scenarioId === item.id
                          ? 'border-eqx-action bg-eqx-action/10'
                          : 'border-eqx-border hover:bg-eqx-surface-subtle',
                      )}
                    >
                      <span className="mb-1 flex items-center gap-2">
                        <Badge tone={item.official ? 'info' : 'accent'}>
                          {item.official ? 'oficial' : 'ao vivo'}
                        </Badge>
                      </span>
                      <span className="block text-sm font-bold">{item.name}</span>
                      <span className="mt-1 block text-xs text-eqx-text-muted">
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card accent="action">
                <CardHeader
                  eyebrow="variáveis macro"
                  title={scenarioId === 'custom' ? 'Ajuste ao vivo' : 'Parâmetros do cenário'}
                  description={
                    scenarioId === 'custom'
                      ? 'Mova os controles durante a reunião; o resultado é recalculado ao executar.'
                      : 'Cenários oficiais têm parâmetros fixos para garantir comparabilidade.'
                  }
                />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      key: 'selicPp',
                      label: 'Selic (p.p.)',
                      min: -2,
                      max: 8,
                      step: 0.5,
                      value: scenario.selicPp,
                    },
                    {
                      key: 'gdpPct',
                      label: 'PIB (%)',
                      min: -6,
                      max: 4,
                      step: 0.1,
                      value: scenario.gdpPct,
                    },
                    {
                      key: 'unemploymentPp',
                      label: 'Desemprego (p.p.)',
                      min: 0,
                      max: 6,
                      step: 0.2,
                      value: scenario.unemploymentPp,
                    },
                    {
                      key: 'fxPct',
                      label: 'Câmbio (%)',
                      min: -10,
                      max: 40,
                      step: 1,
                      value: scenario.fxPct,
                    },
                  ].map((slider) => (
                    <div key={slider.key}>
                      <label htmlFor={slider.key} className="mb-1 block text-sm font-semibold">
                        {slider.label}: {formatNumber(slider.value, 1)}
                      </label>
                      <input
                        id={slider.key}
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={slider.value}
                        disabled={scenarioId !== 'custom'}
                        onChange={(event) =>
                          setCustom((current) => ({
                            ...current,
                            [slider.key]: Number(event.target.value),
                          }))
                        }
                        className="h-2 w-full accent-eqx-action disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Button
                    loading={running}
                    icon={<PlayCircle size={16} aria-hidden="true" />}
                    onClick={() => run(scenario)}
                  >
                    Executar cenário
                  </Button>
                </div>
              </Card>

              {running ? <SkeletonPanel rows={4} /> : null}

              {result && !running ? (
                <>
                  <Notice
                    tone={
                      result.expectedLossPct > 6
                        ? 'danger'
                        : result.expectedLossPct > 4.5
                          ? 'warning'
                          : 'success'
                    }
                    title={`${result.scenarioName}: perda esperada de ${formatPercent(result.expectedLossPct)}`}
                    actions={
                      <Link
                        to={`/risco/carteira/dossie-comite?cenario=${scenario.id}`}
                        className={buttonClass('primary', 'sm')}
                      >
                        <FileStack size={16} aria-hidden="true" />
                        Levar ao dossiê do comitê
                      </Link>
                    }
                  >
                    Execução <code>{result.runId}</code> concluída. Impacto de capital de{' '}
                    {formatSigned(-result.capitalImpactPp, 2)} p.p. no índice de Basileia.
                  </Notice>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                      value={formatPercent(result.expectedLossPct)}
                      label="Perda esperada"
                      tone={result.expectedLossPct > 5 ? 'danger' : 'warning'}
                    />
                    <Metric
                      value={formatCurrency(result.expectedLossAmount, 0)}
                      label="Perda em valor"
                      tone="danger"
                    />
                    <Metric
                      value={`${formatNumber(result.capitalImpactPp, 2)} p.p.`}
                      label="Consumo de capital"
                      tone="warning"
                      icon={<GaugeIcon size={18} aria-hidden="true" />}
                    />
                    <Metric
                      value={formatNumber(
                        result.ratingMigration.reduce((sum, row) => sum + row.volume, 0),
                      )}
                      label="Clientes rebaixados"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
                    <Card>
                      <CardHeader eyebrow="severidade" title="Perda esperada vs. apetite" />
                      <Gauge
                        value={result.expectedLossPct}
                        max={10}
                        label={`${formatPercent(result.expectedLossPct)} de perda esperada`}
                        bands={[
                          {
                            upTo: 4,
                            color: 'rgb(var(--color-success))',
                            label: 'dentro do apetite',
                          },
                          { upTo: 6, color: 'rgb(var(--color-warning))', label: 'atenção' },
                          {
                            upTo: 10,
                            color: 'rgb(var(--color-danger))',
                            label: 'acima do apetite',
                          },
                        ]}
                      />
                    </Card>
                    <Card>
                      <CardHeader
                        eyebrow="quebra setorial"
                        title="Perda esperada por setor"
                        description="GET /api/v1/portfolio/stress/{runId}"
                      />
                      <BarChart
                        ariaLabel={`Perda esperada por setor no cenário ${result.scenarioName}, em percentual da exposição`}
                        unit="%"
                        digits={2}
                        data={result.bySector.map((row) => ({
                          label: row.sector,
                          value: row.lossPct,
                          tone:
                            row.lossPct > 6 ? 'danger' : row.lossPct > 4.5 ? 'warning' : 'success',
                        }))}
                      />
                    </Card>
                  </div>

                  <Card>
                    <CardHeader eyebrow="migração" title="Migração de rating projetada" />
                    <DataTable
                      caption="Migração de rating no cenário executado"
                      columns={migrationColumns}
                      rows={result.ratingMigration}
                      rowKey={(row) => `${row.from}-${row.to}`}
                    />
                  </Card>
                </>
              ) : null}
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
