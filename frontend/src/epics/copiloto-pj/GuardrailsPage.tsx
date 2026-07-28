import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ShieldCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Donut,
  Metric,
  Modal,
  Notice,
  ProgressBar,
  QueryBoundary,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatPercent } from '@/lib/format';
import { guardrailReport, type GuardrailFinding } from '@/epics/copiloto-pj/data';

const severityTone = {
  critico: 'danger',
  medio: 'warning',
  baixo: 'info',
} as const;

const typeLabel = {
  afirmacao_sem_lastro: 'Afirmação sem lastro',
  numero_divergente: 'Número divergente',
  linguagem_vedada: 'Linguagem vedada',
  citacao_invalida: 'Citação inválida',
} as const;

export function GuardrailsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const query = useMockQuery(() => guardrailReport, { latency: 380 });
  const [findings, setFindings] = useState<GuardrailFinding[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const list = findings ?? query.data?.findings ?? [];
  const blocking = list.filter((item) => item.status === 'aberto' && item.severity === 'critico');

  function resolve(finding: GuardrailFinding, status: 'aceito' | 'corrigido') {
    setFindings(list.map((item) => (item.findingId === finding.findingId ? { ...item, status } : item)));
    toast.success(
      status === 'corrigido' ? 'Achado corrigido' : 'Achado aceito com justificativa',
      `finding ${finding.findingId}`,
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F06-US-FE-01"
      title="Relatório de verificação (guardrails)"
      description="Resultado da verificação automática do parecer: proporção de afirmações com lastro, conferência dos números contra as fontes, achados por severidade e ações de correção ou aceite justificado."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/pareceres/:opinionId/verificacao
        </Badge>,
      ]}
      actions={
        <>
          <Button
            size="sm"
            variant="secondary"
            icon={<ShieldCheck size={16} aria-hidden="true" />}
            onClick={() => {
              setFindings(null);
              query.reload();
              toast.info('Verificação reexecutada', 'POST /api/v1/pj/guardrails/verify');
            }}
          >
            Verificar novamente
          </Button>
          <Button
            size="sm"
            icon={<Send size={16} aria-hidden="true" />}
            disabled={blocking.length > 0 || !query.data}
            onClick={() => setSubmitting(true)}
          >
            Submeter à alçada
          </Button>
        </>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Este parecer ainda não passou pela verificação.',
          description:
            'Sem relatório de guardrails o parecer não pode ir à alçada. Rode a verificação no editor da minuta para gerar o relatório.',
          action: (
            <Button
              variant="secondary"
              icon={<ShieldCheck size={16} aria-hidden="true" />}
              onClick={() => query.reload()}
            >
              Executar verificação
            </Button>
          ),
        }}
      >
        {(report) => {
          const current = findings ?? report.findings;
          const open = current.filter((item) => item.status === 'aberto');
          const critical = open.filter((item) => item.severity === 'critico');
          return (
            <div className="grid gap-5">
              <Notice
                tone={critical.length ? 'danger' : open.length ? 'warning' : 'success'}
                title={
                  critical.length
                    ? `${critical.length} achado crítico bloqueia a submissão`
                    : open.length
                      ? `${open.length} achados abertos, nenhum bloqueante`
                      : 'Nenhum achado aberto'
                }
              >
                Verificação executada em {formatDateTime(report.verifiedAt)} sobre o parecer{' '}
                <code>{report.opinionId}</code>. Achados críticos impedem o envio à alçada.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={formatPercent((report.claimsGrounded / report.claimsTotal) * 100, 1)}
                  label="Afirmações com lastro"
                  tone={report.claimsGrounded === report.claimsTotal ? 'success' : 'warning'}
                  hint={`${report.claimsGrounded} de ${report.claimsTotal}`}
                />
                <Metric
                  value={formatPercent((report.numbersMatched / report.numbersChecked) * 100, 1)}
                  label="Números conferidos"
                  tone={report.numbersMatched === report.numbersChecked ? 'success' : 'warning'}
                  hint={`${report.numbersMatched} de ${report.numbersChecked}`}
                />
                <Metric
                  value={open.length}
                  label="Achados abertos"
                  tone={open.length ? 'warning' : 'success'}
                />
                <Metric
                  value={current.filter((item) => item.status === 'corrigido').length}
                  label="Corrigidos"
                  tone="success"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <Card>
                  <CardHeader eyebrow="composição" title="Achados por severidade" />
                  <Donut
                    ariaLabel="Distribuição dos achados por severidade"
                    centerValue={String(current.length)}
                    centerLabel="achados"
                    slices={[
                      {
                        label: 'Crítico',
                        value: current.filter((item) => item.severity === 'critico').length,
                        color: 'rgb(var(--color-danger))',
                      },
                      {
                        label: 'Médio',
                        value: current.filter((item) => item.severity === 'medio').length,
                        color: 'rgb(var(--color-warning))',
                      },
                      {
                        label: 'Baixo',
                        value: current.filter((item) => item.severity === 'baixo').length,
                        color: 'rgb(var(--color-info))',
                      },
                    ]}
                  />
                  <div className="mt-4 grid gap-3">
                    <ProgressBar
                      label="Cobertura de lastro documental"
                      value={(report.claimsGrounded / report.claimsTotal) * 100}
                      tone={report.claimsGrounded === report.claimsTotal ? 'success' : 'warning'}
                    />
                    <ProgressBar
                      label="Conferência numérica"
                      value={(report.numbersMatched / report.numbersChecked) * 100}
                      tone={report.numbersMatched === report.numbersChecked ? 'success' : 'warning'}
                    />
                  </div>
                </Card>

                <div className="grid content-start gap-3">
                  {current.map((finding) => (
                    <Card
                      key={finding.findingId}
                      accent={
                        finding.severity === 'critico'
                          ? 'danger'
                          : finding.severity === 'medio'
                            ? 'warning'
                            : 'none'
                      }
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
                        <Badge tone="neutral">{typeLabel[finding.type]}</Badge>
                        <Badge tone={finding.status === 'aberto' ? 'warning' : 'success'}>
                          {finding.status}
                        </Badge>
                        <span className="text-xs text-eqx-text-muted">seção {finding.section}</span>
                      </div>
                      <blockquote className="border-l-2 border-eqx-accent pl-3 text-sm italic">
                        “{finding.claim}”
                      </blockquote>
                      <p className="mt-2 text-sm">{finding.detail}</p>
                      <p className="mt-2 text-sm text-eqx-text-muted">
                        <strong>Sugestão:</strong> {finding.suggestion}
                      </p>
                      {finding.status === 'aberto' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => resolve(finding, 'corrigido')}>
                            Aplicar sugestão
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={finding.severity === 'critico'}
                            onClick={() => resolve(finding, 'aceito')}
                          >
                            Aceitar com justificativa
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={submitting}
        onClose={() => setSubmitting(false)}
        title="Submeter parecer à alçada"
        description="A submissão congela a minuta e transfere a decisão para o aprovador."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitting(false)}>
              Cancelar
            </Button>
            <Button
              icon={<Send size={16} aria-hidden="true" />}
              onClick={() => {
                setSubmitting(false);
                toast.success('Parecer submetido', 'POST /api/v1/pj/opinions/{id}/submit');
                navigate('/pj/pareceres/aprovacao');
              }}
            >
              Confirmar submissão
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Após submeter, novas edições exigem devolução pelo aprovador e invalidam esta verificação. Os
          achados aceitos com justificativa seguem anexados ao parecer para consulta da alçada.
        </p>
      </Modal>
    </ScreenLayout>
  );
}
