import { useMemo, useState } from 'react';
import { BadgeCheck, Inbox, ShieldQuestion } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  EmptyState,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, relativeFromNow } from '@/lib/format';
import { fetchSubjectRequestsLive, patchSubjectRequestLive } from '@/api/explainability';
import { subjectRequests, type SubjectRequest } from '@/epics/explicabilidade/data';

const statusTone = {
  aguardando_identidade: 'warning',
  em_tratativa: 'info',
  concluida: 'success',
  recusada: 'danger',
} as const;

const typeLabel = {
  acesso: 'Acesso aos dados',
  correcao: 'Correção',
  revisao: 'Revisão de decisão',
  portabilidade: 'Portabilidade',
  eliminacao: 'Eliminação',
} as const;

export function SubjectRightsPage() {
  const toast = useToast();
  const query = useDataQuery(() => subjectRequests, fetchSubjectRequestsLive, { latency: 350 });
  const [items, setItems] = useState<SubjectRequest[] | null>(null);
  const [status, setStatus] = useState('todos');
  const [type, setType] = useState('todos');
  const [detail, setDetail] = useState<SubjectRequest | null>(null);

  const all = items ?? query.data ?? [];
  const rows = useMemo(
    () =>
      all.filter(
        (row) =>
          (status === 'todos' || row.status === status) && (type === 'todos' || row.type === type),
      ),
    [all, status, type],
  );

  const filtersActive = status !== 'todos' || type !== 'todos';

  function clearFilters() {
    setStatus('todos');
    setType('todos');
  }

  const columns: Column<SubjectRequest>[] = [
    {
      key: 'requestId',
      header: 'Solicitação',
      render: (row) => <code className="text-xs font-semibold">{row.requestId}</code>,
    },
    { key: 'documento', header: 'Titular', render: (row) => row.documento },
    { key: 'type', header: 'Direito exercido', render: (row) => typeLabel[row.type] },
    { key: 'channel', header: 'Canal', align: 'center', render: (row) => row.channel },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'identityVerified',
      header: 'Identidade',
      align: 'center',
      render: (row) =>
        row.identityVerified ? (
          <Badge tone="success" icon={<BadgeCheck size={12} aria-hidden="true" />}>
            verificada
          </Badge>
        ) : (
          <Badge tone="warning">pendente</Badge>
        ),
    },
    {
      key: 'dueAt',
      header: 'Prazo legal',
      render: (row) => (
        <span
          className={
            new Date(row.dueAt).getTime() < Date.now() && row.status !== 'concluida'
              ? 'font-semibold text-eqx-danger'
              : undefined
          }
        >
          {relativeFromNow(row.dueAt)}
        </span>
      ),
    },
  ];

  function conclude(request: SubjectRequest) {
    const responseSummary = 'Resposta enviada ao titular com o dossiê anexado.';
    void (async () => {
      try {
        if (isLiveMode()) {
          await patchSubjectRequestLive({
            requestId: request.requestId,
            action: 'COMPLETE',
            responseSummary,
          });
          query.reload();
          setItems(null);
        } else {
          setItems(
            all.map((row) =>
              row.requestId === request.requestId
                ? {
                    ...row,
                    status: 'concluida',
                    history: [
                      ...row.history,
                      {
                        at: new Date().toISOString(),
                        actor: 'encarregado.dpo',
                        note: responseSummary,
                      },
                    ],
                  }
                : row,
            ),
          );
        }
        setDetail(null);
        toast.success('Solicitação concluída', `PATCH /api/v1/subject-requests/${request.requestId}`);
      } catch (error) {
        toast.error('Falha ao concluir solicitação', errorMessage(error));
      }
    })();
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F08-US-FE-01"
      title="Central de direitos do titular"
      description="Gestão das solicitações de acesso, correção, revisão, portabilidade e eliminação previstas na LGPD, com verificação de identidade, controle do prazo de 15 dias e histórico completo de tratativas."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/direitos/solicitacoes
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhuma solicitação de titular registrada.',
          description:
            'Pedidos chegam pelo portal, pelo e-mail do encarregado e pela API. Assim que o primeiro entrar, ele aparece aqui com o prazo legal em contagem.',
        }}
        noResults={{ active: filtersActive, onClear: clearFilters }}
      >
        {() => (
          <div className="grid gap-5">
            <Notice tone="info" title="Prazo de resposta">
              Pedidos de acesso e revisão exigem resposta em até 15 dias corridos. Solicitações sem
              identidade verificada não iniciam a contagem de prazo.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={all.filter((row) => row.status !== 'concluida').length}
                label="Solicitações abertas"
                tone="warning"
                icon={<Inbox size={18} aria-hidden="true" />}
              />
              <Metric
                value={all.filter((row) => !row.identityVerified).length}
                label="Aguardando identidade"
                icon={<ShieldQuestion size={18} aria-hidden="true" />}
              />
              <Metric
                value={all.filter((row) => row.type === 'revisao').length}
                label="Pedidos de revisão"
                tone="action"
                hint="encaminhados à revisão humana"
              />
              <Metric
                value={all.filter((row) => row.status === 'concluida').length}
                label="Concluídas no mês"
                tone="success"
              />
            </div>

            <Card>
              <CardHeader
                eyebrow="filtros"
                title="Fila de solicitações"
                description="GET /api/v1/subject-requests"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'aguardando_identidade', label: 'Aguardando identidade' },
                    { value: 'em_tratativa', label: 'Em tratativa' },
                    { value: 'concluida', label: 'Concluída' },
                  ]}
                />
                <SelectField
                  label="Direito exercido"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    ...Object.entries(typeLabel).map(([value, label]) => ({ value, label })),
                  ]}
                />
              </div>
            </Card>

            {rows.length === 0 ? (
              <EmptyState
                title="Nenhuma solicitação atende aos filtros aplicados."
                description={`A fila tem ${all.length} solicitações. Limpe os filtros ou escolha outro status e direito exercido.`}
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <DataTable
                caption="Solicitações de direitos do titular"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.requestId}
                onRowClick={setDetail}
                footer={`${rows.length} de ${all.length} solicitações`}
              />
            )}
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? typeLabel[detail.type] : ''}
        description={detail?.requestId}
        footer={
          detail && detail.status !== 'concluida' ? (
            <Button onClick={() => conclude(detail)}>Concluir e responder ao titular</Button>
          ) : null
        }
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Titular', value: detail.documento },
                { label: 'Canal', value: detail.channel },
                { label: 'Aberta em', value: formatDateTime(detail.openedAt) },
                { label: 'Prazo legal', value: formatDateTime(detail.dueAt) },
                { label: 'Status', value: detail.status.replace(/_/g, ' ') },
                {
                  label: 'Identidade',
                  value: detail.identityVerified ? 'verificada' : 'pendente',
                },
              ]}
            />
            {!detail.identityVerified ? (
              <Notice tone="warning" title="Identidade não verificada">
                O prazo legal só passa a contar após a confirmação de identidade. Reenvie o link de
                verificação se o titular não concluir em 48 h.
              </Notice>
            ) : null}
            <section>
              <h3 className="mb-3 text-base">Histórico da tratativa</h3>
              <ol className="grid gap-3 border-l border-eqx-border pl-4">
                {detail.history.map((event) => (
                  <li key={`${event.at}-${event.actor}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-pill bg-eqx-action"
                    />
                    <p className="text-xs text-eqx-text-muted">
                      {formatDateTime(event.at)} · {event.actor}
                    </p>
                    <p className="text-sm">{event.note}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
