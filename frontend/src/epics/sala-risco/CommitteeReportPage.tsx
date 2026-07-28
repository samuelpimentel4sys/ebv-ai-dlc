import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, FileDown, FileStack } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Metric,
  Notice,
  QueryBoundary,
  Stepper,
  TextField,
  useToast,
} from '@/ds';
import { isLiveMode } from '@/lib/config';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { createCommitteeReportLive, downloadReportLive } from '@/api/portfolio';
import { formatNumber } from '@/lib/format';
import { reportSections, stressScenarios } from '@/epics/sala-risco/data';
import { cn } from '@/lib/cn';

/** A seção de estresse é incluída por padrão quando o cenário chega pela trilha do console. */
const STRESS_SECTION_ID = 'estresse';

export function CommitteeReportPage() {
  const toast = useToast();
  const query = useDataQuery(() => reportSections, async () => reportSections, { latency: 300 });
  const [params] = useSearchParams();
  const scenarioId = params.get('cenario');
  const scenario = scenarioId
    ? (stressScenarios.find((item) => item.id === scenarioId) ?? null)
    : null;

  const [selected, setSelected] = useState<string[] | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [watermark, setWatermark] = useState('Confidencial · Comitê de Risco · 28/07/2026');
  const [recipient, setRecipient] = useState('comite.risco@equifax.com.br');
  const [generated, setGenerated] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function toggle(id: string, sectionIds: string[], required: boolean) {
    if (required) {
      toast.info('Seção obrigatória', 'Não pode ser removida do dossiê de comitê');
      return;
    }
    setSelected((current) => {
      const list = current ?? sectionIds;
      return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
    });
    setGenerated(false);
  }

  function move(id: string, direction: -1 | 1, sectionIds: string[]) {
    setOrder((current) => {
      const list = current ?? sectionIds;
      const index = list.indexOf(id);
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setGenerated(false);
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F08-US-FE-01"
      title="Montagem do dossiê de comitê"
      description="Montagem do documento levado ao comitê de risco: seleção e ordenação das seções, marca d'água de confidencialidade, destinatário nominal e geração do arquivo com aviso quando estiver pronto."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/dossie-comite
        </Badge>,
        ...(scenario
          ? [
              <Badge key="scenario" tone="info">
                cenário {scenario.name}
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
          title: 'Nenhuma seção está habilitada para o dossiê.',
          description:
            'O modelo do dossiê de comitê não tem seções publicadas, então não há o que montar. Peça a publicação do modelo à secretaria do comitê antes da reunião.',
        }}
      >
        {(sections) => {
          const sectionIds = sections.map((section) => section.id);
          const currentOrder = order ?? sectionIds;
          const defaultSelected = sections
            .filter(
              (section) => section.required || (scenario && section.id === STRESS_SECTION_ID),
            )
            .map((section) => section.id);
          const currentSelected = selected ?? defaultSelected;
          const ordered = currentOrder
            .map((id) => sections.find((section) => section.id === id))
            .filter((section): section is (typeof sections)[number] => Boolean(section))
            .filter((section) => currentSelected.includes(section.id));
          const pages = ordered.reduce((sum, section) => sum + section.pages, 0);

          return (
            <div className="grid gap-5">
              <Stepper
                currentIndex={generated ? 2 : 1}
                steps={[
                  {
                    id: 'sections',
                    label: 'Selecionar seções',
                    description: `${ordered.length} escolhidas`,
                  },
                  {
                    id: 'identify',
                    label: 'Identificar documento',
                    description: 'marca d\u2019água e destinatário',
                  },
                  { id: 'generate', label: 'Gerar dossiê', description: `${pages} páginas` },
                ]}
              />

              {scenario ? (
                <Notice
                  tone="info"
                  title={`Cenário ${scenario.name} veio do console de estresse`}
                  actions={
                    <Link
                      to={`/risco/carteira/estresse?cenario=${scenario.id}`}
                      className={buttonClass('ghost', 'sm')}
                    >
                      Rever execução
                    </Link>
                  }
                >
                  {scenario.description} A seção &ldquo;Resultados de estresse&rdquo; já entra
                  marcada e será citada no sumário do dossiê.
                </Notice>
              ) : null}

              {generated ? (
                <Notice
                  tone="success"
                  title="Dossiê pronto para download"
                  actions={
                    <Button
                      size="sm"
                      icon={<FileDown size={16} aria-hidden="true" />}
                      onClick={() => {
                        void (async () => {
                          try {
                            if (isLiveMode() && reportId) {
                              const dl = await downloadReportLive(reportId);
                              toast.success('Download iniciado', dl.downloadUrl);
                              return;
                            }
                            toast.success('Download iniciado', 'Arquivo válido por 24 horas');
                          } catch (error) {
                            toast.error('Falha no download', errorMessage(error));
                          }
                        })();
                      }}
                    >
                      Baixar PDF
                    </Button>
                  }
                >
                  {ordered.length} seções, {pages} páginas, marca d&apos;água aplicada em todas as
                  páginas. Cada download é registrado com identidade do solicitante.
                </Notice>
              ) : (
                <Notice tone="info" title="Documento confidencial">
                  O dossiê recebe marca d&apos;água com destinatário nominal para permitir rastreio
                  em caso de vazamento.
                </Notice>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric value={ordered.length} label="Seções incluídas" />
                <Metric value={formatNumber(pages)} label="Páginas estimadas" tone="action" />
                <Metric
                  value={sections.filter((section) => section.required).length}
                  label="Seções obrigatórias"
                  hint="não podem ser removidas"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader
                    eyebrow="conteúdo"
                    title="Seções do dossiê"
                    description="Use as setas para definir a ordem de apresentação."
                    actions={<FileStack size={18} aria-hidden="true" />}
                  />
                  <ul className="grid gap-2">
                    {currentOrder.map((id) => {
                      const section = sections.find((item) => item.id === id);
                      if (!section) return null;
                      const active = currentSelected.includes(id);
                      return (
                        <li
                          key={id}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2',
                            active ? 'border-eqx-action bg-eqx-action/5' : 'border-eqx-border',
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{section.title}</p>
                              {section.required ? <Badge tone="warning">obrigatória</Badge> : null}
                              <Badge tone="neutral">{section.pages} pág.</Badge>
                              {scenario && section.id === STRESS_SECTION_ID ? (
                                <Badge tone="info">cenário {scenario.name}</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-eqx-text-muted">{section.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Mover ${section.title} para cima`}
                              icon={<ArrowUp size={14} aria-hidden="true" />}
                              onClick={() => move(id, -1, sectionIds)}
                            >
                              <span className="visually-hidden">Subir</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Mover ${section.title} para baixo`}
                              icon={<ArrowDown size={14} aria-hidden="true" />}
                              onClick={() => move(id, 1, sectionIds)}
                            >
                              <span className="visually-hidden">Descer</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={active ? 'secondary' : 'primary'}
                              onClick={() =>
                                toggle(id, currentSelected, Boolean(section.required))
                              }
                            >
                              {active ? 'Remover' : 'Incluir'}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>

                <div className="grid content-start gap-4">
                  <Card>
                    <CardHeader eyebrow="identificação" title="Marca d'água e destinatário" />
                    <div className="grid gap-4">
                      <TextField
                        label="Texto da marca d'água"
                        required
                        value={watermark}
                        onChange={(event) => {
                          setWatermark(event.target.value);
                          setGenerated(false);
                        }}
                      />
                      <TextField
                        label="Destinatário"
                        required
                        type="email"
                        value={recipient}
                        onChange={(event) => {
                          setRecipient(event.target.value);
                          setGenerated(false);
                        }}
                        hint="Aparece em todas as páginas junto à marca d'água."
                      />
                      <Button
                        loading={generating}
                        onClick={() => {
                          if (!watermark.trim() || !recipient.includes('@')) {
                            toast.error(
                              'Dados incompletos',
                              'Informe marca d\u2019água e destinatário válido',
                            );
                            return;
                          }
                          void (async () => {
                            setGenerating(true);
                            try {
                              if (isLiveMode()) {
                                const created = await createCommitteeReportLive({
                                  title: `Dossiê comitê · ${recipient}`,
                                  watermarkTo: `${watermark} · ${recipient}`,
                                  sections: ordered,
                                  analysisRef: scenario?.id ?? 'lab-ref',
                                });
                                setReportId(created.reportId);
                              }
                              setGenerated(true);
                              toast.success('Dossiê gerado', 'POST /api/v1/portfolio/reports');
                            } catch (error) {
                              toast.error('Falha ao gerar dossiê', errorMessage(error));
                            } finally {
                              setGenerating(false);
                            }
                          })();
                        }}
                      >
                        Gerar dossiê
                      </Button>
                    </div>
                  </Card>

                  <Card accent="brand">
                    <CardHeader eyebrow="pré-visualização" title="Estrutura do documento" />
                    <div className="rounded-md border border-eqx-border bg-eqx-surface-subtle p-4">
                      <p className="text-center text-xs uppercase tracking-[0.2em] text-eqx-text-muted">
                        {watermark || 'marca d\u2019água'}
                      </p>
                      <ol className="mt-4 grid gap-1 text-sm">
                        {ordered.map((section, index) => (
                          <li key={section.id} className="flex justify-between gap-3">
                            <span>
                              {index + 1}. {section.title}
                              {scenario && section.id === STRESS_SECTION_ID
                                ? ` — ${scenario.name}`
                                : ''}
                            </span>
                            <span className="tabular-nums text-eqx-text-muted">
                              {section.pages} pág.
                            </span>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-4 text-right text-xs text-eqx-text-muted">
                        destinatário: {recipient || '—'}
                      </p>
                    </div>
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
