import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatSigned } from '@/lib/format';
import { portfolioTimeline, snapshots } from '@/epics/sala-risco/data';

interface DiffRow {
  metric: string;
  before: string;
  after: string;
  delta: string;
  direction: 'up' | 'down' | 'flat';
}

const kindTone = {
  politica: 'accent',
  modelo: 'info',
  limite: 'warning',
  mercado: 'danger',
} as const;

export function RetrospectivePage() {
  const query = useMockQuery(() => ({ snapshots, timeline: portfolioTimeline }), { latency: 340 });
  const [left, setLeft] = useState('2026-06-30');
  const [right, setRight] = useState('2026-07-27');

  const before = snapshots.find((item) => item.asOf === left);
  const after = snapshots.find((item) => item.asOf === right);

  const rows: DiffRow[] =
    before && after
      ? [
          {
            metric: 'Exposição total',
            before: formatCurrency(before.totalExposure, 0),
            after: formatCurrency(after.totalExposure, 0),
            delta: formatSigned((after.totalExposure - before.totalExposure) / 1_000_000, 1) + ' mi',
            direction: after.totalExposure >= before.totalExposure ? 'up' : 'down',
          },
          {
            metric: 'Perda esperada',
            before: formatPercent(before.expectedLossPct),
            after: formatPercent(after.expectedLossPct),
            delta: formatSigned(after.expectedLossPct - before.expectedLossPct, 2) + ' p.p.',
            direction: after.expectedLossPct >= before.expectedLossPct ? 'up' : 'down',
          },
          {
            metric: 'PD média',
            before: formatPercent(before.avgPd),
            after: formatPercent(after.avgPd),
            delta: formatSigned(after.avgPd - before.avgPd, 2) + ' p.p.',
            direction: after.avgPd >= before.avgPd ? 'up' : 'down',
          },
          {
            metric: 'Clientes',
            before: formatNumber(before.clients),
            after: formatNumber(after.clients),
            delta: formatSigned(after.clients - before.clients),
            direction: after.clients >= before.clients ? 'up' : 'down',
          },
          {
            metric: 'Concentração top 5',
            before: formatPercent(before.concentrationTop5Pct),
            after: formatPercent(after.concentrationTop5Pct),
            delta:
              formatSigned(after.concentrationTop5Pct - before.concentrationTop5Pct, 1) + ' p.p.',
            direction:
              after.concentrationTop5Pct >= before.concentrationTop5Pct ? 'up' : 'down',
          },
        ]
      : [];

  const columns: Column<DiffRow>[] = [
    { key: 'metric', header: 'Métrica', render: (row) => row.metric },
    { key: 'before', header: `Em ${formatDate(left)}`, align: 'right', numeric: true, render: (row) => row.before },
    { key: 'after', header: `Em ${formatDate(right)}`, align: 'right', numeric: true, render: (row) => row.after },
    {
      key: 'delta',
      header: 'Variação',
      align: 'right',
      numeric: true,
      render: (row) => (
        <Badge tone={row.direction === 'up' ? 'danger' : 'success'}>{row.delta}</Badge>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F07-US-FE-01"
      title="Retrospectiva de decisão de carteira"
      description="Reconstituição da carteira em qualquer data-base com comparação entre dois instantes, linha do tempo dos eventos que explicam a variação e aviso quando o recálculo divergir do valor histórico registrado."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/retrospectiva
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Não há snapshot de carteira arquivado.',
          description:
            'A retrospectiva compara instantes gravados; sem snapshot não é possível reconstituir a base de uma decisão passada. Verifique o frescor dos cubos e a rotina noturna de arquivamento.',
          action: (
            <Link to="/risco/carteira/frescor" className={buttonClass('secondary')}>
              Ver frescor dos cubos
            </Link>
          ),
        }}
      >
        {(data) => {
          const options = data.snapshots.map((item) => ({
            value: item.asOf,
            label: formatDate(item.asOf),
          }));
          return (
            <div className="grid gap-5">
              <Notice tone="info" title="Reconstituição a partir de snapshots">
                Cada data-base tem snapshot próprio. A retrospectiva usa o valor gravado na época,
                não o recálculo com o modelo atual, para preservar a base da decisão tomada.
              </Notice>

              <Card>
                <CardHeader
                  eyebrow="comparação"
                  title="Selecione as datas-base"
                  description="GET /api/v1/portfolio/snapshot · POST /api/v1/portfolio/compare"
                  actions={<History size={18} aria-hidden="true" />}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Data-base inicial"
                    value={left}
                    onChange={(event) => setLeft(event.target.value)}
                    options={options}
                  />
                  <SelectField
                    label="Data-base final"
                    value={right}
                    onChange={(event) => setRight(event.target.value)}
                    options={options}
                  />
                </div>
              </Card>

              {before && after ? (
                <>
                  {left === right ? (
                    <Notice tone="warning" title="Datas iguais">
                      Selecione datas-base diferentes para ver a variação.
                    </Notice>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                      value={formatCurrency(after.totalExposure, 0)}
                      label="Exposição na data final"
                      hint={`${formatSigned((after.totalExposure - before.totalExposure) / 1_000_000, 1)} mi vs. inicial`}
                    />
                    <Metric
                      value={formatPercent(after.expectedLossPct)}
                      label="Perda esperada"
                      tone={after.expectedLossPct > before.expectedLossPct ? 'danger' : 'success'}
                    />
                    <Metric
                      value={formatNumber(after.clients)}
                      label="Clientes"
                      tone="action"
                      hint={`${formatSigned(after.clients - before.clients)} clientes`}
                    />
                    <Metric
                      value={formatPercent(after.concentrationTop5Pct)}
                      label="Concentração top 5"
                      tone={
                        after.concentrationTop5Pct > before.concentrationTop5Pct
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </div>

                  <Card>
                    <CardHeader
                      eyebrow="diferenças"
                      title={`${formatDate(left)} → ${formatDate(right)}`}
                    />
                    <DataTable
                      caption="Comparação entre snapshots da carteira"
                      columns={columns}
                      rows={rows}
                      rowKey={(row) => row.metric}
                    />
                  </Card>
                </>
              ) : null}

              <Card>
                <CardHeader
                  eyebrow="linha do tempo"
                  title="Eventos que explicam a variação"
                  description="GET /api/v1/portfolio/timeline"
                />
                <ol className="grid gap-4 border-l border-eqx-border pl-5">
                  {data.timeline.map((event) => (
                    <li key={event.at} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-pill bg-eqx-accent"
                      />
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge tone={kindTone[event.kind]}>{event.kind}</Badge>
                        <span className="text-xs text-eqx-text-muted">{formatDate(event.at)}</span>
                      </div>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-sm text-eqx-text-muted">{event.detail}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
