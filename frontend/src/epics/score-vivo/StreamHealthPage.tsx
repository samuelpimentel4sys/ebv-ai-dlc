import { useState } from 'react';
import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  KeyValueList,
  LineChart,
  Metric,
  Notice,
  QueryBoundary,
  Tabs,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import { streamHealth, type QuarantineEvent, type TopicHealth } from '@/epics/score-vivo/data';
import { fetchStreamHealthLive } from '@/api/scorePlatform';

const statusTone = {
  healthy: 'success',
  warning: 'warning',
  critical: 'danger',
} as const;

const statusLabel = {
  healthy: 'saudável',
  warning: 'atenção',
  critical: 'crítico',
} as const;

export function StreamHealthPage() {
  const toast = useToast();
  const [event, setEvent] = useState<QuarantineEvent | null>(null);
  const query = useDataQuery(streamHealth, fetchStreamHealthLive, {
    latency: 380,
    refetchInterval: 15_000,
  });

  const topicColumns: Column<TopicHealth>[] = [
    {
      key: 'topic',
      header: 'Tópico',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold">{row.topic}</p>
          <p className="text-xs text-eqx-text-muted">
            grupo {row.consumerGroup} · schema {row.schemaVersion}
          </p>
        </div>
      ),
    },
    {
      key: 'partitions',
      header: 'Part.',
      align: 'right',
      numeric: true,
      render: (row) => row.partitions,
    },
    {
      key: 'lagMessages',
      header: 'Lag (msg)',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.lagMessages),
    },
    {
      key: 'lagSeconds',
      header: 'Lag (s)',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.lagSeconds > 30 ? 'font-bold text-eqx-danger' : undefined}>
          {formatNumber(row.lagSeconds)}
        </span>
      ),
    },
    {
      key: 'throughputPerMin',
      header: 'msg/min',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.throughputPerMin),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>,
    },
  ];

  const quarantineColumns: Column<QuarantineEvent>[] = [
    {
      key: 'eventId',
      header: 'Evento',
      render: (row) => <code className="text-xs">{row.eventId}</code>,
      width: '10rem',
    },
    { key: 'reason', header: 'Motivo da quarentena', render: (row) => row.reason },
    {
      key: 'occurredAt',
      header: 'Ocorrido em',
      render: (row) => formatDateTime(row.occurredAt),
      width: '11rem',
    },
    {
      key: 'retries',
      header: 'Retentativas',
      align: 'right',
      numeric: true,
      render: (row) => row.retries,
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F01-US-FE-01"
      title="Console de tópicos e lag do barramento"
      description="Acompanhe throughput, lag por consumer group e a fila de quarentena do barramento de eventos de crédito. Atualização automática a cada 15 segundos."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /plataforma/eventos/saude
        </Badge>,
      ]}
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => {
            query.reload();
            toast.info('Saúde do barramento atualizada');
          }}
        >
          Atualizar
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum tópico publicando no barramento.',
          description:
            'Os consumer groups não reportaram métricas nesta janela. Verifique se os conectores de origem estão ativos antes de investigar lag.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            {data.topics.some((topic) => topic.lagSeconds > data.lagThresholdSeconds) ? (
              <Notice
                tone="danger"
                title="Lag acima do limite de 30 s"
                actions={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toast.warning('Escalado para o plantão de plataforma')}
                  >
                    Escalar plantão
                  </Button>
                }
              >
                O tópico <code>credit.events.negative.v3</code> acumula 47 s de atraso — recálculos
                de score de negativação podem estar defasados.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={formatNumber(
                  data.topics.reduce((sum, topic) => sum + topic.throughputPerMin, 0),
                )}
                label="Mensagens por minuto"
                hint="soma de todos os tópicos"
                icon={<Activity size={18} aria-hidden="true" />}
              />
              <Metric
                value={formatNumber(data.topics.reduce((sum, topic) => sum + topic.lagMessages, 0))}
                label="Lag acumulado (msg)"
                tone="warning"
              />
              <Metric
                value={data.quarantine.length}
                label="Eventos em quarentena"
                tone="danger"
                icon={<ShieldAlert size={18} aria-hidden="true" />}
              />
              <Metric
                value={`${data.topics.filter((topic) => topic.status === 'healthy').length}/${
                  data.topics.length
                }`}
                label="Tópicos saudáveis"
                tone="success"
                hint={`atualizado ${formatDateTime(data.updatedAt)}`}
              />
            </div>

            <Card>
              <CardHeader
                eyebrow="throughput"
                title="Volume agregado (mil msg/min)"
                description="Janela dos últimos 45 minutos, amostrada a cada 5 minutos."
              />
              <LineChart
                ariaLabel="Volume agregado de mensagens por minuto nos últimos 45 minutos"
                points={data.throughputSeries}
                unit=" mil"
              />
            </Card>

            <Tabs
              items={[
                {
                  id: 'topics',
                  label: `Tópicos (${data.topics.length})`,
                  content: (
                    <DataTable
                      caption="Tópicos do barramento com lag por consumer group"
                      columns={topicColumns}
                      rows={data.topics}
                      rowKey={(row) => row.topic}
                    />
                  ),
                },
                {
                  id: 'quarantine',
                  label: `Quarentena (${data.quarantine.length})`,
                  badge: <Badge tone="danger">{data.quarantine.length}</Badge>,
                  content: (
                    <DataTable
                      caption="Eventos em quarentena aguardando tratativa"
                      columns={quarantineColumns}
                      rows={data.quarantine}
                      rowKey={(row) => row.eventId}
                      onRowClick={setEvent}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(event)}
        onClose={() => setEvent(null)}
        title={`Evento ${event?.eventId ?? ''}`}
        description="GET /api/v1/events/{eventId}"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEvent(null)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                toast.success('Reprocessamento solicitado', 'POST /api/v1/events/credit');
                setEvent(null);
              }}
            >
              Reprocessar evento
            </Button>
          </div>
        }
      >
        {event ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Tópico', value: <code className="text-xs">{event.topic}</code> },
                { label: 'Ocorrido em', value: formatDateTime(event.occurredAt) },
                { label: 'Retentativas', value: event.retries },
                { label: 'Payload', value: `${formatNumber(event.payloadSize)} bytes` },
              ]}
            />
            <div>
              <h3 className="mb-2 text-base">Motivo</h3>
              <Notice tone="warning">{event.reason}</Notice>
            </div>
            <div>
              <h3 className="mb-2 text-base">Payload recebido</h3>
              <pre>{`{
  "eventId": "${event.eventId}",
  "topic": "${event.topic}",
  "occurredAt": "${event.occurredAt}",
  "payload": { "documento": "1234567890", "amountCents": null }
}`}</pre>
            </div>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
