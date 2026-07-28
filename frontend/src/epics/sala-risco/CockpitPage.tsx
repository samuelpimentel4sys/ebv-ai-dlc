import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Layers } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Drawer,
  EmptyState,
  GraphCanvas,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
} from '@/ds';
import type { GraphNode } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import {
  lodLevels,
  portfolioEdges,
  portfolioNodes,
  portfolioSummary,
  type PortfolioNode,
} from '@/epics/sala-risco/data';
import { cn } from '@/lib/cn';

const typeRank = { setor: 0, grupo: 1, cliente: 2 } as const;

const DEFAULT_LOD = 'cliente';
const DEFAULT_SECTOR = 'todos';

export function CockpitPage() {
  const query = useMockQuery(
    () => ({ nodes: portfolioNodes, edges: portfolioEdges, summary: portfolioSummary }),
    { latency: 420 },
  );
  const [lod, setLod] = useState<string>(DEFAULT_LOD);
  const [sector, setSector] = useState<string>(DEFAULT_SECTOR);
  const [detail, setDetail] = useState<PortfolioNode | null>(null);

  const sectors = useMemo(() => ['todos', ...new Set(portfolioNodes.map((node) => node.sector))], []);
  const filtered = lod !== DEFAULT_LOD || sector !== DEFAULT_SECTOR;

  function clearFilters() {
    setLod(DEFAULT_LOD);
    setSector(DEFAULT_SECTOR);
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F01-US-FE-01"
      title="Cockpit de exploração da carteira"
      description="Exploração visual da carteira com nível de detalhe ajustável entre setor, grupo econômico e cliente, filtros por setor e detalhe de cada nó com exposição, probabilidade de inadimplência e comunidade."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/cockpit
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'A carteira não devolveu nenhum nó para explorar.',
          description:
            'Sem grafo carregado não há exposição para navegar. Confira o frescor do cubo graph_edges_snapshot: quando a carga falha, o cockpit fica sem nós.',
          action: (
            <Link to="/risco/carteira/frescor" className={buttonClass('secondary')}>
              Ver frescor dos dados
            </Link>
          ),
        }}
        noResults={{
          active: filtered,
          onClear: clearFilters,
          description:
            'O nível de detalhe e o filtro de setor combinados excluíram todos os nós. Limpe os filtros para voltar à carteira completa.',
        }}
      >
        {(data) => {
          const maxRank = typeRank[lod as keyof typeof typeRank];
          const visible = data.nodes.filter(
            (node) =>
              typeRank[node.type] <= maxRank &&
              (sector === DEFAULT_SECTOR || node.sector === sector),
          );
          const visibleIds = new Set(visible.map((node) => node.id));
          const nodes: GraphNode[] = visible.map((node) => ({
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            size: 8 + (node.exposure / 688_000_000) * 14,
            tone:
              node.overduePct > 10
                ? 'danger'
                : node.pd > 5
                  ? 'warning'
                  : node.type === 'setor'
                    ? 'accent'
                    : 'action',
            community: node.community,
          }));
          return (
            <div className="grid gap-5">
              <Notice tone="info" title="Nível de detalhe controlado pelo cliente">
                A agregação acontece no servidor: cada nível carrega apenas os nós necessários,
                mantendo o grafo responsivo mesmo em carteiras com dezenas de milhares de clientes.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={formatCurrency(data.summary.totalExposure, 0)}
                  label="Exposição total"
                />
                <Metric
                  value={formatNumber(data.summary.clients)}
                  label="Clientes na carteira"
                  tone="action"
                />
                <Metric
                  value={formatPercent(data.summary.expectedLossPct)}
                  label="Perda esperada"
                  tone="warning"
                />
                <Metric
                  value={data.summary.breachedLimits}
                  label="Limites estourados"
                  tone="danger"
                  hint="ver radar de concentração"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="controles"
                  title="Nível de detalhe e filtros"
                  description="POST /api/v1/portfolio/filter"
                  actions={<Filter size={18} aria-hidden="true" />}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Nível de detalhe</p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Nível de detalhe do grafo"
                    >
                      {lodLevels.map((level) => (
                        <button
                          key={level.id}
                          type="button"
                          aria-pressed={lod === level.id}
                          onClick={() => setLod(level.id)}
                          className={cn(
                            'inline-flex min-h-[2.5rem] items-center gap-2 rounded-pill border px-4 text-sm font-semibold',
                            lod === level.id
                              ? 'border-eqx-action bg-eqx-action text-white'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle',
                          )}
                        >
                          <Layers size={14} aria-hidden="true" />
                          {level.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-eqx-text-muted">
                      {lodLevels.find((level) => level.id === lod)?.description}
                    </p>
                  </div>
                  <SelectField
                    label="Setor"
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                    options={sectors.map((item) => ({
                      value: item,
                      label: item === DEFAULT_SECTOR ? 'Todos os setores' : item,
                    }))}
                  />
                </div>
              </Card>

              {visible.length === 0 ? (
                <EmptyState
                  title="Nenhum nó sobrou depois dos filtros."
                  description="A combinação de nível de detalhe e setor não tem exposição correspondente. Limpe os filtros para voltar à carteira completa."
                  action={
                    <Button variant="secondary" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <Card>
                    <CardHeader
                      eyebrow="grafo da carteira"
                      title={`${nodes.length} nós visíveis`}
                      description="GET /api/v1/portfolio/graph — clique em um nó para abrir o detalhe."
                    />
                    <GraphCanvas
                      ariaLabel={`Grafo da carteira no nível ${lod}: exposição e inadimplência de ${nodes.length} nós entre setores, grupos econômicos e clientes`}
                      nodes={nodes}
                      edges={data.edges
                        .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
                        .map((edge) => ({
                          from: edge.from,
                          to: edge.to,
                          weight: edge.weight,
                          highlight: edge.kind === 'cadeia',
                        }))}
                      selectedId={detail?.id ?? null}
                      onSelect={(node) =>
                        setDetail(data.nodes.find((item) => item.id === node.id) ?? null)
                      }
                    />
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-eqx-text-muted">
                      <span>· Tamanho do nó: exposição</span>
                      <span>· Vermelho: atraso acima de 10%</span>
                      <span>· Aresta destacada: relação de cadeia produtiva</span>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader
                      eyebrow="ranking"
                      title="Maiores exposições visíveis"
                      description="Ordenado por exposição no nível de detalhe atual."
                    />
                    <ul className="grid gap-2">
                      {[...visible]
                        .sort((a, b) => b.exposure - a.exposure)
                        .map((node) => (
                          <li key={node.id}>
                            <button
                              type="button"
                              onClick={() => setDetail(node)}
                              className={cn(
                                'flex min-h-[2.5rem] w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left',
                                node.id === detail?.id
                                  ? 'border-eqx-action bg-eqx-action/10'
                                  : 'border-eqx-border hover:bg-eqx-surface-subtle',
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">
                                  {node.label}
                                </span>
                                <span className="text-xs text-eqx-text-muted">
                                  {node.type} · {node.sector} · comunidade {node.community}
                                </span>
                              </span>
                              <span className="shrink-0 text-right">
                                <span className="block text-sm font-bold tabular-nums">
                                  {formatCurrency(node.exposure, 0)}
                                </span>
                                <Badge
                                  tone={node.pd > 5 ? 'danger' : node.pd > 3 ? 'warning' : 'success'}
                                >
                                  PD {formatPercent(node.pd)}
                                </Badge>
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </Card>
                </div>
              )}
            </div>
          );
        }}
      </QueryBoundary>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.label ?? ''}
        description={detail ? `${detail.type} · ${detail.sector}` : ''}
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Exposição', value: formatCurrency(detail.exposure, 0) },
                { label: 'Probabilidade de inadimplência', value: formatPercent(detail.pd) },
                { label: 'Carteira em atraso', value: formatPercent(detail.overduePct) },
                { label: 'Rating', value: detail.rating },
                { label: 'Comunidade', value: detail.community },
                { label: 'Identificador', value: <code className="text-xs">{detail.id}</code> },
              ]}
            />
            <Notice
              tone={detail.overduePct > 10 ? 'danger' : detail.pd > 5 ? 'warning' : 'success'}
              title="Leitura de risco"
            >
              {detail.overduePct > 10
                ? 'Nó com atraso material: candidato natural a origem de simulação de contágio.'
                : detail.pd > 5
                  ? 'Probabilidade de inadimplência acima da média da carteira.'
                  : 'Comportamento dentro do esperado para o setor.'}
            </Notice>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/risco/carteira/contagio?origem=${detail.id}`}
                className={buttonClass()}
              >
                Simular contágio a partir de {detail.label}
              </Link>
              <Link to="/risco/carteira/comunidades" className={buttonClass('secondary')}>
                Ver comunidade {detail.community}
              </Link>
            </div>
            <p className="text-sm text-eqx-text-muted">
              GET /api/v1/portfolio/graph/node/{detail.id} retorna vizinhança de segundo grau,
              garantias vinculadas e histórico de rating.
            </p>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
