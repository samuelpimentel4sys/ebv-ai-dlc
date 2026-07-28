import { useState } from 'react';
import { FlaskConical, Play, Save } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DivergingBars,
  Metric,
  Notice,
  TextAreaField,
  useToast,
} from '@/ds';
import { formatCurrency, formatNumber, formatPercent, formatSigned } from '@/lib/format';
import {
  policyBaselineRule,
  simulatePolicy,
  type PolicySimulation,
} from '@/epics/explicabilidade/data';

export function PolicySandboxPage() {
  const toast = useToast();
  const [rule, setRule] = useState(policyBaselineRule);
  const [result, setResult] = useState<PolicySimulation | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function run() {
    const text = rule.trim();
    if (!text) {
      setRuleError(
        'Escreva ao menos uma regra antes de simular, ou use “Restaurar política ativa” para partir da versão em produção.',
      );
      document.querySelector<HTMLElement>('[name="policy-rules"]')?.focus();
      return;
    }
    if (!/\bwhen\b/i.test(text) || !/\bthen\b/i.test(text)) {
      setRuleError(
        'Nenhuma regra reconhecida: cada bloco precisa de uma condição "when" e o resultado em "then".',
      );
      document.querySelector<HTMLElement>('[name="policy-rules"]')?.focus();
      return;
    }
    setRuleError(null);
    setRunning(true);
    window.setTimeout(() => {
      setResult(simulatePolicy(rule));
      setRunning(false);
      toast.success(
        'Simulação concluída',
        'POST /api/v1/policy/simulate — amostra de 412 mil decisões',
      );
    }, 700);
  }

  const deltaApproval = result ? result.candidate.approvalRatePct - result.baseline.approvalRatePct : 0;
  const deltaLoss = result ? result.candidate.expectedLossPct - result.baseline.expectedLossPct : 0;
  const deltaRevenue = result ? result.candidate.revenue - result.baseline.revenue : 0;

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F09-US-FE-01"
      title="Ensaio de política de crédito"
      description="Sandbox para editar regras de decisão e medir o efeito sobre taxa de aprovação, perda esperada e receita antes de promover a política, com detalhe do impacto por segmento sensível."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/politicas/ensaio
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Notice tone="warning" title="Ambiente isolado">
          Nada aqui afeta produção. A simulação roda sobre uma amostra congelada de 412 mil decisões
          dos últimos 30 dias com a versão de modelo vigente.
        </Notice>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader
              eyebrow="editor"
              title="Regras da política candidata"
              description="Linguagem declarativa avaliada de cima para baixo; a primeira condição satisfeita decide."
              actions={<FlaskConical size={18} aria-hidden="true" />}
            />
            <TextAreaField
              label="Regras"
              name="policy-rules"
              value={rule}
              error={ruleError ?? undefined}
              onChange={(event) => {
                setRule(event.target.value);
                setRuleError(null);
              }}
              rows={12}
              hint="Ex.: trocar o corte 500 por 540, ou o multiplicador 0.30 por 0.25."
              className="font-mono"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                icon={<Play size={16} aria-hidden="true" />}
                loading={running}
                onClick={run}
              >
                Rodar simulação
              </Button>
              <Button
                variant="secondary"
                icon={<Save size={16} aria-hidden="true" />}
                disabled={!result}
                onClick={() => toast.success('Rascunho salvo', 'Nova versão policy-pf-18 em rascunho')}
              >
                Salvar como rascunho
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setRule(policyBaselineRule);
                  setRuleError(null);
                }}
              >
                Restaurar política ativa
              </Button>
            </div>
          </Card>

          <div className="grid content-start gap-4">
            {result ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    value={formatPercent(result.candidate.approvalRatePct)}
                    label="Taxa de aprovação"
                    tone={deltaApproval >= 0 ? 'success' : 'danger'}
                    hint={`${formatSigned(deltaApproval, 1)} p.p. vs. política ativa`}
                  />
                  <Metric
                    value={formatPercent(result.candidate.expectedLossPct)}
                    label="Perda esperada"
                    tone={deltaLoss <= 0 ? 'success' : 'danger'}
                    hint={`${formatSigned(deltaLoss, 1)} p.p.`}
                  />
                  <Metric
                    value={formatCurrency(result.candidate.revenue * 1_000_000, 0)}
                    label="Receita projetada"
                    tone={deltaRevenue >= 0 ? 'success' : 'warning'}
                    hint={`${formatSigned(deltaRevenue, 1)} mi vs. baseline`}
                  />
                </div>

                <Card accent="action">
                  <CardHeader
                    eyebrow="impacto por segmento"
                    title="Variação da aprovação em pontos percentuais"
                    description="Segmentos sensíveis monitorados pelo painel de equidade."
                  />
                  <DivergingBars
                    ariaLabel="Variação da taxa de aprovação por segmento sensível"
                    digits={1}
                    unit=" p.p."
                    data={result.affectedSegments.map((item) => ({
                      label: item.segment,
                      value: item.deltaApprovalPp,
                    }))}
                  />
                  {result.affectedSegments.some((item) => item.deltaApprovalPp <= -5) ? (
                    <Notice tone="danger" className="mt-4" title="Risco de equidade">
                      Queda superior a 5 p.p. em segmento sensível exige parecer do comitê de modelos
                      antes da promoção.
                    </Notice>
                  ) : null}
                </Card>

                <Card>
                  <CardHeader eyebrow="baseline" title="Política ativa (comparação)" />
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-eqx-text-muted">
                        Aprovação
                      </dt>
                      <dd className="text-lg font-bold tabular-nums">
                        {formatPercent(result.baseline.approvalRatePct)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-eqx-text-muted">
                        Perda esperada
                      </dt>
                      <dd className="text-lg font-bold tabular-nums">
                        {formatPercent(result.baseline.expectedLossPct)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-eqx-text-muted">
                        Amostra
                      </dt>
                      <dd className="text-lg font-bold tabular-nums">
                        {formatNumber(result.baseline.volume)} decisões
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-eqx-text-muted">
                        Simulação
                      </dt>
                      <dd className="text-lg font-bold">
                        <code className="text-sm">{result.simulationId}</code>
                      </dd>
                    </div>
                  </dl>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader
                  eyebrow="aguardando execução"
                  title="Nenhuma simulação executada"
                  description="Edite as regras e rode a simulação para comparar com a política ativa."
                />
                <ul className="grid gap-2 text-sm text-eqx-text-muted">
                  <li>· A amostra é congelada, então execuções repetidas são comparáveis.</li>
                  <li>· A perda esperada usa a curva de inadimplência observada em 12 meses.</li>
                  <li>· Resultados por segmento alimentam o painel de equidade.</li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ScreenLayout>
  );
}
