import { useState } from 'react';
import { Gavel, ShieldAlert } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  KeyValueList,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  TextAreaField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { isLiveMode } from '@/lib/config';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import {
  decideOpinionLive,
  fetchApprovalTrailLive,
  lastHitlOpinionId,
  type HitlTrailEntry,
} from '@/api/pjHitl';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { sumBy } from '@/lib/number';
import {
  approvalQueue,
  approvalTrail,
  authorityMatrix,
  type ApprovalItem,
  type TrailEntry,
} from '@/epics/copiloto-pj/data';

const authorityTone = {
  gerente: 'info',
  superintendente: 'warning',
  comite: 'danger',
} as const;

function mapLiveTrail(entries: HitlTrailEntry[]): TrailEntry[] {
  return entries.map((entry) => ({
    at: entry.at,
    actor: entry.actorId || 'sistema',
    action: entry.action,
    note: entry.comment || entry.levelCode || undefined,
  }));
}

export function ApprovalPage() {
  const toast = useToast();
  const query = useDataQuery(() => approvalQueue, async () => approvalQueue, { latency: 340 });
  const [items, setItems] = useState<ApprovalItem[] | null>(null);
  const [selected, setSelected] = useState<ApprovalItem | null>(null);
  const [decision, setDecision] = useState<'aprovado' | 'reprovado' | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveTrail, setLiveTrail] = useState<TrailEntry[] | null>(null);

  const rows = items ?? query.data ?? [];
  const labOpinionId = lastHitlOpinionId();

  async function loadTrail(item: ApprovalItem) {
    setSelected(item);
    setLiveTrail(null);
    if (!isLiveMode()) return;
    try {
      const res = await fetchApprovalTrailLive(item.opinionId);
      setLiveTrail(mapLiveTrail(res.trail ?? []));
    } catch {
      setLiveTrail(null);
    }
  }

  const columns: Column<ApprovalItem>[] = [
    {
      key: 'opinionId',
      header: 'Parecer',
      render: (row) => <code className="text-xs font-semibold">{row.opinionId}</code>,
    },
    {
      key: 'razaoSocial',
      header: 'Cliente',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.razaoSocial}</p>
          <p className="text-xs text-eqx-text-muted">{row.cnpj}</p>
        </div>
      ),
    },
    { key: 'analyst', header: 'Analista', render: (row) => row.analyst },
    { key: 'riskGrade', header: 'Rating', align: 'center', render: (row) => <Badge tone="neutral">{row.riskGrade}</Badge> },
    {
      key: 'suggestedLimit',
      header: 'Limite sugerido',
      align: 'right',
      numeric: true,
      render: (row) => formatCurrency(row.suggestedLimit, 0),
    },
    {
      key: 'authorityLevel',
      header: 'Alçada',
      align: 'center',
      render: (row) => <Badge tone={authorityTone[row.authorityLevel]}>{row.authorityLevel}</Badge>,
    },
    {
      key: 'submittedAt',
      header: 'Submetido em',
      render: (row) => formatDateTime(row.submittedAt),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Badge tone={row.status === 'aprovado' ? 'success' : row.status === 'reprovado' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  function submit() {
    if (!selected || !decision) return;
    if (note.trim().length < 15) {
      toast.error('Parecer da alçada obrigatório', 'Descreva a fundamentação da decisão');
      return;
    }
    void (async () => {
      setSaving(true);
      try {
        if (isLiveMode()) {
          await decideOpinionLive(selected.opinionId, {
            decision: decision === 'aprovado' ? 'APPROVE' : 'REJECT',
            comment: note.trim(),
          });
          const trail = await fetchApprovalTrailLive(selected.opinionId);
          setLiveTrail(mapLiveTrail(trail.trail ?? []));
        }
        setItems(
          rows.map((row) => (row.opinionId === selected.opinionId ? { ...row, status: decision } : row)),
        );
        toast.success(
          decision === 'aprovado' ? 'Parecer aprovado' : 'Parecer reprovado',
          `POST /api/v1/pj/opinions/{id}/approve`,
        );
        setDecision(null);
        setSelected(null);
        setNote('');
      } catch (error) {
        toast.error('Falha na decisão de alçada', errorMessage(error));
      } finally {
        setSaving(false);
      }
    })();
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F04-US-FE-01"
      title="Aprovação de parecer com alçada"
      description="Caixa de entrada da alçada com resumo do parecer, matriz de competência por valor, trilha completa de geração e edição, e registro da decisão com fundamentação obrigatória."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/pareceres/aprovacao
        </Badge>,
        ...(labOpinionId
          ? [
              <Badge key="lab" tone="info" className="font-mono">
                HITL {labOpinionId.slice(0, 8)}…
              </Badge>,
            ]
          : []),
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'A fila de alçada está vazia.',
          description:
            'Pareceres aparecem aqui depois que o analista submete a minuta com a verificação de guardrails concluída. Nada a decidir por enquanto.',
        }}
      >
        {(data) => {
          const queue = items ?? data;
          const pending = queue.filter((row) => row.status === 'aguardando');
          const trailEntries = liveTrail ?? approvalTrail;
          return (
            <div className="grid gap-5">
              {isLiveMode() && !labOpinionId ? (
                <Notice tone="warning" title="UUID do parecer HITL não definido">
                  Em live, submit/approve usam UUID real (seed Emilly ou `VITE_PJ_OPINION_ID`). A fila
                  mock permanece para navegação; a decisão chama Noah `:8080`.
                </Notice>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={pending.length} label="Aguardando decisão" tone="warning" />
                <Metric
                  value={pending.filter((row) => row.authorityLevel === 'comite').length}
                  label="Casos de comitê"
                  tone="danger"
                  icon={<ShieldAlert size={18} aria-hidden="true" />}
                />
                <Metric
                  value={formatCurrency(sumBy(pending, (row) => row.suggestedLimit), 0)}
                  label="Volume em análise"
                />
                <Metric
                  value={queue.filter((row) => row.status === 'aprovado').length}
                  label="Aprovados hoje"
                  tone="success"
                />
              </div>

              {pending.length === 0 ? (
                <EmptyState
                  title="Nenhum parecer aguardando decisão de alçada."
                  description="Todos os pareceres submetidos já foram decididos. A fila volta a receber casos assim que um analista submeter nova minuta verificada."
                />
              ) : (
                <DataTable
                  caption="Fila de aprovação de pareceres"
                  columns={columns}
                  rows={queue}
                  rowKey={(row) => row.opinionId}
                  onRowClick={(row) => {
                    void loadTrail(row);
                  }}
                  isRowActive={(row) => row.opinionId === selected?.opinionId}
                  footer={`${pending.length} pareceres aguardando decisão de alçada`}
                />
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader
                    eyebrow="competência"
                    title="Matriz de alçada"
                    description="Limite máximo por nível e requisitos formais."
                  />
                  <ul className="grid gap-2">
                    {authorityMatrix.map((level) => (
                      <li
                        key={level.level}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-eqx-border px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">{level.level}</span>
                        <span className="tabular-nums">até {formatCurrency(level.limit, 0)}</span>
                        <span className="w-full text-xs text-eqx-text-muted">{level.requires}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {selected ? (
                  <Card accent="action">
                    <CardHeader
                      eyebrow={`parecer ${selected.opinionId}`}
                      title={selected.razaoSocial}
                      description={`Alçada exigida: ${selected.authorityLevel}`}
                      actions={<Gavel size={18} aria-hidden="true" />}
                    />
                    <KeyValueList
                      items={[
                        { label: 'CNPJ', value: selected.cnpj },
                        { label: 'Analista', value: selected.analyst },
                        { label: 'Rating', value: selected.riskGrade },
                        {
                          label: 'Limite solicitado',
                          value: formatCurrency(selected.requestedLimit, 0),
                        },
                        {
                          label: 'Limite sugerido',
                          value: formatCurrency(selected.suggestedLimit, 0),
                        },
                        { label: 'Submetido em', value: formatDateTime(selected.submittedAt) },
                      ]}
                    />
                    <h3 className="mb-2 mt-5 text-base">Trilha do parecer</h3>
                    <ol className="grid gap-3 border-l border-eqx-border pl-4">
                      {trailEntries.map((entry) => (
                        <li key={`${entry.at}-${entry.action}`} className="relative">
                          <span
                            aria-hidden="true"
                            className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-pill bg-eqx-action"
                          />
                          <p className="text-xs text-eqx-text-muted">
                            {formatDateTime(entry.at)} · {entry.actor}
                          </p>
                          <p className="text-sm font-semibold">{entry.action}</p>
                          {entry.note ? (
                            <p className="text-xs text-eqx-text-muted">{entry.note}</p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                    {selected.status === 'aguardando' ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button onClick={() => setDecision('aprovado')}>Aprovar</Button>
                        <Button variant="danger" onClick={() => setDecision('reprovado')}>
                          Reprovar
                        </Button>
                      </div>
                    ) : (
                      <Notice tone="info" className="mt-5" title="Parecer já decidido">
                        Situação atual: {selected.status}.
                      </Notice>
                    )}
                  </Card>
                ) : (
                  <Card>
                    <CardHeader
                      eyebrow="detalhe"
                      title="Selecione um parecer"
                      description="Clique em uma linha da fila para ver resumo, trilha e ações de alçada."
                    />
                  </Card>
                )}
              </div>
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        title={decision === 'aprovado' ? 'Aprovar parecer' : 'Reprovar parecer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancelar
            </Button>
            <Button
              loading={saving}
              variant={decision === 'reprovado' ? 'danger' : 'primary'}
              onClick={submit}
            >
              Confirmar decisão
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm">
            {selected?.razaoSocial} · limite sugerido {formatCurrency(selected?.suggestedLimit ?? 0, 0)}
          </p>
          <TextAreaField
            label="Fundamentação da alçada"
            required
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            hint="Vai para a trilha do parecer e para o dossiê do cliente."
          />
        </div>
      </Modal>
    </ScreenLayout>
  );
}
