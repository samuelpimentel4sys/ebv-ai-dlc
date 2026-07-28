import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Wand2 } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Gauge,
  Metric,
  Notice,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import { MARIA } from '@/app/story';
import {
  coachProgress,
  simulate,
  simulationActions,
  simulationHistory,
  type SimulationHistoryItem,
} from '@/epics/thinfile/data';

const DISPUTE_ACTION = 'act-1';
const LINK_ACTION = 'act-3';

export function SimulatorPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([DISPUTE_ACTION]);
  const [submitted, setSubmitted] = useState<string[]>([DISPUTE_ACTION]);
  const [selectionError, setSelectionError] = useState('');

  const query = useMockQuery(() => simulate(submitted), {
    latency: 520,
    deps: [submitted.join('|')],
    enabled: submitted.length > 0,
  });

  const historyColumns: Column<SimulationHistoryItem>[] = [
    { key: 'at', header: 'Quando', render: (row) => formatDateTime(row.at) },
    { key: 'action', header: 'Ações simuladas', render: (row) => row.action },
    {
      key: 'faixa',
      header: 'Faixa estimada',
      align: 'right',
      numeric: true,
      render: (row) => `${row.estimateMin} a ${row.estimateMax}`,
    },
    {
      key: 'applied',
      header: 'Ação tomada',
      align: 'center',
      render: (row) => (
        <Badge tone={row.applied ? 'success' : 'neutral'}>{row.applied ? 'sim' : 'não'}</Badge>
      ),
    },
  ];

  function toggle(actionId: string) {
    setSelectionError('');
    setSelected((current) =>
      current.includes(actionId)
        ? current.filter((item) => item !== actionId)
        : [...current, actionId],
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F06-US-FE-01"
      title="Simulador de impacto no score"
      description="Projeção antes de agir: o titular combina ações possíveis e recebe uma faixa estimada de score, com os principais fatores de contribuição, nível de confiança e aviso explícito de que não há garantia de resultado."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Coach B2C
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /coach/simulador
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Notice tone="warning" title="Estimativa, não promessa de resultado">
          A projeção usa o comportamento observado em pessoas com perfil semelhante ao seu. Nenhum
          serviço pode garantir aumento de score, e o Prisma nunca cobra por isso.
        </Notice>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader
              eyebrow="ações"
              title="O que você pretende fazer?"
              description="Combine até quatro ações para ver o efeito conjunto."
              actions={<Wand2 size={18} aria-hidden="true" />}
            />
            <ul className="grid gap-2">
              {simulationActions.map((action) => {
                const active = selected.includes(action.actionId);
                return (
                  <li key={action.actionId}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(action.actionId)}
                      className={`min-h-target w-full rounded-md border px-4 py-3 text-left transition-colors duration-fast ${
                        active
                          ? 'border-eqx-action bg-eqx-action/10'
                          : 'border-eqx-border hover:bg-eqx-surface-subtle'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{action.label}</p>
                        {action.amountLabel ? (
                          <Badge tone="neutral">{action.amountLabel}</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-eqx-text-muted">{action.description}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectionError ? (
              <p role="alert" className="mt-3 text-sm font-semibold text-eqx-danger">
                {selectionError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (selected.length === 0) {
                    setSelectionError(
                      'Marque pelo menos uma ação acima para simular — a projeção precisa saber o que você pretende fazer.',
                    );
                    return;
                  }
                  setSelectionError('');
                  setSubmitted(selected);
                  toast.info('Simulando', 'POST /api/v1/coach/simulate');
                }}
              >
                Simular impacto
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelected([]);
                  setSubmitted([]);
                  setSelectionError('');
                }}
              >
                Limpar seleção
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              eyebrow="resultado"
              title="Faixa estimada em 90 dias"
              description="O intervalo reflete a incerteza natural da projeção."
            />
            {submitted.length === 0 ? (
              <p className="py-8 text-center text-sm text-eqx-text-muted">
                Selecione ações e execute a simulação para ver a faixa estimada.
              </p>
            ) : (
              <QueryBoundary
                query={query}
                loadingRows={4}
                empty={{
                  title: 'Não conseguimos projetar essa combinação agora.',
                  description:
                    'As ações escolhidas não têm base comparável de pessoas com perfil parecido ao seu, então qualquer número seria chute. Tente uma combinação diferente ou volte depois da próxima atualização do seu histórico.',
                }}
              >
                {(data) => (
                  <div className="grid gap-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Metric value={data.scoreNow} label="Score atual" />
                      <Metric
                        value={`${data.estimateMin}–${data.estimateMax}`}
                        label="Faixa projetada"
                        tone="success"
                      />
                      <Metric
                        value={data.confidence}
                        label="Confiança da estimativa"
                        hint={`horizonte de ${data.horizonDays} dias`}
                      />
                    </div>
                    <Gauge
                      value={data.estimateMax}
                      min={0}
                      max={1000}
                      label="Score projetado (limite superior)"
                      bands={[
                        {
                          upTo: 300,
                          color: 'rgb(var(--color-danger))',
                          label: 'muito baixo',
                        },
                        {
                          upTo: 500,
                          color: 'rgb(var(--color-warning))',
                          label: 'baixo',
                        },
                        {
                          upTo: 700,
                          color: 'rgb(var(--color-action))',
                          label: 'médio',
                        },
                        {
                          upTo: 1000,
                          color: 'rgb(var(--color-success))',
                          label: 'alto',
                        },
                      ]}
                    />
                    {data.drivers.length > 0 ? (
                      <div>
                        <h3 className="mb-2 text-base">O que mais contribui</h3>
                        <BarChart
                          ariaLabel="Contribuição relativa de cada ação simulada"
                          unit="%"
                          digits={0}
                          data={data.drivers.map((driver) => ({
                            label: driver.label,
                            value: driver.contribution,
                          }))}
                        />
                      </div>
                    ) : null}
                    <p className="text-xs text-eqx-text-muted">{data.caveat}</p>

                    <div className="flex flex-wrap gap-2 border-t border-eqx-border pt-4">
                      {submitted.includes(DISPUTE_ACTION) ? (
                        <Link
                          to={`/titular/contestacoes/${MARIA.disputeProtocol}`}
                          className={buttonClass('primary', 'sm')}
                        >
                          Acompanhar a contestação {MARIA.disputeProtocol}
                        </Link>
                      ) : null}
                      {submitted.includes(LINK_ACTION) ? (
                        <Link to="/titular/vinculos" className={buttonClass('secondary', 'sm')}>
                          Vincular a conta de consumo
                        </Link>
                      ) : null}
                      <Link to="/coach/missoes" className={buttonClass('ghost', 'sm')}>
                        Ver missões que sustentam esse ganho
                      </Link>
                    </div>
                  </div>
                )}
              </QueryBoundary>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader
            eyebrow="GET /api/v1/coach/simulations/history"
            title="Histórico de simulações"
            description="Suas projeções anteriores e se a ação foi efetivamente tomada."
            actions={<History size={18} aria-hidden="true" />}
          />
          <DataTable
            caption="Histórico de simulações do titular"
            columns={historyColumns}
            rows={simulationHistory}
            rowKey={(row) => row.simulationId}
            footer={`Score atual de referência: ${formatNumber(coachProgress.scoreNow)} pontos.`}
          />
        </Card>
      </div>
    </ScreenLayout>
  );
}
