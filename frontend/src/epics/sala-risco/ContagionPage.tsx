import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Waves, Zap } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Accordion,
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
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { AURORA } from '@/app/story';
import {
  portfolioNodes,
  simulateContagion,
  type ContagionResult,
  type PortfolioNode,
} from '@/epics/sala-risco/data';

type CriticalNode = ContagionResult['criticalNodes'][number];

const DEFAULT_SEVERITY = 60;

const originCandidates = portfolioNodes.filter((node) => node.type !== 'setor');

/**
 * A fixture canónica identifica a Aurora por `aurora`, enquanto o grafo prefixa
 * o id por tipo (`grp-`, `cli-`). O casamento por inclusão mantém a trilha
 * funcionando com qualquer das duas formas na URL.
 */
function resolveOrigin(id: string | null): PortfolioNode {
  const wanted = id ?? AURORA.graphNodeId;
  return (
    originCandidates.find((node) => node.id === wanted) ??
    originCandidates.find((node) => node.id.includes(wanted)) ??
    originCandidates[0]
  );
}

export function ContagionPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const originParam = searchParams.get('origem');

  const [origin, setOrigin] = useState(() => resolveOrigin(originParam).id);
  const [severity, setSeverity] = useState(DEFAULT_SEVERITY);
  const [run, setRun] = useState(() => ({
    origin: resolveOrigin(originParam).id,
    severity: DEFAULT_SEVERITY,
  }));

  // O passo anterior da trilha entrega o nó pela URL: trocar de origem sem
  // remontar a tela precisa recentrar a simulação.
  useEffect(() => {
    const resolved = resolveOrigin(originParam);
    setOrigin(resolved.id);
    setSeverity(DEFAULT_SEVERITY);
    setRun({ origin: resolved.id, severity: DEFAULT_SEVERITY });
  }, [originParam]);

  const query = useMockQuery(() => simulateContagion(run.origin, run.severity), {
    latency: 720,
    deps: [run.origin, run.severity],
  });

  const runOrigin = portfolioNodes.find((node) => node.id === run.origin);
  const runOriginLabel = runOrigin?.label ?? run.origin;

  const columns: Column<CriticalNode>[] = [
    { key: 'label', header: 'Nó', render: (row) => row.label },
    {
      key: 'systemicScore',
      header: 'Score sistêmico',
      align: 'right',
      numeric: true,
      render: (row) => (
        <Badge
          tone={row.systemicScore >= 80 ? 'danger' : row.systemicScore >= 70 ? 'warning' : 'neutral'}
        >
          {row.systemicScore}
        </Badge>
      ),
    },
    {
      key: 'betweenness',
      header: 'Intermediação',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.betweenness, 2),
    },
    {
      key: 'exposure',
      header: 'Exposição',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.exposure, 0),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F02-US-FE-01"
      title="Simulação de efeito dominó"
      description="Propagação de um choque a partir de um nó de origem, com perda por onda, perda acumulada, ranking de nós sistemicamente críticos e premissas explícitas do modelo de contágio."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/contagio
        </Badge>,
        <Badge key="origem" tone="info">
          origem {runOriginLabel}
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        {originParam ? (
          <Notice
            tone="info"
            title={`Simulação centrada em ${runOriginLabel}`}
            actions={
              <Link to="/risco/carteira/cockpit" className={buttonClass('secondary', 'sm')}>
                Voltar ao cockpit
              </Link>
            }
          >
            O nó veio da seleção feita no cockpit da carteira. Troque a origem abaixo para comparar
            outra ponta da cadeia sem perder o cenário.
          </Notice>
        ) : null}

        <Card>
          <CardHeader
            eyebrow="parâmetros"
            title="Configuração do choque"
            description="Escolha o nó de origem e a severidade do evento."
            actions={<Zap size={18} aria-hidden="true" />}
          />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <SelectField
              label="Nó de origem"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              options={originCandidates.map((node) => ({
                value: node.id,
                label: `${node.label} · ${formatCurrency(node.exposure, 0)}`,
              }))}
            />
            <div>
              <label htmlFor="severity" className="mb-1 block text-sm font-semibold">
                Severidade do choque: {severity}%
              </label>
              <input
                id="severity"
                type="range"
                min={10}
                max={100}
                step={5}
                value={severity}
                onChange={(event) => setSeverity(Number(event.target.value))}
                className="h-2 w-full accent-eqx-action"
              />
              <p className="mt-1 text-xs text-eqx-text-muted">
                Percentual da exposição do nó de origem que entra em inadimplência.
              </p>
            </div>
            <Button
              loading={query.status === 'loading'}
              onClick={() => {
                if (run.origin === origin && run.severity === severity) {
                  query.reload();
                } else {
                  setRun({ origin, severity });
                }
                toast.info('Simulação enfileirada', 'POST /api/v1/portfolio/contagion/simulate');
              }}
            >
              Simular propagação
            </Button>
          </div>
        </Card>

        <QueryBoundary
          query={query}
          loadingRows={5}
          empty={{
            title: `Nenhuma propagação a partir de ${runOriginLabel}.`,
            description:
              'O nó escolhido não tem aresta de cadeia, garantia ou participação no snapshot atual do grafo. Escolha outra origem ou confira o frescor do cubo de arestas.',
            action: (
              <Link to="/risco/carteira/frescor" className={buttonClass('secondary')}>
                Ver frescor dos dados
              </Link>
            ),
          }}
        >
          {(result) => {
            const total = result.waves[result.waves.length - 1].cumulativeLoss;
            return (
              <div className="grid gap-5">
                <Notice tone="warning" title="Cenário hipotético, não previsão">
                  Choque de {result.shockSeverityPct}% sobre {runOriginLabel}. Perda total estimada de{' '}
                  {formatCurrency(total, 0)} em {result.waves.length} ondas de propagação.
                </Notice>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    value={formatCurrency(total, 0)}
                    label="Perda acumulada"
                    tone="danger"
                    icon={<Waves size={18} aria-hidden="true" />}
                  />
                  <Metric value={result.waves.length} label="Ondas de propagação" />
                  <Metric
                    value={result.waves.reduce((sum, wave) => sum + wave.affectedNodes.length, 0)}
                    label="Nós afetados"
                    tone="warning"
                  />
                  <Metric
                    value={formatPercent((total / 2_124_000_000) * 100, 2)}
                    label="Impacto sobre a carteira"
                    hint="perda acumulada ÷ exposição total"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader
                      eyebrow="propagação"
                      title="Perda por onda"
                      description="Cada onda representa um salto na cadeia de relacionamento."
                    />
                    <ColumnChart
                      ariaLabel={`Perda estimada por onda de propagação a partir de ${runOriginLabel}`}
                      digits={1}
                      unit=" mi"
                      data={result.waves.map((wave) => ({
                        label: `Onda ${wave.wave}`,
                        value: wave.lossAmount / 1_000_000,
                        tone: wave.wave === 1 ? 'danger' : wave.wave === 2 ? 'warning' : 'action',
                      }))}
                    />
                    <div className="mt-4 grid gap-3">
                      {result.waves.map((wave) => (
                        <div key={wave.wave}>
                          <ProgressBar
                            label={`Onda ${wave.wave}: ${wave.affectedNodes.join(', ')}`}
                            value={(wave.cumulativeLoss / total) * 100}
                            tone={wave.wave <= 2 ? 'danger' : 'warning'}
                          />
                          <p className="mt-1 text-xs text-eqx-text-muted">
                            perda da onda {formatCurrency(wave.lossAmount, 0)} · acumulada{' '}
                            {formatCurrency(wave.cumulativeLoss, 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="grid content-start gap-4">
                    <Card>
                      <CardHeader
                        eyebrow="nós críticos"
                        title="Ranking sistêmico"
                        description="GET /api/v1/portfolio/contagion/critical"
                        actions={
                          <Link
                            to="/risco/carteira/comunidades"
                            className={buttonClass('secondary', 'sm')}
                          >
                            Ver comunidades
                          </Link>
                        }
                      />
                      <DataTable
                        caption="Nós sistemicamente críticos da carteira"
                        columns={columns}
                        rows={result.criticalNodes}
                        rowKey={(row) => row.id}
                        dense
                      />
                    </Card>
                    <Card accent="warning">
                      <CardHeader eyebrow="transparência" title="Premissas do modelo" />
                      <Accordion
                        items={[
                          {
                            id: 'premissas',
                            title: `${result.premises.length} premissas aplicadas`,
                            content: (
                              <ul className="grid gap-2 text-sm">
                                {result.premises.map((premise) => (
                                  <li key={premise}>· {premise}</li>
                                ))}
                              </ul>
                            ),
                          },
                        ]}
                      />
                      <p className="mt-3 text-xs text-eqx-text-muted">
                        Identificador da execução: <code>{result.runId}</code>
                      </p>
                    </Card>
                  </div>
                </div>
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </ScreenLayout>
  );
}
