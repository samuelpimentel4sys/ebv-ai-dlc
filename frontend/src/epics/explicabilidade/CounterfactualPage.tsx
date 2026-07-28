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
import { useMockQuery } from '@/lib/useMockQuery';
import { formatNumber } from '@/lib/format';
import { counterfactualActions, explain } from '@/epics/explicabilidade/data';
import { cn } from '@/lib/cn';

const feasibilityTone = {
  alta: 'success',
  media: 'warning',
  baixa: 'danger',
} as const;

export function CounterfactualPage() {
  const params = useParams();
  const decisionId = params.decisionId ?? 'dec-2026-07-27-1104';
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(['cf-01']);
  const query = useMockQuery(
    () => ({ decision: explain(decisionId), actions: counterfactualActions }),
    { latency: 360, deps: [decisionId] },
  );

  const chosen = counterfactualActions.filter((action) => selected.includes(action.id));
  const gainMin = chosen.reduce((sum, action) => sum + action.scoreGainMin, 0);
  const gainMax = chosen.reduce((sum, action) => sum + action.scoreGainMax, 0);
  const threshold = 620;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
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
          {decisionId}
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhuma ação recomendada para esta decisão.',
          description:
            'O motor de contrafactuais não encontrou mudança viável capaz de reverter o resultado. Encaminhe o caso à revisão humana para avaliação manual.',
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
                    const active = selected.includes(action.id);
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
                      value={Math.min((gainMax / (threshold - baseScore)) * 100, 100)}
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
                    onClick={() =>
                      toast.success(
                        'Plano enviado ao titular',
                        'Publicado no portal e no coach de crédito',
                      )
                    }
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
