import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, Table2 } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  GraphCanvas,
  Metric,
  Notice,
  QueryBoundary,
  Tabs,
} from '@/ds';
import type { Column, GraphNode } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatPercent } from '@/lib/format';
import { portfolioEdges, portfolioNodes, type PortfolioNode } from '@/epics/sala-risco/data';

export function Graph2DPage() {
  const query = useMockQuery(() => ({ nodes: portfolioNodes, edges: portfolioEdges }), {
    latency: 320,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const columns: Column<PortfolioNode>[] = [
    {
      key: 'label',
      header: 'Nó',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.label}</p>
          <p className="text-xs text-eqx-text-muted">
            {row.type} · {row.sector}
          </p>
        </div>
      ),
    },
    {
      key: 'exposure',
      header: 'Exposição',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.exposure, 0),
    },
    {
      key: 'pd',
      header: 'PD',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.pd),
    },
    {
      key: 'overduePct',
      header: 'Em atraso',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.overduePct),
    },
    { key: 'rating', header: 'Rating', align: 'center', render: (row) => row.rating },
    { key: 'community', header: 'Comunidade', render: (row) => row.community },
    {
      key: 'links',
      header: 'Conexões',
      align: 'right',
      numeric: true,
      render: (row) =>
        portfolioEdges.filter((edge) => edge.from === row.id || edge.to === row.id).length,
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F09-US-FE-01"
      title="Sala de risco sem aceleração gráfica"
      description="Alternativa para estações sem WebGL ou acesso por rede restrita: mesmo conteúdo do cockpit em grafo 2D leve em SVG e em tabela navegável por teclado, com equivalência total de informação."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/visao-2d
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'O snapshot do grafo não trouxe nós para desenhar.',
          description:
            'O modo compatível lê o mesmo snapshot do cockpit. Sem nós, a estação continua utilizável: confira o frescor do cubo de arestas e recarregue.',
          action: (
            <Link to="/risco/carteira/frescor" className={buttonClass('secondary')}>
              Ver frescor dos dados
            </Link>
          ),
        }}
      >
        {(data) => {
          const nodes: GraphNode[] = data.nodes.map((node) => ({
            id: node.id,
            label: node.label,
            x: node.x,
            y: node.y,
            size: 8 + (node.exposure / 688_000_000) * 12,
            tone: node.overduePct > 10 ? 'danger' : node.pd > 5 ? 'warning' : 'action',
            community: node.community,
          }));
          return (
            <div className="grid gap-5">
              <Notice tone="info" title="Modo compatível ativo">
                A detecção de WebGL falhou ou o modo compatível foi escolhido manualmente. Todo o
                conteúdo do cockpit permanece disponível, sem animação de física e sem shaders.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={data.nodes.length} label="Nós renderizados" />
                <Metric value={data.edges.length} label="Arestas" tone="action" />
                <Metric
                  value="SVG"
                  label="Tecnologia de render"
                  icon={<MonitorSmartphone size={18} aria-hidden="true" />}
                  hint="sem dependência de GPU"
                />
                <Metric
                  value="AA"
                  label="Conformidade WCAG 2.2"
                  tone="success"
                  hint="tabela equivalente"
                />
              </div>

              <Tabs
                items={[
                  {
                    id: '2d',
                    label: 'Visão 2D',
                    content: (
                      <Card>
                        <CardHeader
                          eyebrow="grafo leve"
                          title="Carteira em SVG"
                          description="GET /api/v1/portfolio/graph/2d — navegável por Tab e Enter."
                        />
                        <GraphCanvas
                          ariaLabel={`Grafo bidimensional da carteira em modo compatível: ${nodes.length} nós com exposição, inadimplência e comunidade`}
                          nodes={nodes}
                          edges={data.edges.map((edge) => ({
                            from: edge.from,
                            to: edge.to,
                            weight: edge.weight,
                            highlight: edge.from === selected || edge.to === selected,
                          }))}
                          selectedId={selected}
                          onSelect={(node) => setSelected(node.id)}
                        />
                        <p className="mt-3 text-sm text-eqx-text-muted">
                          {selected
                            ? `Nó selecionado: ${nodes.find((node) => node.id === selected)?.label}`
                            : 'Use Tab para percorrer os nós e Enter para selecionar.'}
                        </p>
                      </Card>
                    ),
                  },
                  {
                    id: 'tabela',
                    label: 'Visão tabular',
                    badge: <Table2 size={14} aria-hidden="true" />,
                    content: (
                      <Card>
                        <CardHeader
                          eyebrow="equivalente textual"
                          title="Todos os nós em tabela"
                          description="Mesmos dados do grafo, ordenáveis e legíveis por leitor de tela."
                        />
                        <DataTable
                          caption="Nós da carteira com exposição, risco e conexões"
                          columns={columns}
                          rows={data.nodes}
                          rowKey={(row) => row.id}
                          onRowClick={(row) => setSelected(row.id)}
                          isRowActive={(row) => row.id === selected}
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
