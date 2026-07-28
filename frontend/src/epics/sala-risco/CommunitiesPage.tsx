import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ScanSearch } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Donut,
  KeyValueList,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { communities } from '@/epics/sala-risco/data';
import { cn } from '@/lib/cn';

export function CommunitiesPage() {
  const toast = useToast();
  const query = useMockQuery(() => communities, { latency: 380 });
  const [selectedId, setSelectedId] = useState('com-aurora');

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F06-US-FE-01"
      title="Análise de bolsões de risco"
      description="Comunidades detectadas no grafo da carteira, com exposição agregada, probabilidade média de inadimplência, coesão do agrupamento e drivers de risco comum a todos os integrantes."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/comunidades
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          variant="secondary"
          icon={<ScanSearch size={16} aria-hidden="true" />}
          onClick={() => {
            query.reload();
            toast.info('Detecção agendada', 'POST /api/v1/portfolio/communities/detect');
          }}
        >
          Redetectar
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'A detecção não encontrou bolsões nesta carteira.',
          description:
            'Nenhum agrupamento atingiu a coesão mínima para virar comunidade. Rode a detecção novamente depois da próxima carga do grafo, ou analise a concentração por setor e grupo.',
          action: (
            <Link to="/risco/carteira/concentracao" className={buttonClass('secondary')}>
              Ver radar de concentração
            </Link>
          ),
        }}
      >
        {(list) => {
          const selected = list.find((item) => item.id === selectedId) ?? list[0];
          return (
            <div className="grid gap-5">
              <Notice tone="warning" title="Risco correlacionado dentro de comunidades">
                Integrantes de uma mesma comunidade compartilham fatores de risco. Limites individuais
                adequados podem, somados, exceder o apetite da carteira.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={list.length} label="Comunidades detectadas" />
                <Metric
                  value={formatNumber(list.reduce((sum, row) => sum + row.members, 0))}
                  label="Clientes agrupados"
                  tone="action"
                  icon={<Boxes size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatCurrency(
                    list.reduce((sum, row) => sum + row.exposure, 0),
                    0,
                  )}
                  label="Exposição em comunidades"
                />
                <Metric
                  value={formatPercent(Math.max(...list.map((row) => row.overduePct)))}
                  label="Pior atraso agregado"
                  tone="danger"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <Card>
                  <CardHeader
                    eyebrow="comunidades"
                    title="Agrupamentos por coesão"
                    description="GET /api/v1/portfolio/communities"
                  />
                  <ul className="grid gap-2">
                    {list.map((community) => (
                      <li key={community.id}>
                        <button
                          type="button"
                          aria-pressed={community.id === selected.id}
                          onClick={() => setSelectedId(community.id)}
                          className={cn(
                            'min-h-target w-full rounded-md border px-3 py-3 text-left transition-colors',
                            community.id === selected.id
                              ? 'border-eqx-action bg-eqx-action/10'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle',
                          )}
                        >
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-bold">{community.name}</span>
                            <Badge
                              tone={
                                community.overduePct > 10
                                  ? 'danger'
                                  : community.overduePct > 5
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              atraso {formatPercent(community.overduePct)}
                            </Badge>
                          </span>
                          <span className="mt-1 block text-xs text-eqx-text-muted">
                            {formatNumber(community.members)} clientes ·{' '}
                            {formatCurrency(community.exposure, 0)} · PD média{' '}
                            {formatPercent(community.avgPd)}
                          </span>
                          <span className="mt-2 block">
                            <ProgressBar
                              label={`Coesão ${formatNumber(community.cohesion, 2)}`}
                              value={community.cohesion * 100}
                              tone={community.cohesion > 0.65 ? 'danger' : 'warning'}
                            />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="grid content-start gap-4">
                  <Card accent="danger">
                    <CardHeader
                      eyebrow="detalhe da comunidade"
                      title={selected.name}
                      description={`Setor dominante: ${selected.dominantSector}`}
                      actions={
                        <Link
                          to="/risco/carteira/cockpit"
                          className={buttonClass('secondary', 'sm')}
                        >
                          Ver no grafo
                        </Link>
                      }
                    />
                    <KeyValueList
                      items={[
                        { label: 'Integrantes', value: formatNumber(selected.members) },
                        { label: 'Exposição', value: formatCurrency(selected.exposure, 0) },
                        { label: 'PD média', value: formatPercent(selected.avgPd) },
                        { label: 'Carteira em atraso', value: formatPercent(selected.overduePct) },
                        { label: 'Coesão', value: formatNumber(selected.cohesion, 2) },
                        {
                          label: 'Identificador',
                          value: <code className="text-xs">{selected.id}</code>,
                        },
                      ]}
                    />
                    <h3 className="mb-2 mt-5 text-base">Drivers de risco comum</h3>
                    <ul className="grid gap-2">
                      {selected.drivers.map((driver) => (
                        <li
                          key={driver}
                          className="rounded-md border border-eqx-border bg-eqx-surface-subtle px-3 py-2 text-sm"
                        >
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card>
                    <CardHeader eyebrow="composição" title="Exposição por comunidade" />
                    <Donut
                      ariaLabel="Distribuição da exposição entre as comunidades detectadas, em milhões de reais"
                      centerValue={String(list.length)}
                      centerLabel="comunidades"
                      slices={list.map((community, index) => ({
                        label: community.name,
                        value: community.exposure / 1_000_000,
                        color: [
                          'rgb(var(--color-danger))',
                          'rgb(var(--color-success))',
                          'rgb(var(--color-warning))',
                          'rgb(var(--color-action))',
                        ][index % 4],
                      }))}
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
