import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Target } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Gauge,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  useToast,
} from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatNumber } from '@/lib/format';
import { counterfactualActions, explain } from '@/epics/explicabilidade/data';
import {
  fetchCounterfactualLive,
  lastDecisionId,
  simulateCounterfactualLive,
} from '@/api/explainability';
import { cn } from '@/lib/cn';

const feasibilityTone = {
  alta: 'success',
  media: 'warning',
  baixa: 'danger',
} as const;

export function CounterfactualPage() {
  const params = useParams();
  const fallback = lastDecisionId() ?? 'dec-2026-07-27-1104';
  const decisionId = params.decisionId ?? fallback;
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const query = useDataQuery(
    () => ({ decision: explain(decisionId), actions: counterfactualActions }),
    () => fetchCounterfactualLive(decisionId),
    {
      latency: 360,
      deps: [decisionId],
      isEmpty: (data) => data.actions.length === 0,
    },
  );

  const actions = query.data?.actions ?? [];
  const effectiveSelected = selected.length
    ? selected
    : actions[0]
      ? [actions[0].id]
      : [];
  const chosen = actions.filter((action) => effectiveSelected.includes(action.id));
  const gainMin = chosen.reduce((sum, action) => sum + action.scoreGainMin, 0);
  const gainMax = chosen.reduce((sum, action) => sum + action.scoreGainMax, 0);
  const threshold = 620;

  function toggle(id: string) {
    setSelected((current) => {
      const base = current.length ? current : effectiveSelected;
      return base.includes(id) ? base.filter((item) => item !== id) : [...base, id];
    });
  }

  async function sendPlan() {
    if (!chosen.length) return;
    try {
      if (isLiveMode()) {
        await simulateCounterfactualLive(
          decisionId,
          chosen.map((a) => ({
            attribute_code: a.attribute,
            proposed_value: a.targetValue,
          })),
        );
      }
      toast.success('Plano enviado ao titular', 'POST /api/v1/counterfactual/simulate');
    } catch (error) {
      toast.error('Falha na simulação', errorMessage(error));
    }
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F02-US-FE-01"
      title="Ações recomendadas (contrafactuais)"
      description="Conjunto mínimo de ações viáveis para reverter a decisão, com faixa estimada de ganho de score, prazo de efeito e simulação what-if local ao combinar ações."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="dec" tone="neutral" className="font-mono">
          {query.data?.decision.decisionId ?? decisionId}
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhuma ação recomendada para esta decisão.',
          description: isLiveMode()
            ? 'Emita uma decisão no Playground e abra as ações com o decisionId UUID.'
            : 'O motor de contrafactuais não encontrou mudança viável. Encaminhe à revisão humana.',
        }}
      >
        {(data) => {
          const baseScore = data.decision.score;
          return (
            <div className="grid gap-5">
              <Notice tone="info" title="Estimativas, não garantias">
                As faixas vêm de POST /api/v1/counterfactual/simulate sobre a mesma versão de modelo
                da decisão. O resultado real depende de novos eventos de crédito no período.
              </Notice>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_22rem]">
                <div className="grid gap-3">
                  {data.actions.map((action) => {
                    const active = effectiveSelected.includes(action.id);
                    return (
                      <Card
                        key={action.id}
                        accent={active ? 'action' : 'none'}
                        className={cn('transition-colors', active && 'bg-eqx-action/5')}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge tone={feasibilityTone[action.feasibility]}>
                                viabilidade {action.feasibility}
                              </Badge>
                              <Badge tone="neutral">
                                +{action.scoreGainMin} a +{action.scoreGainMax} pts
                              </Badge>
                              <Badge tone="info">{action.effortDays} dias</Badge>
                            </div>
                            <h3 className="text-lg">{action.action}</h3>
                            <p className="mt-1 text-sm text-eqx-text-muted">{action.guidance}</p>
                            <p className="mt-2 text-sm">
                              <code className="text-xs">{action.attribute}</code>:{' '}
                              {action.currentValue} → <strong>{action.targetValue}</strong>
                            </p>
                          </div>
                          <Button
                            variant={active ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => toggle(action.id)}
                            aria-pressed={active}
                          >
                            {active ? 'Na simulação' : 'Adicionar'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid content-start gap-4">
                  <Card accent="accent">
                    <CardHeader eyebrow="what-if" title="Score projetado" />
                    <Gauge
                      value={Math.min(baseScore + Math.round((gainMin + gainMax) / 2), 1000)}
                      label={`Faixa projetada: ${baseScore + gainMin} a ${baseScore + gainMax}`}
                      bands={[
                        { upTo: 500, color: 'rgb(var(--color-danger))', label: 'recusa' },
                        { upTo: 620, color: 'rgb(var(--color-warning))', label: 'revisão humana' },
                        { upTo: 1000, color: 'rgb(var(--color-success))', label: 'aprovação' },
                      ]}
                    />
                    <ProgressBar
                      className="mt-4"
                      label={`Distância até ${threshold} pts`}
                      value={Math.min(
                        ((gainMax || 1) / Math.max(threshold - baseScore, 1)) * 100,
                        100,
                      )}
                      tone={baseScore + gainMax >= threshold ? 'success' : 'warning'}
                    />
                    <p className="mt-3 text-sm text-eqx-text-muted">
                      {baseScore + gainMax >= threshold
                        ? 'A combinação selecionada é suficiente para atingir a faixa de aprovação.'
                        : `Faltam ${formatNumber(threshold - (baseScore + gainMax))} pontos no melhor cenário.`}
                    </p>
                  </Card>
                  <Metric
                    value={chosen.length}
                    label="Ações na simulação"
                    icon={<Target size={18} aria-hidden="true" />}
                  />
                  <Metric
                    value={`${Math.max(...chosen.map((action) => action.effortDays), 0)} dias`}
                    label="Prazo do plano"
                    hint="maior prazo entre as ações"
                    tone="action"
                  />
                  <Button
                    icon={<Sparkles size={16} aria-hidden="true" />}
                    onClick={() => void sendPlan()}
                    disabled={chosen.length === 0}
                  >
                    Enviar plano ao titular
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
