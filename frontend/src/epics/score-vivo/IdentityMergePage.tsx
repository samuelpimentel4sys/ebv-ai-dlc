import { useMemo, useState } from 'react';
import { GitMerge, UserCheck, XCircle } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  TextAreaField,
  useToast,
} from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, formatPercent } from '@/lib/format';
import { identityCandidates, type IdentityCandidate } from '@/epics/score-vivo/data';
import { fetchIdentityCandidatesLive, mergeIdentityLive } from '@/api/ep01';
import { cn } from '@/lib/cn';

const fieldLabels: Record<string, string> = {
  nome: 'Nome',
  nascimento: 'Nascimento',
  documento: 'Documento',
  endereco: 'Endereço',
  telefone: 'Telefone',
  origem: 'Origem do registro',
};

export function IdentityMergePage() {
  const toast = useToast();
  const query = useDataQuery(() => identityCandidates, fetchIdentityCandidatesLive, {
    latency: 340,
  });
  const [queue, setQueue] = useState<IdentityCandidate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [decision, setDecision] = useState('manter-esquerda');
  const [justification, setJustification] = useState('');
  const [justificationError, setJustificationError] = useState<string | null>(null);

  const candidates = queue.length ? queue : (query.data ?? []);
  const active = useMemo(
    () => candidates.find((item) => item.candidateId === (activeId ?? candidates[0]?.candidateId)),
    [candidates, activeId],
  );

  const pending = candidates.filter((item) => item.status === 'pendente');

  function resolve(status: IdentityCandidate['status']) {
    if (!active) return;
    if (justification.trim().length < 15) {
      setJustificationError(
        'Descreva em pelo menos 15 caracteres o critério usado na decisão — o texto vai para a trilha de auditoria.',
      );
      document.querySelector<HTMLElement>('[name="merge-justification"]')?.focus();
      return;
    }
    void (async () => {
      try {
        if (isLiveMode() && status === 'mesclado') {
          const survivor = active.left.grId ?? active.left.documento;
          const merged = active.right.grId ?? active.right.documento;
          await mergeIdentityLive(survivor, merged, active.matchScore, justification.trim());
        }
        const next = candidates.map((item) =>
          item.candidateId === active.candidateId ? { ...item, status } : item,
        );
        setQueue(next);
        setJustification('');
        setJustificationError(null);
        const remaining = next.find((item) => item.status === 'pendente');
        setActiveId(remaining?.candidateId ?? null);
        toast.success(
          status === 'mesclado' ? 'Registros mesclados' : 'Caso descartado',
          'POST /api/v1/identity/merge',
        );
      } catch (error) {
        toast.error('Falha na mesclagem', errorMessage(error));
      }
    })();
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F07-US-FE-01"
      title="Console de mesclagem de identidade"
      description="Fila de casos ambíguos de resolução de identidade com comparação atributo a atributo, decisão registrada com justificativa e visão do golden record resultante."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /dados/identidade/mesclagem
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum caso de identidade para revisar.',
          description:
            'O resolver não encontrou registros ambíguos nesta janela. Novos casos entram quando a similaridade entre dois cadastros fica entre 0,60 e 0,95.',
        }}
      >
        {() => (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric value={pending.length} label="Casos pendentes" tone="warning" />
              <Metric
                value={candidates.filter((item) => item.status === 'mesclado').length}
                label="Mesclados nesta sessão"
                tone="success"
                icon={<UserCheck size={18} aria-hidden="true" />}
              />
              <Metric
                value={formatPercent(
                  (candidates.reduce((sum, item) => sum + item.matchScore, 0) /
                    Math.max(candidates.length, 1)) *
                    100,
                )}
                label="Similaridade média da fila"
              />
            </div>

            {pending.length === 0 ? (
              <EmptyState
                title="Fila de mesclagem zerada."
                description="Nenhum caso ambíguo aguarda decisão. Acompanhe o resolver de identidade: novos candidatos aparecem quando a similaridade fica entre 0,60 e 0,95."
              />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
                <Card>
                  <CardHeader eyebrow="fila" title={`Candidatos (${pending.length})`} />
                  <ul className="grid gap-2">
                    {pending.map((candidate) => (
                      <li key={candidate.candidateId}>
                        <button
                          type="button"
                          onClick={() => setActiveId(candidate.candidateId)}
                          className={cn(
                            'min-h-[2.5rem] w-full rounded-md border px-3 py-2 text-left transition-colors',
                            candidate.candidateId === active?.candidateId
                              ? 'border-eqx-action bg-eqx-action/10'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <code className="text-xs">{candidate.candidateId}</code>
                            <Badge
                              tone={
                                candidate.matchScore > 0.9
                                  ? 'danger'
                                  : candidate.matchScore > 0.75
                                    ? 'warning'
                                    : 'neutral'
                              }
                            >
                              {formatPercent(candidate.matchScore * 100, 0)}
                            </Badge>
                          </span>
                          <span className="mt-1 block text-xs text-eqx-text-muted">
                            {candidate.documento} · {formatDateTime(candidate.createdAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                {active ? (
                  <div className="grid gap-4">
                    <Notice tone="warning" title="Motivo do encaminhamento">
                      {active.reason}
                    </Notice>

                    <Card>
                      <CardHeader
                        eyebrow="comparação"
                        title={`Caso ${active.candidateId}`}
                        description="GET /api/v1/identity/candidates — atributos divergentes destacados."
                        actions={
                          <ProgressBar
                            label="similaridade"
                            value={active.matchScore * 100}
                            tone={active.matchScore > 0.9 ? 'danger' : 'warning'}
                            className="w-40"
                          />
                        }
                      />
                      <div className="overflow-x-auto eqx-scrollbar">
                        <table className="w-full text-left text-sm">
                          <caption className="visually-hidden">
                            Comparação de atributos entre os dois registros candidatos
                          </caption>
                          <thead>
                            <tr className="bg-eqx-surface-strong text-eqx-text-inverse">
                              <th
                                scope="col"
                                className="border-b-[3px] border-b-eqx-accent px-3 py-2 text-xs uppercase"
                              >
                                Atributo
                              </th>
                              <th
                                scope="col"
                                className="border-b-[3px] border-b-eqx-accent px-3 py-2 text-xs uppercase"
                              >
                                Registro A
                              </th>
                              <th
                                scope="col"
                                className="border-b-[3px] border-b-eqx-accent px-3 py-2 text-xs uppercase"
                              >
                                Registro B
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(active.left).map((field) => {
                              const differs = active.left[field] !== active.right[field];
                              return (
                                <tr
                                  key={field}
                                  className={cn(
                                    'border-b border-eqx-border',
                                    differs && 'bg-eqx-warning-bg/40',
                                  )}
                                >
                                  <th scope="row" className="px-3 py-2 text-left font-semibold">
                                    {fieldLabels[field] ?? field}
                                  </th>
                                  <td className="px-3 py-2">{active.left[field]}</td>
                                  <td className="px-3 py-2">{active.right[field]}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card accent="action">
                      <CardHeader
                        eyebrow="decisão"
                        title="Registrar tratativa"
                        description="A decisão gera evento auditável e recalcula o golden record do documento."
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <SelectField
                          label="Resultado do golden record"
                          value={decision}
                          onChange={(event) => setDecision(event.target.value)}
                          options={[
                            { value: 'manter-esquerda', label: 'Mesclar mantendo Registro A' },
                            { value: 'manter-direita', label: 'Mesclar mantendo Registro B' },
                            { value: 'mesclar-campo', label: 'Mesclar campo a campo' },
                            { value: 'nao-mesclar', label: 'Não mesclar (pessoas distintas)' },
                          ]}
                        />
                        <TextAreaField
                          label="Justificativa"
                          name="merge-justification"
                          required
                          value={justification}
                          error={justificationError ?? undefined}
                          onChange={(event) => {
                            setJustification(event.target.value);
                            setJustificationError(null);
                          }}
                          hint="Obrigatória para a trilha de auditoria (LGPD art. 20)."
                          rows={3}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          icon={<GitMerge size={16} aria-hidden="true" />}
                          onClick={() => resolve('mesclado')}
                        >
                          Confirmar mesclagem
                        </Button>
                        <Button
                          variant="secondary"
                          icon={<XCircle size={16} aria-hidden="true" />}
                          onClick={() => resolve('descartado')}
                        >
                          Descartar caso
                        </Button>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader
                        eyebrow="golden record"
                        title="Prévia do registro consolidado"
                        description="GET /api/v1/identity/{documento}"
                      />
                      <pre>{JSON.stringify(
                        {
                          documento: active.documento,
                          nome:
                            decision === 'manter-direita' ? active.right.nome : active.left.nome,
                          nascimento: active.left.nascimento,
                          endereco:
                            decision === 'manter-direita'
                              ? active.right.endereco
                              : active.left.endereco,
                          fontes: [active.left.origem, active.right.origem],
                          confidence: active.matchScore,
                        },
                        null,
                        2,
                      )}</pre>
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
