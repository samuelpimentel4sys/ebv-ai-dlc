import { useMemo, useState } from 'react';
import { CheckCheck, Clock3, UserSearch } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DivergingBars,
  EmptyState,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
  TextAreaField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, relativeFromNow } from '@/lib/format';
import { explain, reviewQueue, type ReviewItem } from '@/epics/explicabilidade/data';
import { cn } from '@/lib/cn';

const priorityTone = {
  alta: 'danger',
  media: 'warning',
  baixa: 'neutral',
} as const;

export function HumanReviewPage() {
  const toast = useToast();
  const query = useMockQuery(() => reviewQueue, { latency: 360 });
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('manter');
  const [justification, setJustification] = useState('');
  const [justificationError, setJustificationError] = useState<string | null>(null);

  const rows = items ?? query.data ?? [];
  const pending = rows.filter((row) => row.status !== 'decidido');
  const active = useMemo(
    () => rows.find((row) => row.reviewId === (activeId ?? pending[0]?.reviewId)),
    [rows, activeId, pending],
  );
  const factors = active ? explain(active.decisionId).factors : [];

  function decide() {
    if (!active) return;
    if (justification.trim().length < 20) {
      setJustificationError(
        'Descreva a análise em pelo menos 20 caracteres: o titular recebe este texto como resposta ao pedido de revisão.',
      );
      document.querySelector<HTMLElement>('[name="review-justification"]')?.focus();
      return;
    }
    setItems(
      rows.map((row) => (row.reviewId === active.reviewId ? { ...row, status: 'decidido' } : row)),
    );
    setJustification('');
    setJustificationError(null);
    setActiveId(null);
    toast.success(
      outcome === 'reverter' ? 'Decisão revertida' : 'Decisão mantida',
      `PATCH /api/v1/reviews/${active.reviewId}/decide`,
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F06-US-FE-01"
      title="Análise e decisão de revisão humana"
      description="Fila priorizada de pedidos de revisão com contexto completo da decisão automatizada, fatores determinantes, alegação do titular e formulário de decisão com justificativa obrigatória."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/revisao-humana/fila
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum pedido de revisão registrado.',
          description:
            'A fila é alimentada pelo portal do titular, pelo SAC e pela API B2B. Assim que um pedido entrar, ele aparece aqui priorizado por SLA.',
        }}
      >
        {() => (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={pending.length} label="Pedidos na fila" tone="warning" />
              <Metric
                value={rows.filter((row) => row.priority === 'alta').length}
                label="Prioridade alta"
                tone="danger"
                icon={<Clock3 size={18} aria-hidden="true" />}
              />
              <Metric
                value={rows.filter((row) => row.status === 'decidido').length}
                label="Decididos"
                tone="success"
                icon={<CheckCheck size={18} aria-hidden="true" />}
              />
              <Metric value="48 h" label="SLA de revisão" hint="LGPD art. 20 e política interna" />
            </div>

            {pending.length === 0 ? (
              <EmptyState
                title="Fila de revisão vazia."
                description="Todos os pedidos desta janela já foram decididos. Novos itens entram pelo portal do titular, pelo SAC ou pela API B2B."
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
                <Card>
                  <CardHeader
                    eyebrow="fila"
                    title={`Pedidos (${pending.length})`}
                    description="GET /api/v1/reviews/queue"
                  />
                  <ul className="grid gap-2">
                    {pending.map((item) => (
                      <li key={item.reviewId}>
                        <button
                          type="button"
                          onClick={() => setActiveId(item.reviewId)}
                          className={cn(
                            'min-h-target w-full rounded-md border px-3 py-2 text-left transition-colors',
                            item.reviewId === active?.reviewId
                              ? 'border-eqx-action bg-eqx-action/10'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <code className="text-xs font-semibold">{item.reviewId}</code>
                            <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
                          </span>
                          <span className="mt-1 block text-xs text-eqx-text-muted">
                            {item.documento} · canal {item.channel} · SLA{' '}
                            {relativeFromNow(item.slaDueAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                {active ? (
                  <div className="grid gap-4">
                    <Notice
                      tone={new Date(active.slaDueAt).getTime() < Date.now() ? 'danger' : 'info'}
                      title={`SLA ${relativeFromNow(active.slaDueAt)}`}
                    >
                      Pedido aberto em {formatDateTime(active.requestedAt)} pelo canal{' '}
                      {active.channel}. Prazo limite {formatDateTime(active.slaDueAt)}.
                    </Notice>

                    <Card>
                      <CardHeader
                        eyebrow="contexto"
                        title={`Decisão ${active.decisionId}`}
                        description="GET /api/v1/explain/{decisionId}"
                        actions={<Badge tone="danger">score {active.score}</Badge>}
                      />
                      <KeyValueList
                        items={[
                          { label: 'Titular', value: active.documento },
                          { label: 'Motivos aplicados', value: active.reasonCodes.join(', ') },
                          { label: 'Canal de entrada', value: active.channel },
                          { label: 'Status', value: active.status },
                        ]}
                      />
                      <div className="mt-5">
                        <h3 className="mb-3 text-base">Fatores determinantes</h3>
                        <DivergingBars
                          ariaLabel="Fatores determinantes da decisão sob revisão"
                          digits={0}
                          unit=" pts"
                          data={factors.map((item) => ({
                            label: item.label,
                            value: item.contribution,
                          }))}
                        />
                      </div>
                    </Card>

                    <Card accent="warning">
                      <CardHeader
                        eyebrow="alegação do titular"
                        title="O que foi contestado"
                        actions={<UserSearch size={18} aria-hidden="true" />}
                      />
                      <p className="text-sm">{active.claim}</p>
                    </Card>

                    <Card accent="action">
                      <CardHeader
                        eyebrow="decisão"
                        title="Registrar resultado da revisão"
                        description="PATCH /api/v1/reviews/{reviewId}/decide"
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <SelectField
                          label="Resultado"
                          value={outcome}
                          onChange={(event) => setOutcome(event.target.value)}
                          options={[
                            { value: 'manter', label: 'Manter decisão automatizada' },
                            { value: 'reverter', label: 'Reverter decisão (aprovar)' },
                            { value: 'reverter-limite', label: 'Reverter com limite reduzido' },
                            { value: 'aguardar', label: 'Solicitar documentação adicional' },
                          ]}
                        />
                        <TextAreaField
                          label="Justificativa da análise"
                          name="review-justification"
                          required
                          value={justification}
                          error={justificationError ?? undefined}
                          onChange={(event) => {
                            setJustification(event.target.value);
                            setJustificationError(null);
                          }}
                          hint="Vai integrar o dossiê do titular e a trilha de auditoria."
                          rows={4}
                        />
                      </div>
                      <div className="mt-4">
                        <Button onClick={decide}>Registrar decisão</Button>
                      </div>
                    </Card>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </QueryBoundary>
    </ScreenLayout>
  );
}
