import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, PencilLine } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  KeyValueList,
  Metric,
  Modal,
  Notice,
  ProgressBar,
  QueryBoundary,
  TextField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatPercent } from '@/lib/format';
import { AURORA } from '@/app/story';
import { extraction, type ExtractedField } from '@/epics/copiloto-pj/data';
import { cn } from '@/lib/cn';

const LOW_CONFIDENCE = 0.8;

function confidenceTone(value: number) {
  if (value >= 0.9) return 'success' as const;
  if (value >= LOW_CONFIDENCE) return 'warning' as const;
  return 'danger' as const;
}

export function ExtractionReviewPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const query = useMockQuery(() => extraction, { latency: 420 });
  const [fields, setFields] = useState<ExtractedField[] | null>(null);
  const [editing, setEditing] = useState<ExtractedField | null>(null);
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(4);

  const current = fields ?? query.data?.fields ?? [];
  const lowConfidence = current.filter((field) => field.confidence < LOW_CONFIDENCE);

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F01-US-FE-01"
      title="Conferência da extração de demonstrativos"
      description="Visão dividida entre o PDF original e os campos extraídos, com destaque para baixa confiança do OCR, correção manual campo a campo e liberação para cálculo de índices."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/documentos/:docId/conferencia
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          icon={<CheckCircle2 size={16} aria-hidden="true" />}
          disabled={lowConfidence.length > 0 || current.length === 0}
          onClick={() => {
            toast.success('Extração aprovada', 'Campos liberados para cálculo de índices');
            navigate(`/pj/${AURORA.document}/indices?documento=${AURORA.documentId}`);
          }}
        >
          Aprovar extração
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'O OCR não devolveu campos para este documento.',
          description:
            'Sem campos extraídos não há o que conferir. Envie um PDF com camada de texto ou solicite reprocessamento do documento na biblioteca do cliente.',
        }}
      >
        {(data) => {
          const list = fields ?? data.fields;
          const low = list.filter((field) => field.confidence < LOW_CONFIDENCE);
          const groups = [...new Set(list.map((field) => field.group))];
          return (
            <div className="grid gap-5">
              {low.length ? (
                <Notice
                  tone="warning"
                  title={`${low.length} campos com confiança abaixo de ${formatPercent(LOW_CONFIDENCE * 100, 0)}`}
                >
                  Confirme ou corrija cada campo destacado antes de aprovar. Índices que dependem
                  desses campos ficam marcados como não calculáveis.
                </Notice>
              ) : (
                <Notice tone="success" title="Todos os campos conferidos">
                  A extração está pronta para alimentar o cálculo de índices financeiros.
                </Notice>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={list.length} label="Campos extraídos" />
                <Metric value={low.length} label="Baixa confiança" tone="warning" />
                <Metric
                  value={list.filter((field) => field.corrected).length}
                  label="Corrigidos manualmente"
                  tone="action"
                />
                <Metric
                  value={formatPercent(
                    (list.reduce((sum, field) => sum + field.confidence, 0) / list.length) * 100,
                    1,
                  )}
                  label="Confiança média"
                  hint={`motor ${data.ocrEngine}`}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <Card>
                  <CardHeader
                    eyebrow="documento original"
                    title={data.fileName}
                    description={`${data.pages} páginas · enviado em ${formatDateTime(data.uploadedAt)}`}
                    actions={<FileText size={18} aria-hidden="true" />}
                  />
                  <div className="mb-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPage((value) => Math.max(value - 1, 1))}
                      disabled={page <= 1}
                    >
                      Página anterior
                    </Button>
                    <span className="text-sm tabular-nums">
                      {page} / {data.pages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPage((value) => Math.min(value + 1, data.pages))}
                      disabled={page >= data.pages}
                    >
                      Próxima
                    </Button>
                  </div>
                  <div
                    className="grid min-h-[22rem] place-items-center rounded-md border border-dashed border-eqx-border bg-eqx-surface-subtle p-6 text-center"
                    role="img"
                    aria-label={`Pré-visualização da página ${page} do documento ${data.fileName}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">Página {page}</p>
                      <p className="mt-2 max-w-[24rem] text-sm text-eqx-text-muted">
                        O visualizador real renderiza o PDF com realce da região de cada campo
                        extraído. Aqui a região é representada pela lista lateral, que indica a página
                        de origem.
                      </p>
                      <ul className="mt-4 grid gap-1 text-left text-xs">
                        {list
                          .filter((field) => field.page === page)
                          .map((field) => (
                            <li key={field.id} className="rounded-sm bg-eqx-accent/15 px-2 py-1">
                              {field.label}: <strong>{field.value}</strong>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader
                    eyebrow="campos extraídos"
                    title="Conferência campo a campo"
                    description="GET /api/v1/pj/documents/{docId}/extraction"
                  />
                  <KeyValueList
                    items={[
                      { label: 'CNPJ', value: data.cnpj },
                      { label: 'Razão social', value: data.razaoSocial },
                    ]}
                  />
                  <div className="mt-4 grid gap-4">
                    {groups.map((group) => (
                      <section key={group}>
                        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-eqx-text-muted">
                          {group}
                        </h3>
                        <ul className="grid gap-2">
                          {list
                            .filter((field) => field.group === group)
                            .map((field) => (
                              <li
                                key={field.id}
                                className={cn(
                                  'flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2',
                                  field.confidence < LOW_CONFIDENCE
                                    ? 'border-eqx-warning bg-eqx-warning-bg/40'
                                    : 'border-eqx-border',
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">{field.label}</p>
                                  <p className="text-sm tabular-nums">{field.value}</p>
                                  <button
                                    type="button"
                                    onClick={() => setPage(field.page)}
                                    className="inline-flex min-h-target items-center text-xs text-eqx-action underline"
                                  >
                                    ver na página {field.page}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  {field.corrected ? <Badge tone="info">corrigido</Badge> : null}
                                  <Badge tone={confidenceTone(field.confidence)}>
                                    {formatPercent(field.confidence * 100, 0)}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    icon={<PencilLine size={14} aria-hidden="true" />}
                                    onClick={() => {
                                      setEditing(field);
                                      setDraft(field.value);
                                    }}
                                  >
                                    Corrigir
                                  </Button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                  <ProgressBar
                    className="mt-5"
                    label="Campos com confiança adequada"
                    value={((list.length - low.length) / list.length) * 100}
                    tone={low.length === 0 ? 'success' : 'warning'}
                  />
                </Card>
              </div>
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Corrigir ${editing?.label ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editing) return;
                setFields(
                  current.map((field) =>
                    field.id === editing.id
                      ? { ...field, value: draft, confidence: 1, corrected: true }
                      : field,
                  ),
                );
                toast.success('Campo corrigido', 'PATCH /api/v1/pj/documents/{docId}/correct');
                setEditing(null);
              }}
            >
              Salvar correção
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <TextField
            label="Valor conferido"
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            hint={`Extraído da página ${editing?.page ?? '—'} com confiança de ${formatPercent(
              (editing?.confidence ?? 0) * 100,
              0,
            )}.`}
          />
          <Notice tone="info" title="Rastreabilidade">
            A correção é registrada com autor e horário, e o valor original permanece disponível na
            trilha do documento.
          </Notice>
        </div>
      </Modal>
    </ScreenLayout>
  );
}
