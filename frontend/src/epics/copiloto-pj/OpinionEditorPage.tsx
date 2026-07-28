import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Send, ShieldCheck, Timer } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  Tabs,
  TextAreaField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format';
import { AURORA } from '@/app/story';
import { opinion, ragQuery, type OpinionSection } from '@/epics/copiloto-pj/data';

const SLA_SECONDS = 180;

export function OpinionEditorPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const query = useMockQuery(() => opinion, { latency: 400 });
  const [sections, setSections] = useState<OpinionSection[] | null>(null);
  const [verified, setVerified] = useState(false);
  const citations = ragQuery('alavancagem').citations;

  const current = sections ?? query.data?.sections ?? [];

  function update(id: string, body: string) {
    setSections(current.map((section) => (section.id === id ? { ...section, body } : section)));
    setVerified(false);
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F03-US-FE-01"
      title="Revisão da minuta de parecer"
      description="Editor da minuta gerada pelo copiloto, com seções navegáveis, marcação inline das citações, aviso de afirmação não verificada e envio para alçada apenas após verificação de guardrails."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/pareceres/:opinionId/editor
        </Badge>,
      ]}
      actions={
        <>
          <Button
            size="sm"
            variant="secondary"
            icon={<ShieldCheck size={16} aria-hidden="true" />}
            disabled={current.length === 0}
            onClick={() => {
              setVerified(true);
              toast.success('Verificação concluída', '2 achados médios, nenhum crítico');
              navigate(`/pj/pareceres/${AURORA.opinionId}/verificacao`);
            }}
          >
            Verificar
          </Button>
          <Button
            size="sm"
            icon={<Send size={16} aria-hidden="true" />}
            disabled={!verified}
            onClick={() => {
              toast.success('Parecer submetido', 'POST /api/v1/pj/opinions/{id}/submit');
              navigate('/pj/pareceres/aprovacao');
            }}
          >
            Submeter à alçada
          </Button>
        </>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'A minuta deste parecer ainda não foi gerada.',
          description:
            'O copiloto monta a minuta a partir da extração conferida e do acervo indexado. Rode a geração para ter seções editáveis nesta tela.',
        }}
      >
        {(data) => {
          const list = sections ?? data.sections;
          const unverified = list.filter((section) => section.unverified);
          const generationSeconds = data.generationMs / 1000;
          return (
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={`${formatNumber(generationSeconds)} s`}
                  label="Tempo de geração"
                  tone={generationSeconds <= SLA_SECONDS ? 'success' : 'danger'}
                  hint={`SLA de ${SLA_SECONDS} s`}
                  icon={<Timer size={18} aria-hidden="true" />}
                />
                <Metric value={list.length} label="Seções da minuta" />
                <Metric
                  value={formatCurrency(data.suggestedLimit, 0)}
                  label="Limite sugerido"
                  tone="action"
                  hint={`solicitado ${formatCurrency(data.requestedLimit, 0)}`}
                />
                <Metric
                  value={unverified.length}
                  label="Seções sem lastro"
                  tone={unverified.length ? 'danger' : 'success'}
                />
              </div>

              <ProgressBar
                label={`Orçamento de tempo do SLA (${formatNumber(generationSeconds)} s de ${SLA_SECONDS} s)`}
                value={(generationSeconds / SLA_SECONDS) * 100}
                tone={generationSeconds <= SLA_SECONDS ? 'success' : 'danger'}
              />

              {unverified.length ? (
                <Notice
                  tone="warning"
                  title={`${unverified.length} seção sem citação de origem`}
                  actions={
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<RefreshCw size={14} aria-hidden="true" />}
                      onClick={() => toast.info('Regeração solicitada', 'POST /api/v1/pj/opinions')}
                    >
                      Regerar seção
                    </Button>
                  }
                >
                  Seções sem lastro documental não podem ser submetidas: cite a fonte indexada ou
                  remova a afirmação quantitativa.
                </Notice>
              ) : null}

              {verified ? (
                <Notice tone="success" title="Minuta verificada">
                  Guardrails executados após a última edição. Envio à alçada liberado.
                </Notice>
              ) : (
                <Notice tone="info" title="Verificação pendente">
                  Toda edição invalida a verificação anterior. Rode os guardrails antes de submeter.
                </Notice>
              )}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_20rem]">
                <Card>
                  <CardHeader
                    eyebrow={`parecer ${data.opinionId}`}
                    title={data.razaoSocial}
                    description={`CNPJ ${data.cnpj} · gerado em ${formatDateTime(data.generatedAt)} pelo modelo ${data.model}`}
                  />
                  <Tabs
                    items={list.map((section) => ({
                      id: section.id,
                      label: section.title,
                      badge: section.unverified ? <Badge tone="warning">sem lastro</Badge> : undefined,
                      content: (
                        <div className="grid gap-3">
                          <TextAreaField
                            label={section.title}
                            value={section.body}
                            onChange={(event) => update(section.id, event.target.value)}
                            rows={8}
                            hint="Edições ficam registradas na trilha do parecer com autor e horário."
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-eqx-text-muted">
                              Citações vinculadas
                            </span>
                            {section.citations.length ? (
                              section.citations.map((id) => {
                                const found = citations.find((item) => item.citationId === id);
                                return (
                                  <Badge key={id} tone="info" className="font-mono">
                                    {found ? `${found.docName} p.${found.page}` : id}
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge tone="warning">nenhuma citação</Badge>
                            )}
                          </div>
                        </div>
                      ),
                    }))}
                  />
                </Card>

                <div className="grid content-start gap-4">
                  <Card accent="brand">
                    <CardHeader eyebrow="acervo citável" title="Trechos disponíveis" />
                    <ul className="grid gap-3">
                      {citations.map((item) => (
                        <li key={item.citationId} className="rounded-md border border-eqx-border p-3">
                          <p className="text-xs font-semibold">
                            {item.docName} · p.{item.page}
                          </p>
                          <p className="mt-1 text-xs italic text-eqx-text-muted">“{item.excerpt}”</p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card>
                    <CardHeader eyebrow="autoria" title="Responsabilidade" />
                    <p className="text-sm text-eqx-text-muted">
                      A minuta é insumo. O parecer final é de responsabilidade do analista{' '}
                      <strong>{data.analyst}</strong>, que assina o documento submetido à alçada.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
