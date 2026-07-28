import { useState } from 'react';
import { PlugZap, RotateCcw } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ColumnChart,
  DataTable,
  Metric,
  Modal,
  Notice,
  ProgressBar,
  QueryBoundary,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { ingestSources, type IngestSource } from '@/epics/score-vivo/data';
import { fetchIngestSourcesLive, replayIngestLive } from '@/api/ep01';

const statusTone = {
  online: 'success',
  degradado: 'warning',
  offline: 'danger',
} as const;

export function ConnectorsPage() {
  const toast = useToast();
  const [replayTarget, setReplayTarget] = useState<IngestSource | null>(null);
  const [from, setFrom] = useState('2026-07-26T00:00');
  const [to, setTo] = useState('2026-07-27T00:00');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const query = useDataQuery(() => ingestSources, fetchIngestSourcesLive, { latency: 360 });

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function openReplay(source: IngestSource) {
    setErrors({});
    setReplayTarget(source);
  }

  function submitReplay() {
    const next: Record<string, string> = {};
    if (!from) next.from = 'Informe a data e a hora de início da janela a reprocessar.';
    if (!to) next.to = 'Informe a data e a hora de fim da janela a reprocessar.';
    if (from && to && new Date(to).getTime() <= new Date(from).getTime()) {
      next.to = 'O fim da janela precisa ser posterior ao início. Ajuste a data de fim.';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      document.querySelector<HTMLElement>(`[name="replay-${next.from ? 'from' : 'to'}"]`)?.focus();
      return;
    }
    void (async () => {
      try {
        if (isLiveMode() && replayTarget) {
          await replayIngestLive(
            replayTarget.id,
            from,
            to,
            'Replay solicitado via console Sofia',
          );
        }
        toast.success('Replay agendado', `POST /api/v1/ingest/replay · ${from} → ${to}`);
        setReplayTarget(null);
      } catch (error) {
        toast.error('Falha no replay de ingestão', errorMessage(error));
      }
    })();
  }

  const columns: Column<IngestSource>[] = [
    {
      key: 'name',
      header: 'Conector',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-eqx-text-muted">
            <code>{row.id}</code> · {row.owner}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      align: 'center',
      render: (row) => <Badge tone="neutral">{row.type}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'recordsToday',
      header: 'Registros hoje',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.recordsToday),
    },
    {
      key: 'errorRatePct',
      header: 'Erros',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.errorRatePct > 5
              ? 'font-bold text-eqx-danger'
              : row.errorRatePct > 1
                ? 'text-eqx-warning'
                : undefined
          }
        >
          {formatPercent(row.errorRatePct, 2)}
        </span>
      ),
    },
    {
      key: 'lastSyncAt',
      header: 'Última sincronização',
      render: (row) => formatDateTime(row.lastSyncAt),
      width: '11rem',
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw size={14} aria-hidden="true" />}
          onClick={() => openReplay(row)}
        >
          Replay
        </Button>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F06-US-FE-01"
      title="Monitor de conectores de origem"
      description="Situação de cada fonte de dados que alimenta a plataforma: volume do dia, taxa de erro, aderência ao SLA de atualização e disparo de replay por janela."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /dados/ingestao/conectores
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum conector cadastrado ainda.',
          description:
            'Cadastre a primeira origem de dados para o barramento começar a receber eventos de crédito e alimentar os atributos da feature store.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            {data.some((source) => source.status === 'offline') ? (
              <Notice tone="danger" title="Conector offline há mais de 24 h">
                <strong>Concessionárias · contas de consumo</strong> não sincroniza desde 26/07
                04:58. Atributos thin-file derivados dessa fonte estão com frescor degradado.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={data.length}
                label="Conectores monitorados"
                icon={<PlugZap size={18} aria-hidden="true" />}
              />
              <Metric
                value={formatNumber(
                  data.reduce((sum, source) => sum + source.recordsToday, 0) / 1_000_000,
                  1,
                )}
                label="Registros hoje (milhões)"
                tone="action"
              />
              <Metric
                value={data.filter((source) => source.status === 'online').length}
                label="Fontes online"
                tone="success"
              />
              <Metric
                value={data.filter((source) => source.status !== 'online').length}
                label="Fontes com problema"
                tone="danger"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card>
                <CardHeader
                  eyebrow="fontes"
                  title="Conectores e estado atual"
                  description="GET /api/v1/ingest/sources"
                />
                <DataTable
                  caption="Conectores de origem monitorados"
                  columns={columns}
                  rows={data}
                  rowKey={(row) => row.id}
                />
              </Card>
              <div className="grid content-start gap-4">
                <Card>
                  <CardHeader eyebrow="volume" title="Registros por fonte (milhões)" />
                  <ColumnChart
                    ariaLabel="Volume de registros por conector em milhões"
                    digits={2}
                    data={data.map((source) => ({
                      label: source.id.replace('src-', ''),
                      value: source.recordsToday / 1_000_000,
                      tone: source.status === 'online' ? 'action' : 'danger',
                    }))}
                  />
                </Card>
                <Card>
                  <CardHeader eyebrow="SLA" title="Aderência ao SLA de atualização" />
                  <div className="grid gap-3">
                    {data.map((source) => {
                      const elapsed = Math.round(
                        (Date.now() - new Date(source.lastSyncAt).getTime()) / 60_000,
                      );
                      const pct = Math.min((elapsed / source.slaMinutes) * 100, 100);
                      return (
                        <ProgressBar
                          key={source.id}
                          label={`${source.id.replace('src-', '')} · ${source.slaMinutes} min`}
                          value={pct}
                          tone={pct > 90 ? 'danger' : pct > 60 ? 'warning' : 'success'}
                        />
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={Boolean(replayTarget)}
        onClose={() => setReplayTarget(null)}
        title={`Replay · ${replayTarget?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplayTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={submitReplay}>Disparar replay</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm">
            Reprocessa os eventos da fonte <code>{replayTarget?.id}</code> na janela indicada. A
            operação é idempotente e não gera duplicidade de snapshots.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Início da janela"
              name="replay-from"
              type="datetime-local"
              value={from}
              error={errors.from}
              onChange={(event) => {
                setFrom(event.target.value);
                clearError('from');
                clearError('to');
              }}
            />
            <TextField
              label="Fim da janela"
              name="replay-to"
              type="datetime-local"
              value={to}
              error={errors.to}
              onChange={(event) => {
                setTo(event.target.value);
                clearError('to');
              }}
            />
          </div>
          <Notice tone="warning" title="Impacto estimado">
            Janelas maiores que 24 h competem por throughput com a ingestão corrente.
          </Notice>
        </div>
      </Modal>
    </ScreenLayout>
  );
}
