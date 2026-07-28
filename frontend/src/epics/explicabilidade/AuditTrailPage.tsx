import { useMemo, useState } from 'react';
import { FileDown, ShieldCheck } from 'lucide-react';
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
  Modal,
  Notice,
  QueryBoundary,
  SelectField,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime } from '@/lib/format';
import { exportAuditLive, fetchAuditTrailLive } from '@/api/explainability';
import { auditTrail, type AuditEvent } from '@/epics/explicabilidade/data';

const actorTone = {
  sistema: 'info',
  humano: 'accent',
  'cliente-b2b': 'warning',
} as const;

export function AuditTrailPage() {
  const toast = useToast();
  const [documento, setDocumento] = useState('');
  const query = useDataQuery(
    () => auditTrail,
    () => fetchAuditTrailLive(documento.trim() || undefined),
    { latency: 340, deps: [documento] },
  );
  const [actorType, setActorType] = useState('todos');
  const [action, setAction] = useState('todas');
  const [detail, setDetail] = useState<AuditEvent | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const actions = useMemo(
    () => ['todas', ...new Set((query.data ?? []).map((event) => event.action))],
    [query.data],
  );

  const rows = useMemo(
    () =>
      (query.data ?? []).filter((event) => {
        const matchDoc = !documento || (event.documento ?? '').includes(documento);
        const matchActor = actorType === 'todos' || event.actorType === actorType;
        const matchAction = action === 'todas' || event.action === action;
        return matchDoc && matchActor && matchAction;
      }),
    [query.data, documento, actorType, action],
  );

  const filtersActive = documento.trim() !== '' || actorType !== 'todos' || action !== 'todas';

  function clearFilters() {
    setDocumento('');
    setActorType('todos');
    setAction('todas');
  }

  const columns: Column<AuditEvent>[] = [
    {
      key: 'occurredAt',
      header: 'Quando',
      render: (row) => formatDateTime(row.occurredAt),
      width: '11rem',
    },
    {
      key: 'action',
      header: 'Ação',
      render: (row) => <code className="text-xs font-semibold">{row.action}</code>,
    },
    {
      key: 'actor',
      header: 'Ator',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.actor}</p>
          <Badge tone={actorTone[row.actorType]}>{row.actorType}</Badge>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entidade',
      render: (row) => <code className="text-xs">{row.entity}</code>,
    },
    {
      key: 'documento',
      header: 'Titular',
      render: (row) => row.documento ?? <span className="text-eqx-text-muted">—</span>,
    },
    {
      key: 'hash',
      header: 'Hash encadeado',
      render: (row) => <code className="text-xs text-eqx-text-muted">{row.hash}</code>,
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F04-US-FE-01"
      title="Trilha de auditoria regulatória"
      description="Consulta da trilha imutável e encadeada por hash: emissão de decisões, leituras de explicação por clientes B2B, emissão de dossiês, atribuições de revisão e ativação de políticas."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/auditoria/trilha
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          variant="secondary"
          icon={<FileDown size={16} aria-hidden="true" />}
          onClick={() => setExportOpen(true)}
        >
          Exportar
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum evento de auditoria nesta janela.',
          description:
            'A trilha só registra eventos a partir da primeira decisão emitida. Amplie o período consultado para alcançar registros mais antigos.',
        }}
        noResults={{ active: filtersActive, onClear: clearFilters }}
      >
        {(data) => (
          <div className="grid gap-5">
            <Notice tone="success" title="Cadeia íntegra">
              Cada evento carrega o hash do anterior. A verificação diária de integridade não
              encontrou divergências nos últimos 90 dias.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={data.length} label="Eventos na janela" />
              <Metric
                value={data.filter((event) => event.actorType === 'humano').length}
                label="Ações humanas"
                tone="action"
              />
              <Metric
                value={data.filter((event) => event.actorType === 'cliente-b2b').length}
                label="Leituras B2B"
                tone="warning"
              />
              <Metric
                value="90 dias"
                label="Retenção on-line"
                hint="depois vai para arquivamento WORM"
              />
            </div>

            <Card>
              <CardHeader eyebrow="filtros" title="Consulta da trilha" />
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Documento do titular"
                  placeholder="ex.: 123"
                  value={documento}
                  onChange={(event) => setDocumento(event.target.value)}
                />
                <SelectField
                  label="Tipo de ator"
                  value={actorType}
                  onChange={(event) => setActorType(event.target.value)}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'sistema', label: 'Sistema' },
                    { value: 'humano', label: 'Humano' },
                    { value: 'cliente-b2b', label: 'Cliente B2B' },
                  ]}
                />
                <SelectField
                  label="Ação"
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  options={actions.map((item) => ({
                    value: item,
                    label: item === 'todas' ? 'Todas' : item,
                  }))}
                />
              </div>
            </Card>

            {rows.length === 0 ? (
              <EmptyState
                title="Nenhum evento atende aos filtros aplicados."
                description={`A janela tem ${data.length} eventos. Limpe os filtros ou troque o documento, o tipo de ator e a ação consultada.`}
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <DataTable
                caption="Eventos da trilha de auditoria"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.eventId}
                onRowClick={setDetail}
                footer={`${rows.length} de ${data.length} eventos`}
              />
            )}
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.action ?? ''}
        description={`Evento ${detail?.eventId ?? ''}`}
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              columns={1}
              items={[
                { label: 'Ocorrido em', value: formatDateTime(detail.occurredAt) },
                { label: 'Ator', value: `${detail.actor} (${detail.actorType})` },
                { label: 'Entidade', value: <code className="text-xs">{detail.entity}</code> },
                { label: 'Titular', value: detail.documento ?? '—' },
                { label: 'IP de origem', value: detail.ip ?? 'interno' },
                { label: 'Hash', value: <code className="text-xs">{detail.hash}</code> },
              ]}
            />
            <Notice tone="info" title="Imutabilidade">
              Eventos de auditoria não podem ser editados nem excluídos. Correções entram como novos
              eventos com referência ao original.
            </Notice>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar trilha de auditoria"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExportOpen(false)}>
              Cancelar
            </Button>
            <Button
              icon={<ShieldCheck size={16} aria-hidden="true" />}
              onClick={() => {
                void (async () => {
                  try {
                    if (isLiveMode()) {
                      const { exportId } = await exportAuditLive('regulatory-export');
                      toast.success('Exportação solicitada', `POST /api/v1/audit/export · ${exportId}`);
                    } else {
                      toast.success('Exportação solicitada', 'POST /api/v1/audit/export');
                    }
                    setExportOpen(false);
                  } catch (error) {
                    toast.error('Falha na exportação', errorMessage(error));
                  }
                })();
              }}
            >
              Gerar arquivo assinado
            </Button>
          </>
        }
      >
        <p className="text-sm">
          A exportação gera CSV assinado com o hash raiz do período, adequado para envio a órgão
          regulador. O arquivo fica disponível por 7 dias e o próprio ato de exportar entra na
          trilha.
        </p>
      </Modal>
    </ScreenLayout>
  );
}
