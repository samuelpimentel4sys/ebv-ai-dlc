import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Gauge,
  LineChart,
  Metric,
  Notice,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, formatNumber, formatSigned, maskDocument } from '@/lib/format';
import {
  scoreCurrent,
  scoreHistory,
  SCORE_BAND_REFERENCE,
  type ScoreHistoryPoint,
} from '@/epics/score-vivo/data';
import { fetchScoreTimelineLive, recalculateScoreLive } from '@/api/scorePlatform';

export function ScoreTimelinePage() {
  const params = useParams();
  const documento = params.documento ?? '12345678901';
  const toast = useToast();
  const [recalculating, setRecalculating] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ScoreHistoryPoint | null>(null);

  const query = useDataQuery(
    () => ({ current: scoreCurrent(documento), history: scoreHistory() }),
    () => fetchScoreTimelineLive(documento),
    { latency: 420, deps: [documento] },
  );

  const columns: Column<ScoreHistoryPoint>[] = [
    {
      key: 'observedAt',
      header: 'Observado em',
      render: (row) => formatDateTime(row.observedAt),
      width: '11rem',
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      numeric: true,
      render: (row) => <span className="font-semibold">{row.score}</span>,
    },
    {
      key: 'delta',
      header: 'Δ',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.delta > 0 ? 'text-eqx-success' : row.delta < 0 ? 'text-eqx-danger' : undefined
          }
        >
          {formatSigned(row.delta)}
        </span>
      ),
    },
    {
      key: 'modelVersion',
      header: 'Versão do modelo',
      render: (row) => <code className="text-xs">{row.modelVersion}</code>,
    },
    {
      key: 'triggerEvent',
      header: 'Evento disparador',
      render: (row) =>
        row.triggerEvent ? (
          <span className="text-sm">{row.triggerEvent}</span>
        ) : (
          <span className="text-sm text-eqx-text-muted">recálculo periódico</span>
        ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F03-US-FE-01"
      title="Histórico de score do titular"
      description="Série temporal do score com marcadores de eventos que dispararam recálculo, versão de modelo vigente em cada ponto e ação de recálculo sob demanda."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="doc" tone="neutral" className="font-mono">
          {maskDocument(documento)}
        </Badge>,
      ]}
      actions={
        <Button
          variant="secondary"
          size="sm"
          loading={recalculating}
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => {
            setRecalculating(true);
            void (async () => {
              try {
                if (isLiveMode()) {
                  await recalculateScoreLive(documento);
                } else {
                  await new Promise((resolve) => window.setTimeout(resolve, 900));
                }
                query.reload();
                toast.success('Recálculo enfileirado', 'POST /api/v1/score/recalculate');
              } catch (error) {
                toast.error('Falha no recálculo', errorMessage(error));
              } finally {
                setRecalculating(false);
              }
            })();
          }}
        >
          Recalcular agora
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Este titular ainda não tem histórico de score.',
          description:
            'Nenhum snapshot foi gerado para o documento consultado. Use “Recalcular agora” para produzir o primeiro ponto da série.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Card>
                <CardHeader
                  eyebrow="série temporal"
                  title="Evolução do score nos últimos 6 meses"
                  description="Pontos em laranja indicam recálculo disparado por evento de crédito. Use Tab e Enter para inspecionar."
                />
                <LineChart
                  ariaLabel="Evolução do score do titular nos últimos seis meses"
                  points={data.history.map((point) => ({
                    label: formatDateTime(point.observedAt).slice(0, 5),
                    value: point.score,
                    highlight: Boolean(point.triggerEvent),
                    meta: point.triggerEvent,
                  }))}
                  band={SCORE_BAND_REFERENCE}
                  onSelect={(_, index) => setSelectedPoint(data.history[index])}
                />
                {selectedPoint ? (
                  <Notice tone="info" title={`Ponto de ${formatDateTime(selectedPoint.observedAt)}`}>
                    Score {selectedPoint.score} ({formatSigned(selectedPoint.delta)}) com modelo{' '}
                    <code>{selectedPoint.modelVersion}</code>.{' '}
                    {selectedPoint.triggerEvent ?? 'Recálculo periódico sem evento associado.'}
                  </Notice>
                ) : null}
              </Card>

              <div className="grid content-start gap-4">
                <Card accent="action">
                  <Gauge
                    value={data.current.score}
                    min={0}
                    max={1000}
                    label={`Score atual · ${data.current.band}`}
                    bands={[
                      { upTo: 300, color: 'rgb(var(--color-danger))', label: 'E — risco alto' },
                      { upTo: 500, color: 'rgb(var(--color-accent))', label: 'D — risco elevado' },
                      { upTo: 700, color: 'rgb(var(--color-warning))', label: 'C — risco médio' },
                      { upTo: 850, color: 'rgb(var(--color-success))', label: 'B — risco baixo' },
                      { upTo: 1000, color: 'rgb(var(--eqx-green-600))', label: 'A — risco mínimo' },
                    ]}
                  />
                </Card>
                <Metric
                  value={`${formatNumber(data.current.pd12m, 1)}%`}
                  label="PD 12 meses"
                  hint={`modelo ${data.current.modelVersion}`}
                  tone="action"
                  icon={<TrendingUp size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatSigned(data.current.score - data.history[0].score)}
                  label="Variação no período"
                  tone={data.current.score - data.history[0].score >= 0 ? 'success' : 'danger'}
                  hint={`de ${data.history[0].score} para ${data.current.score}`}
                />
                <Metric
                  value={data.history.filter((point) => point.triggerEvent).length}
                  label="Recálculos por evento"
                  hint="snapshots imutáveis gerados"
                />
              </div>
            </div>

            <Card>
              <CardHeader
                eyebrow="auditoria"
                title="Pontos da série"
                description="GET /api/v1/score/{documento}/history — cada linha corresponde a um snapshot versionado."
              />
              <DataTable
                caption="Histórico de score do titular"
                columns={columns}
                rows={[...data.history].reverse()}
                rowKey={(row) => row.observedAt}
                onRowClick={setSelectedPoint}
                isRowActive={(row) => row.observedAt === selectedPoint?.observedAt}
              />
            </Card>
          </div>
        )}
      </QueryBoundary>
    </ScreenLayout>
  );
}
