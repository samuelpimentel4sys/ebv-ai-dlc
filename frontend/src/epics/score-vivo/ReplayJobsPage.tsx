import { useState } from 'react';
import { CirclePlay, OctagonX } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ColumnChart,
  DataTable,
  Drawer,
  KeyValueList,
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
import { formatDateTime, formatNumber } from '@/lib/format';
import { divergenceHistogram, replayJobs, type ReplayJob } from '@/epics/score-vivo/data';
import { abortReplayJobLive, createReplayJobLive } from '@/api/ep01';

const statusTone = {
  executando: 'info',
  concluido: 'success',
  abortado: 'warning',
  falha: 'danger',
} as const;

export function ReplayJobsPage() {
  const toast = useToast();
  const query = useDataQuery(
    () => replayJobs,
    async () => [],
    { latency: 360 },
  );
  const [jobs, setJobs] = useState<ReplayJob[] | null>(null);
  const [detail, setDetail] = useState<ReplayJob | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [abortTarget, setAbortTarget] = useState<ReplayJob | null>(null);
  const [from, setFrom] = useState('2026-07-01T00:00');
  const [to, setTo] = useState('2026-07-27T00:00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rows = jobs ?? query.data ?? [];
  const running = rows.filter((job) => job.status === 'executando');

  function openCreate() {
    setErrors({});
    setCreateOpen(true);
  }

  function createJob() {
    const next: Record<string, string> = {};
    if (!from) next.from = 'Informe o início da janela histórica a reprocessar.';
    if (!to) next.to = 'Informe o fim da janela histórica a reprocessar.';
    if (from && to && new Date(to).getTime() <= new Date(from).getTime()) {
      next.to = 'O fim da janela precisa ser posterior ao início. Ajuste a data de fim.';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      document.querySelector<HTMLElement>(`[name="job-${next.from ? 'from' : 'to'}"]`)?.focus();
      return;
    }
    void (async () => {
      try {
        let job: ReplayJob;
        if (isLiveMode()) {
          job = await createReplayJobLive(from, to);
        } else {
          job = {
            jobId: `rpl-${new Date().toISOString().slice(0, 10)}-99`,
            window: `${from.slice(0, 10)} → ${to.slice(0, 10)}`,
            status: 'executando',
            progressPct: 2,
            eventsProcessed: 320_000,
            eventsTotal: 24_000_000,
            divergences: 0,
            startedAt: new Date().toISOString(),
            requestedBy: 'você',
          };
        }
        setJobs([job, ...rows]);
        setCreateOpen(false);
        toast.success('Job de replay criado', 'POST /api/v1/replay/jobs');
      } catch (error) {
        toast.error('Falha ao criar job', errorMessage(error));
      }
    })();
  }

  const columns: Column<ReplayJob>[] = [
    {
      key: 'jobId',
      header: 'Job',
      render: (row) => (
        <div>
          <code className="text-xs font-semibold">{row.jobId}</code>
          <p className="text-xs text-eqx-text-muted">{row.window}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'progress',
      header: 'Progresso',
      render: (row) => (
        <ProgressBar
          label={`${row.progressPct}%`}
          value={row.progressPct}
          tone={row.status === 'falha' ? 'danger' : row.status === 'concluido' ? 'success' : 'action'}
        />
      ),
      width: '14rem',
    },
    {
      key: 'events',
      header: 'Eventos',
      align: 'right',
      numeric: true,
      render: (row) =>
        `${formatNumber(row.eventsProcessed / 1_000_000, 1)}/${formatNumber(
          row.eventsTotal / 1_000_000,
          1,
        )} mi`,
    },
    {
      key: 'divergences',
      header: 'Divergências',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.divergences > 500 ? 'font-bold text-eqx-danger' : undefined}>
          {formatNumber(row.divergences)}
        </span>
      ),
    },
    { key: 'requestedBy', header: 'Solicitado por', render: (row) => row.requestedBy },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) =>
        row.status === 'executando' ? (
          <Button size="sm" variant="ghost" onClick={() => setAbortTarget(row)}>
            Abortar
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>
            Detalhes
          </Button>
        ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F10-US-FE-01"
      title="Console de replay de eventos"
      description="Acompanhe a reexecução de janelas históricas do barramento, o progresso por job, o histograma de divergências entre score original e recalculado, e aborte execuções em curso."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /dados/replay/jobs
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          icon={<CirclePlay size={16} aria-hidden="true" />}
          onClick={openCreate}
        >
          Novo replay
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhum job de replay nesta janela.',
          description:
            'Crie um replay para reprocessar eventos históricos do barramento e comparar o score recalculado com o score original de cada decisão.',
          action: (
            <Button
              variant="secondary"
              icon={<CirclePlay size={16} aria-hidden="true" />}
              onClick={openCreate}
            >
              Novo replay
            </Button>
          ),
        }}
      >
        {() => (
          <div className="grid gap-5">
            {running.length ? (
              <Notice tone="info" title={`${running.length} job em execução`}>
                <code>{running[0].jobId}</code> está em {running[0].progressPct}% com{' '}
                {formatNumber(running[0].divergences)} divergências detectadas até agora.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={rows.length} label="Jobs na janela" />
              <Metric value={running.length} label="Em execução" tone="action" />
              <Metric
                value={formatNumber(rows.reduce((sum, job) => sum + job.divergences, 0))}
                label="Divergências totais"
                tone="warning"
              />
              <Metric
                value={formatNumber(
                  rows.reduce((sum, job) => sum + job.eventsProcessed, 0) / 1_000_000,
                  1,
                )}
                label="Eventos reprocessados (mi)"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader
                  eyebrow="jobs"
                  title="Execuções de replay"
                  description="GET /api/v1/replay/jobs/{jobId}"
                />
                <DataTable
                  caption="Jobs de replay de eventos"
                  columns={columns}
                  rows={rows}
                  rowKey={(row) => row.jobId}
                />
              </Card>
              <Card>
                <CardHeader
                  eyebrow="qualidade"
                  title="Histograma de divergências"
                  description="Diferença absoluta de pontos entre score original e recalculado."
                />
                <ColumnChart
                  ariaLabel="Distribuição das divergências de score por faixa de pontos"
                  data={divergenceHistogram.map((item) => ({
                    ...item,
                    tone:
                      item.label === '> 50'
                        ? 'danger'
                        : item.label === '26–50'
                          ? 'warning'
                          : 'action',
                  }))}
                />
                <Notice tone="success" className="mt-4" title="Tolerância respeitada">
                  87% das divergências ficam abaixo de 10 pontos, dentro da tolerância acordada com
                  risco de crédito.
                </Notice>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo job de replay"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createJob}>Criar job</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Início da janela"
              name="job-from"
              type="datetime-local"
              value={from}
              error={errors.from}
              onChange={(event) => {
                setFrom(event.target.value);
                setErrors({});
              }}
            />
            <TextField
              label="Fim da janela"
              name="job-to"
              type="datetime-local"
              value={to}
              error={errors.to}
              onChange={(event) => {
                setTo(event.target.value);
                setErrors({});
              }}
            />
          </div>
          <Notice tone="warning" title="Consumo de recursos">
            O replay roda em pool dedicado, mas compete por conexões da feature store. Janelas
            superiores a 30 dias devem ser agendadas fora do horário comercial.
          </Notice>
        </div>
      </Modal>

      <Modal
        open={Boolean(abortTarget)}
        onClose={() => setAbortTarget(null)}
        title={`Abortar ${abortTarget?.jobId ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAbortTarget(null)}>
              Manter execução
            </Button>
            <Button
              variant="danger"
              icon={<OctagonX size={16} aria-hidden="true" />}
              onClick={() => {
                if (!abortTarget) return;
                void (async () => {
                  try {
                    if (isLiveMode()) {
                      await abortReplayJobLive(abortTarget.jobId);
                    }
                    setJobs(
                      rows.map((job) =>
                        job.jobId === abortTarget.jobId ? { ...job, status: 'abortado' } : job,
                      ),
                    );
                    toast.warning(
                      'Job abortado',
                      `POST /api/v1/replay/jobs/${abortTarget.jobId}/abort`,
                    );
                    setAbortTarget(null);
                  } catch (error) {
                    toast.error('Falha ao abortar', errorMessage(error));
                  }
                })();
              }}
            >
              Abortar job
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Eventos já reprocessados permanecem íntegros. O job pode ser recriado a partir do offset de
          parada informado no detalhe da execução.
        </p>
      </Modal>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Job ${detail?.jobId ?? ''}`}
        description="Detalhe da execução de replay"
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Janela', value: detail.window },
                { label: 'Status', value: detail.status },
                { label: 'Início', value: formatDateTime(detail.startedAt) },
                { label: 'Solicitante', value: detail.requestedBy },
                { label: 'Eventos processados', value: formatNumber(detail.eventsProcessed) },
                { label: 'Divergências', value: formatNumber(detail.divergences) },
              ]}
            />
            <ProgressBar label="Progresso" value={detail.progressPct} />
            <pre>{JSON.stringify(detail, null, 2)}</pre>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
