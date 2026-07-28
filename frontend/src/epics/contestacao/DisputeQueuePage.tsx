import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Paperclip, Timer } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
  TextAreaField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';
import { formatDateTime, relativeFromNow } from '@/lib/format';
import {
  disputeOutcomes,
  disputeQueue,
  stageLabel,
  type DisputeQueueItem,
} from '@/epics/contestacao/data';

const priorityTone = {
  critica: 'danger',
  alta: 'warning',
  media: 'neutral',
} as const;

const channelOptions = [
  { value: 'todos', label: 'Todos os canais' },
  { value: 'portal', label: 'Portal do titular' },
  { value: 'sac', label: 'SAC' },
  { value: 'b2b', label: 'API B2B' },
  { value: 'procon', label: 'Procon' },
];

export function DisputeQueuePage() {
  const toast = useToast();
  const [channel, setChannel] = useState('todos');
  const [resolved, setResolved] = useState<string[]>([]);
  const [treating, setTreating] = useState<DisputeQueueItem | null>(null);
  const [outcome, setOutcome] = useState('procedente');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusNonce, setFocusNonce] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const query = useMockQuery(
    () =>
      disputeQueue.filter(
        (row) => !resolved.includes(row.id) && (channel === 'todos' || row.channel === channel),
      ),
    {
      latency: 350,
      deps: [channel, resolved],
      isEmpty: (rows) => rows.length === 0,
    },
  );

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(drawerRef.current);
  }, [focusNonce]);

  const columns: Column<DisputeQueueItem>[] = [
    {
      key: 'protocol',
      header: 'Protocolo',
      render: (row) => (
        <div className="min-w-0">
          <code className="text-xs font-semibold">{row.protocol}</code>
          <p className="text-xs text-eqx-text-muted">{row.documento}</p>
        </div>
      ),
    },
    { key: 'subject', header: 'Objeto', render: (row) => row.subject },
    {
      key: 'priority',
      header: 'Prioridade',
      align: 'center',
      render: (row) => <Badge tone={priorityTone[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: 'channel',
      header: 'Canal',
      align: 'center',
      render: (row) => row.channel,
    },
    {
      key: 'stage',
      header: 'Etapa',
      render: (row) => <Badge tone="info">{stageLabel[row.stage]}</Badge>,
    },
    {
      key: 'slaDueAt',
      header: 'SLA',
      render: (row) => {
        const late = new Date(row.slaDueAt).getTime() < Date.now();
        return (
          <span className={late ? 'font-semibold text-eqx-danger' : undefined}>
            {relativeFromNow(row.slaDueAt)}
          </span>
        );
      },
    },
    {
      key: 'evidences',
      header: 'Anexos',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Paperclip size={12} aria-hidden="true" />
          {row.evidences}
        </span>
      ),
    },
    {
      key: 'assignee',
      header: 'Responsável',
      render: (row) => row.assignee ?? <Badge tone="warning">sem atribuição</Badge>,
    },
  ];

  function resolve() {
    if (!treating) return;
    if (note.trim().length < 20) {
      setErrors({
        note: 'Descreva a análise em pelo menos 20 caracteres: o texto vai para o titular e para a auditoria.',
      });
      setFocusNonce((value) => value + 1);
      return;
    }
    const closed = treating;
    setResolved((current) => [...current, closed.id]);
    setErrors({});
    setTreating(null);
    setNote('');
    toast.undoable(
      'Contestação concluída',
      `PATCH /api/v1/disputes/${closed.id}/resolve — ${outcome}`,
      () => setResolved((current) => current.filter((id) => id !== closed.id)),
      'Reabrir caso',
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F02-US-FE-01"
      title="Tratativa de contestações"
      description="Fila operacional ordenada por risco de SLA e canal de entrada, com painel de tratativa contendo objeto da contestação, anexos do titular e formulário de desfecho com fundamentação obrigatória."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /disputas/fila
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader
            eyebrow="filtro"
            title="Canal de entrada"
            description="GET /api/v1/disputes/queue"
          />
          <div className="max-w-xs">
            <SelectField
              label="Canal"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              options={channelOptions}
            />
          </div>
        </Card>

        <QueryBoundary
          query={query}
          loadingRows={6}
          empty={{
            title: 'Nenhuma contestação aguarda tratativa.',
            description:
              'A fila está zerada: todos os casos abertos já foram concluídos ou estão com o titular. Ela volta a preencher automaticamente quando entrar um novo caso pelo portal, SAC, API ou Procon.',
          }}
          noResults={{
            active: channel !== 'todos',
            description: `Nenhum caso do canal ${
              channelOptions.find((option) => option.value === channel)?.label ?? channel
            } está na fila agora. Volte para todos os canais para ver a fila completa.`,
            onClear: () => setChannel('todos'),
          }}
        >
          {(rows) => (
            <div className="grid gap-5">
              {rows.some(
                (row) => new Date(row.slaDueAt).getTime() - Date.now() < 12 * 3_600_000,
              ) ? (
                <Notice tone="danger" title="Casos com menos de 12 horas de prazo">
                  Priorize os itens marcados como críticos: canais Procon têm SLA de 48 horas e
                  geram escalonamento automático.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={rows.length} label="Casos na fila" />
                <Metric
                  value={rows.filter((row) => row.priority === 'critica').length}
                  label="Prioridade crítica"
                  tone="danger"
                  icon={<Timer size={18} aria-hidden="true" />}
                />
                <Metric
                  value={rows.filter((row) => !row.assignee).length}
                  label="Sem responsável"
                  tone="warning"
                />
                <Metric
                  value={rows.filter((row) => row.stage === 'aguardando_titular').length}
                  label="Aguardando titular"
                  hint="prazo suspenso até resposta"
                />
              </div>

              <DataTable
                caption="Fila operacional de contestações"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                onRowClick={(row) => {
                  setTreating(row);
                  setErrors({});
                }}
                footer={`${rows.length} caso(s) na fila · ${resolved.length} concluído(s) nesta sessão`}
              />
            </div>
          )}
        </QueryBoundary>
      </div>

      <Drawer
        open={Boolean(treating)}
        onClose={() => setTreating(null)}
        title={treating?.protocol ?? ''}
        description="Tratativa da contestação"
        footer={<Button onClick={resolve}>Concluir contestação</Button>}
      >
        {treating ? (
          <div className="grid gap-5" ref={drawerRef}>
            <KeyValueList
              items={[
                { label: 'Titular', value: treating.documento },
                { label: 'Canal', value: treating.channel },
                { label: 'Etapa', value: stageLabel[treating.stage] },
                { label: 'Prioridade', value: treating.priority },
                {
                  label: 'Aberto em',
                  value: formatDateTime(treating.openedAt),
                },
                { label: 'Prazo', value: formatDateTime(treating.slaDueAt) },
              ]}
            />
            <Notice tone="info" title="Objeto da contestação">
              {treating.subject}
            </Notice>
            <section>
              <h3 className="mb-2 text-base">Anexos do caso</h3>
              {treating.evidences > 0 ? (
                <ul className="grid gap-2 text-sm">
                  {Array.from({ length: treating.evidences }).map((_, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 rounded-md border border-eqx-border px-3 py-2"
                    >
                      <Paperclip size={14} aria-hidden="true" />
                      anexo {index + 1} · verificado por antivírus
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-eqx-text-muted">
                  Nenhum anexo enviado. Solicite documentação antes de decidir.
                </p>
              )}
              <div className="mt-3">
                <Link
                  to={`/disputas/${treating.protocol}/evidencias`}
                  className={buttonClass('secondary', 'sm')}
                >
                  Abrir cofre de evidências
                </Link>
              </div>
            </section>
            <SelectField
              label="Desfecho"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              options={disputeOutcomes}
            />
            <TextAreaField
              label="Fundamentação da decisão"
              required
              value={note}
              error={errors.note}
              onChange={(event) => {
                setNote(event.target.value);
                setErrors({});
              }}
              rows={4}
              hint="Texto enviado ao titular e registrado na trilha de auditoria."
            />
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
