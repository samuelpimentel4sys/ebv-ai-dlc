import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Scale } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  buttonClass,
  Card,
  CardHeader,
  DivergingBars,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
} from '@/ds';
import { useDataQuery } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, formatSigned } from '@/lib/format';
import { explain, type DecisionFactor } from '@/epics/explicabilidade/data';
import { fetchExplainLive, lastDecisionId } from '@/api/explainability';

export function FactorsPage() {
  const params = useParams();
  const fallback = lastDecisionId() ?? 'dec-2026-07-27-1104';
  const decisionId = params.decisionId ?? fallback;
  const [factor, setFactor] = useState<DecisionFactor | null>(null);
  const query = useDataQuery(
    () => explain(decisionId),
    () => fetchExplainLive(decisionId),
    { latency: 380, deps: [decisionId] },
  );

  const displayId = query.data?.decisionId ?? decisionId;

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F01-US-FE-01"
      title="Painel de fatores da decisão"
      description="Leitura dos fatores que determinaram a decisão, com contribuição positiva e negativa de cada atributo em relação ao valor base do modelo, comparação com a média da população e detalhe por fator."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="dec" tone="neutral" className="font-mono">
          {displayId}
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Esta decisão não tem fatores calculados.',
          description: isLiveMode()
            ? 'Emita uma decisão no Playground (includeExplanation) e use o decisionId UUID retornado.'
            : 'A versão de modelo usada na decisão não publicou contribuições por atributo. Consulte o registry para saber se há versão com explicabilidade habilitada.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            <Notice
              tone={data.outcome === 'recusado' ? 'danger' : 'info'}
              title={`Decisão: ${data.outcome}`}
              actions={
                <Link
                  to={`/explicabilidade/decisoes/${data.decisionId}/acoes`}
                  className={buttonClass('secondary', 'sm')}
                >
                  Ver ações recomendadas
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              }
            >
              Score {data.score} sobre valor base {data.baseValue} · modelo{' '}
              <code>{data.modelVersion}</code> · política <code>{data.policyVersion}</code> ·
              decidido em {formatDateTime(data.decidedAt)}.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={data.score} label="Score da decisão" tone="danger" />
              <Metric value={data.baseValue} label="Valor base do modelo" />
              <Metric
                value={formatSigned(data.score - data.baseValue)}
                label="Efeito total dos fatores"
                tone="danger"
                icon={<Scale size={18} aria-hidden="true" />}
              />
              <Metric
                value={data.factors.filter((item) => item.direction === 'negativo').length}
                label="Fatores negativos"
                hint={`de ${data.factors.length} avaliados`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader
                  eyebrow="atribuição"
                  title="Contribuição de cada fator (pontos)"
                  description="GET /api/v1/explain/{decisionId}/factors — valores SHAP normalizados na escala do score."
                />
                <DivergingBars
                  ariaLabel="Contribuição positiva e negativa de cada fator para o score"
                  digits={0}
                  unit=" pts"
                  data={data.factors.map((item) => ({
                    label: item.label,
                    value: item.contribution,
                    hint: `${item.value} · média da população ${item.populationAverage}`,
                  }))}
                />
              </Card>
              <Card>
                <CardHeader
                  eyebrow="detalhe"
                  title="Fatores em ordem de impacto"
                  description="Selecione um fator para ver a explicação em linguagem do titular."
                />
                <ul className="grid gap-2">
                  {[...data.factors]
                    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                    .map((item) => (
                      <li key={item.attribute}>
                        <button
                          type="button"
                          onClick={() => setFactor(item)}
                          className="flex min-h-target w-full items-center justify-between gap-3 rounded-md border border-eqx-border px-3 py-2 text-left hover:bg-eqx-surface-subtle"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{item.label}</span>
                            <code className="text-xs text-eqx-text-muted">{item.attribute}</code>
                          </span>
                          <Badge tone={item.direction === 'positivo' ? 'success' : 'danger'}>
                            {formatSigned(item.contribution)}
                          </Badge>
                        </button>
                      </li>
                    ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(factor)}
        onClose={() => setFactor(null)}
        title={factor?.label ?? ''}
        description="Detalhe do fator e comparação com a população"
      >
        {factor ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Atributo', value: <code className="text-xs">{factor.attribute}</code> },
                { label: 'Valor do titular', value: factor.value },
                { label: 'Média da população', value: factor.populationAverage },
                { label: 'Contribuição', value: `${formatSigned(factor.contribution)} pts` },
              ]}
            />
            <Notice tone={factor.direction === 'positivo' ? 'success' : 'warning'} title="Explicação">
              {factor.explanation}
            </Notice>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
