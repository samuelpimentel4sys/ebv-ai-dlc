import { useState } from 'react';
import { Radar, SlidersHorizontal } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  Metric,
  Notice,
  QueryBoundary,
  TextAreaField,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/format';
import {
  concentration,
  concentrationAlerts,
  type ConcentrationAlert,
  type ConcentrationLimit,
} from '@/epics/sala-risco/data';

const statusTone = {
  ok: 'success',
  alerta: 'warning',
  estouro: 'danger',
} as const;

export function ConcentrationPage() {
  const toast = useToast();
  const query = useMockQuery(
    () => ({ limits: concentration, alerts: concentrationAlerts }),
    { latency: 360 },
  );
  const [limits, setLimits] = useState<ConcentrationLimit[] | null>(null);
  const [editing, setEditing] = useState<ConcentrationLimit | null>(null);
  const [newLimit, setNewLimit] = useState('');
  const [note, setNote] = useState('');

  const rows = limits ?? query.data?.limits ?? [];

  function edit(limit: ConcentrationLimit) {
    setEditing(limit);
    setNewLimit(String(limit.limitPct));
    setNote('');
  }

  /** O alerta identifica a categoria como "Dimensão · Categoria"; o limite vigente é a tratativa. */
  function treat(alert: ConcentrationAlert) {
    const [dimension, bucket] = alert.bucket.split(' · ');
    const target = rows.find((row) => row.dimension === dimension && row.bucket === bucket);
    if (!target) {
      toast.error('Limite não encontrado', `Nenhum limite vigente para ${alert.bucket}`);
      return;
    }
    edit(target);
  }

  const columns: Column<ConcentrationLimit>[] = [
    { key: 'dimension', header: 'Dimensão', render: (row) => row.dimension },
    { key: 'bucket', header: 'Categoria', render: (row) => <strong>{row.bucket}</strong> },
    {
      key: 'exposure',
      header: 'Exposição',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.exposure, 0),
    },
    {
      key: 'sharePct',
      header: 'Participação',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.sharePct),
    },
    {
      key: 'limitPct',
      header: 'Limite',
      align: 'right',
      numeric: true,
      render: (row) => formatPercent(row.limitPct, 0),
    },
    {
      key: 'headroom',
      header: 'Folga',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.limitPct - row.sharePct < 0 ? 'font-semibold text-eqx-danger' : undefined}>
          {formatPercent(row.limitPct - row.sharePct)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Limite',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<SlidersHorizontal size={14} aria-hidden="true" />}
          onClick={() => edit(row)}
        >
          Ajustar
        </Button>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F04-US-FE-01"
      title="Acompanhamento de concentração"
      description="Radar de concentração por setor, região, grupo econômico e produto, com limites configuráveis, folga em relação ao teto aprovado, alertas diários e registro de nota de ação."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/concentracao
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum limite de concentração está configurado.',
          description:
            'Sem limite cadastrado a carteira não é monitorada por dimensão. Cadastre os tetos por setor, região, grupo econômico e produto para que os alertas diários passem a rodar.',
        }}
      >
        {(data) => {
          const list = limits ?? data.limits;
          const breaches = list.filter((row) => row.status === 'estouro');
          return (
            <div className="grid gap-5">
              {breaches.length ? (
                <Notice tone="danger" title={`${breaches.length} limites estourados`}>
                  {breaches
                    .map(
                      (row) =>
                        `${row.bucket} (${formatPercent(row.sharePct)} de ${formatPercent(row.limitPct, 0)})`,
                    )
                    .join(' · ')}
                  . Exige plano de redução ou aprovação formal de exceção pelo comitê.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={breaches.length} label="Limites estourados" tone="danger" />
                <Metric
                  value={list.filter((row) => row.status === 'alerta').length}
                  label="Em zona de alerta"
                  tone="warning"
                  icon={<Radar size={18} aria-hidden="true" />}
                />
                <Metric
                  value={data.alerts.filter((row) => !row.note).length}
                  label="Alertas sem tratativa"
                />
                <Metric
                  value={formatPercent(Math.max(...list.map((row) => row.sharePct - row.limitPct)))}
                  label="Maior excesso"
                  tone="danger"
                  hint="participação acima do teto"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="radar"
                  title="Participação por categoria contra o teto"
                  description="GET /api/v1/portfolio/concentration"
                />
                <BarChart
                  ariaLabel="Participação de cada categoria na carteira comparada ao limite aprovado"
                  unit="%"
                  digits={1}
                  max={50}
                  data={list.map((row) => ({
                    label: `${row.bucket} (teto ${formatPercent(row.limitPct, 0)})`,
                    value: row.sharePct,
                    tone:
                      row.status === 'estouro'
                        ? 'danger'
                        : row.status === 'alerta'
                          ? 'warning'
                          : 'success',
                  }))}
                />
              </Card>

              <Card>
                <CardHeader eyebrow="limites" title="Limites vigentes e folga" />
                <DataTable
                  caption="Limites de concentração e situação atual"
                  columns={columns}
                  rows={list}
                  rowKey={(row) => `${row.dimension}-${row.bucket}`}
                />
              </Card>

              <Card>
                <CardHeader
                  eyebrow="alertas"
                  title="Alertas de concentração"
                  description="Gerados na apuração diária das 6h."
                />
                <ul className="grid gap-3">
                  {data.alerts.map((alert) => (
                    <li
                      key={alert.alertId}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-eqx-border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge tone={alert.severity === 'alta' ? 'danger' : 'warning'}>
                            {alert.severity}
                          </Badge>
                          <code className="text-xs text-eqx-text-muted">{alert.alertId}</code>
                        </div>
                        <p className="text-sm font-semibold">{alert.bucket}</p>
                        <p className="text-xs text-eqx-text-muted">
                          {formatPercent(alert.sharePct)} contra teto de{' '}
                          {formatPercent(alert.limitPct, 0)} · detectado em{' '}
                          {formatDateTime(alert.detectedAt)}
                        </p>
                        {alert.note ? (
                          <p className="mt-1 text-sm text-eqx-success">{alert.note}</p>
                        ) : null}
                      </div>
                      {!alert.note ? (
                        <Button size="sm" variant="secondary" onClick={() => treat(alert)}>
                          Registrar tratativa
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        }}
      </QueryBoundary>

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Ajustar limite · ${editing?.bucket ?? ''}`}
        description="POST /api/v1/portfolio/limits"
        footer={
          <Button
            onClick={() => {
              if (!editing) return;
              const value = Number(newLimit);
              if (Number.isNaN(value) || value <= 0) {
                toast.error('Limite inválido', 'Informe um percentual maior que zero');
                return;
              }
              if (note.trim().length < 10) {
                toast.error('Justificativa obrigatória', 'Descreva a decisão em pelo menos 10 caracteres');
                return;
              }
              setLimits(
                rows.map((row) =>
                  row.dimension === editing.dimension && row.bucket === editing.bucket
                    ? {
                        ...row,
                        limitPct: value,
                        status:
                          row.sharePct > value
                            ? 'estouro'
                            : value - row.sharePct <= 3
                              ? 'alerta'
                              : 'ok',
                      }
                    : row,
                ),
              );
              toast.success('Limite atualizado', `${editing.bucket} passa a ter teto de ${value}%`);
              setEditing(null);
            }}
          >
            Salvar limite
          </Button>
        }
      >
        {editing ? (
          <div className="grid gap-4">
            <TextField
              label="Novo limite (%)"
              required
              value={newLimit}
              onChange={(event) => setNewLimit(event.target.value)}
              hint={`Participação atual: ${formatPercent(editing.sharePct)}`}
            />
            <TextAreaField
              label="Justificativa da alteração"
              required
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              hint="Registrada na trilha de auditoria com autor e horário."
            />
            <Notice tone="warning" title="Alteração sensível">
              Mudanças de limite afetam a política de aprovação e o cálculo de capital. Exigem
              ratificação na próxima reunião do comitê de risco.
            </Notice>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
