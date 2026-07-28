import { useMemo, useState } from 'react';
import { Network, RefreshCw } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  GraphCanvas,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column, GraphNode } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/format';
import { groupResponse, type GroupMember } from '@/epics/copiloto-pj/data';

const roleTone = {
  controladora: 'brand',
  controlada: 'info',
  coligada: 'accent',
  parte_relacionada: 'neutral',
} as const;

const positions: Record<string, { x: number; y: number }> = {
  '11.222.333/0001-44': { x: 240, y: 60 },
  '12.345.678/0001-90': { x: 140, y: 170 },
  '22.333.444/0001-55': { x: 350, y: 165 },
  '33.444.555/0001-66': { x: 120, y: 265 },
};

export function EconomicGroupPage() {
  const toast = useToast();
  const query = useMockQuery(() => groupResponse, { latency: 400 });
  const [selected, setSelected] = useState<string | null>('12.345.678/0001-90');

  const nodes: GraphNode[] = useMemo(
    () =>
      (query.data?.members ?? []).map((member) => ({
        id: member.cnpj,
        label: member.name,
        x: positions[member.cnpj]?.x ?? 240,
        y: positions[member.cnpj]?.y ?? 150,
        size: 10 + (member.exposure / 6_100_000) * 8,
        tone: member.overdue > 0 ? 'danger' : member.role === 'controladora' ? 'accent' : 'action',
        community: member.role,
      })),
    [query.data],
  );

  const columns: Column<GroupMember>[] = [
    {
      key: 'name',
      header: 'Parte relacionada',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.name}</p>
          <p className="text-xs text-eqx-text-muted">{row.cnpj}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vínculo',
      align: 'center',
      render: (row) => <Badge tone={roleTone[row.role]}>{row.role.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'participationPct',
      header: 'Participação',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.participationPct, 0),
    },
    {
      key: 'exposure',
      header: 'Exposição',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.exposure, 0),
    },
    {
      key: 'overdue',
      header: 'Em atraso',
      align: 'right',
      numeric: true,
      render: (row) =>
        row.overdue > 0 ? (
          <span className="font-semibold text-eqx-danger">{formatCurrency(row.overdue, 0)}</span>
        ) : (
          <span className="text-eqx-text-muted">—</span>
        ),
    },
    { key: 'riskGrade', header: 'Rating', align: 'center', render: (row) => row.riskGrade },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F08-US-FE-01"
      title="Análise do grupo econômico"
      description="Grafo societário com participações, exposição consolidada por CNPJ, alerta de sobreposição de risco e aviso explícito quando a travessia do grafo é truncada por profundidade."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/:cnpj/grupo-economico
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => {
            query.reload();
            toast.info('Atualização em fila', 'POST /api/v1/pj/group/refresh');
          }}
        >
          Atualizar grupo
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum vínculo societário encontrado para este CNPJ.',
          description:
            'A base de participações não retornou partes relacionadas. Analise o cliente isoladamente e registre no parecer que o grupo econômico não foi comprovado.',
        }}
      >
        {(data) => {
          const member = data.members.find((item) => item.cnpj === selected);
          return (
            <div className="grid gap-5">
              {data.truncated ? (
                <Notice tone="warning" title={`Travessia truncada na profundidade ${data.depth}`}>
                  Existem vínculos além do nível 3 que não foram percorridos. A exposição consolidada
                  pode estar subestimada; solicite análise manual para grupos com holding no exterior.
                </Notice>
              ) : null}

              {data.members.some((item) => item.overdue > 0) ? (
                <Notice tone="danger" title="Sobreposição de risco no grupo">
                  Aurora Logística apresenta {formatCurrency(3_400_000, 0)} em atraso. A concessão ao
                  CNPJ analisado eleva a exposição consolidada do grupo para{' '}
                  {formatCurrency(data.totalExposure + 5_500_000, 0)}.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={data.members.length} label="CNPJs no grupo" />
                <Metric
                  value={formatCurrency(data.totalExposure, 0)}
                  label="Exposição consolidada"
                  tone="action"
                />
                <Metric
                  value={formatCurrency(
                    data.members.reduce((sum, item) => sum + item.overdue, 0),
                    0,
                  )}
                  label="Total em atraso"
                  tone="danger"
                />
                <Metric
                  value={data.depth}
                  label="Profundidade percorrida"
                  hint={`atualizado em ${formatDateTime(data.refreshedAt)}`}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader
                    eyebrow="estrutura societária"
                    title="Grafo do grupo"
                    description="GET /api/v1/pj/{cnpj}/group — selecione um nó para ver a exposição."
                    actions={<Network size={18} aria-hidden="true" />}
                  />
                  <GraphCanvas
                    ariaLabel="Grafo societário do grupo Aurora: participação e exposição de cada CNPJ relacionado"
                    nodes={nodes}
                    edges={data.edges.map((edge) => ({
                      from: edge.from,
                      to: edge.to,
                      weight: 2,
                      highlight: edge.from === selected || edge.to === selected,
                    }))}
                    selectedId={selected}
                    onSelect={(node) => setSelected(node.id)}
                  />
                  <p className="mt-3 text-sm text-eqx-text-muted">
                    Nós em vermelho possuem atraso ativo. O tamanho do nó é proporcional à exposição.
                  </p>
                </Card>

                <div className="grid content-start gap-4">
                  {member ? (
                    <Card accent="action">
                      <CardHeader eyebrow="nó selecionado" title={member.name} />
                      <KeyValueList
                        items={[
                          { label: 'CNPJ', value: member.cnpj },
                          { label: 'Vínculo', value: member.role.replace(/_/g, ' ') },
                          { label: 'Participação', value: formatPercent(member.participationPct, 0) },
                          { label: 'Exposição', value: formatCurrency(member.exposure, 0) },
                          { label: 'Em atraso', value: formatCurrency(member.overdue, 0) },
                          { label: 'Rating', value: member.riskGrade },
                        ]}
                      />
                    </Card>
                  ) : null}
                  <Card>
                    <CardHeader
                      eyebrow="partes relacionadas"
                      title="Exposição por CNPJ"
                      description="GET /api/v1/pj/{cnpj}/related-parties"
                    />
                    <DataTable
                      caption="Partes relacionadas do grupo econômico"
                      columns={columns}
                      rows={data.members}
                      rowKey={(row) => row.cnpj}
                      onRowClick={(row) => setSelected(row.cnpj)}
                      isRowActive={(row) => row.cnpj === selected}
                      dense
                    />
                  </Card>
                </div>
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
