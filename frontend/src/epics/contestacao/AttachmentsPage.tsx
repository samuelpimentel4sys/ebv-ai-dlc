import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileArchive, FileImage, FileText, ShieldCheck, Upload } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  EmptyState,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  TextAreaField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import { MARIA } from '@/app/story';
import { attachments, type Attachment } from '@/epics/contestacao/data';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

const MAX_KB = 10 * 1024;
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg'];

const scanTone = {
  limpo: 'success',
  analisando: 'info',
  bloqueado: 'danger',
} as const;

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return FileImage;
  if (mime === 'application/zip') return FileArchive;
  return FileText;
}

export function AttachmentsPage() {
  const params = useParams();
  const protocolo = params.protocolo ?? MARIA.disputeProtocol;
  const toast = useToast();
  const query = useMockQuery(() => attachments, {
    latency: 320,
    deps: [protocolo],
  });
  const { setData } = query;
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusNonce, setFocusNonce] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  // Anexo pertence a um protocolo: trocar de caso limpa a seleção e o rascunho.
  useEffect(() => {
    setSelected(null);
    setNote('');
    setErrors({});
  }, [protocolo]);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(formRef.current);
  }, [focusNonce]);

  function simulateUpload(mime: string, sizeKb: number, fileName: string) {
    const found: Record<string, string> = {};
    if (note.trim().length < 10) {
      found.note =
        'Descreva em poucas palavras o que o documento comprova (mínimo de 10 caracteres).';
    }
    if (!ACCEPTED.includes(mime)) {
      found.arquivo = `${fileName} está em formato ${mime}. Envie o documento em PDF, PNG ou JPEG.`;
    } else if (sizeKb > MAX_KB) {
      found.arquivo = `${fileName} tem ${formatNumber(sizeKb / 1024, 1)} MB. Reduza para até 10 MB ou divida o documento em partes.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusNonce((value) => value + 1);
      return;
    }

    const created: Attachment = {
      attachmentId: `att-${Math.random().toString(36).slice(2, 6)}`,
      fileName,
      mime,
      sizeKb,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'analista',
      scanStatus: 'analisando',
      description: note.trim(),
    };
    setData((list) => [created, ...list]);
    setNote('');
    setSelected(created.attachmentId);
    toast.success(
      'Upload concluído',
      `Arquivo em varredura antivírus (POST /api/v1/disputes/${protocolo}/attachments)`,
    );
    setTimeout(() => {
      setData((list) =>
        list.map((item) =>
          item.attachmentId === created.attachmentId ? { ...item, scanStatus: 'limpo' } : item,
        ),
      );
    }, 1_400);
  }

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F08-US-FE-01"
      title="Evidências da contestação"
      description="Cofre de documentos do caso: upload com validação de tipo e tamanho, varredura antivírus, pré-visualização com descrição e registro de quem anexou cada evidência."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          {protocolo}
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Este caso ainda não tem documentos.',
          description: `Nenhuma evidência foi anexada ao protocolo ${protocolo}. O comprovante do credor em PDF ou uma foto legível do documento já é suficiente para a análise seguir — e enquanto não houver documento, o prazo continua contando a favor do titular.`,
          action: (
            <Link
              to={`/titular/contestacoes/${protocolo}`}
              className={buttonClass('secondary', 'sm')}
            >
              Voltar ao acompanhamento
            </Link>
          ),
        }}
      >
        {(list) => {
          const current = list.find((item) => item.attachmentId === selected) ?? list[0];
          const totalKb = list.reduce((sum, item) => sum + item.sizeKb, 0);
          return (
            <div className="grid gap-5">
              {list.some((item) => item.scanStatus === 'bloqueado') ? (
                <Notice tone="danger" title="Arquivo bloqueado pelo antivírus">
                  Um dos anexos foi barrado na varredura e não pode ser aberto. Solicite reenvio ao
                  titular em formato PDF ou imagem.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric value={list.length} label="Evidências no caso" />
                <Metric
                  value={`${formatNumber(totalKb / 1024, 1)} MB`}
                  label="Volume armazenado"
                  hint="limite de 10 MB por arquivo"
                />
                <Metric
                  value={list.filter((item) => item.scanStatus === 'limpo').length}
                  label="Aprovadas na varredura"
                  tone="success"
                  icon={<ShieldCheck size={18} aria-hidden="true" />}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                <Card>
                  <CardHeader
                    eyebrow="upload"
                    title="Anexar nova evidência"
                    description="Tipos aceitos: PDF, PNG e JPEG. Tamanho máximo de 10 MB."
                  />
                  <div className="grid gap-4" ref={formRef}>
                    <TextAreaField
                      label="Descrição da evidência"
                      required
                      rows={3}
                      value={note}
                      error={errors.note}
                      onChange={(event) => {
                        setNote(event.target.value);
                        clearError('note');
                      }}
                      hint="Explique o que o documento comprova — o texto acompanha a trilha de auditoria."
                    />
                    <div className="grid gap-2 rounded-md border border-dashed border-eqx-border-strong p-5 text-center">
                      <Upload
                        size={22}
                        className="mx-auto text-eqx-text-muted"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-eqx-text-muted">
                        Arraste o arquivo ou use um dos exemplos abaixo para simular o upload.
                      </p>
                      {errors.arquivo ? (
                        <p role="alert" className="text-sm font-semibold text-eqx-danger">
                          {errors.arquivo}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            simulateUpload('application/pdf', 380, 'declaracao-quitacao.pdf')
                          }
                        >
                          PDF 380 KB
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => simulateUpload('image/png', 2_100, 'foto-documento.png')}
                        >
                          PNG 2,1 MB
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => simulateUpload('application/zip', 6_400, 'pacote.zip')}
                        >
                          ZIP (rejeitado)
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            simulateUpload('application/pdf', 14_800, 'dossie-grande.pdf')
                          }
                        >
                          PDF 14,8 MB (rejeitado)
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader
                    eyebrow="pré-visualização"
                    title={current?.fileName ?? 'Nenhuma evidência'}
                  />
                  {current ? (
                    <div className="grid gap-4">
                      <div className="grid h-40 place-items-center rounded-md border border-eqx-border bg-eqx-surface-subtle text-sm text-eqx-text-muted">
                        {current.scanStatus === 'bloqueado'
                          ? 'Pré-visualização indisponível: arquivo bloqueado'
                          : current.scanStatus === 'analisando'
                            ? 'Varredura antivírus em andamento…'
                            : `Pré-visualização de ${current.mime}`}
                      </div>
                      <KeyValueList
                        items={[
                          { label: 'Enviado por', value: current.uploadedBy },
                          {
                            label: 'Data',
                            value: formatDateTime(current.uploadedAt),
                          },
                          {
                            label: 'Tamanho',
                            value: `${formatNumber(current.sizeKb)} KB`,
                          },
                          {
                            label: 'Varredura',
                            value: (
                              <Badge tone={scanTone[current.scanStatus]}>
                                {current.scanStatus}
                              </Badge>
                            ),
                          },
                        ]}
                      />
                      <p className="text-sm text-eqx-text-muted">{current.description}</p>
                    </div>
                  ) : (
                    <EmptyState
                      title="Nenhuma evidência anexada"
                      description="Faça o upload de comprovantes para embasar a decisão da contestação."
                    />
                  )}
                </Card>
              </div>

              <Card>
                <CardHeader
                  eyebrow="GET /api/v1/disputes/{id}/attachments"
                  title={`Evidências do protocolo ${protocolo}`}
                />
                <ul className="grid gap-2">
                  {list.map((item) => {
                    const Icon = iconFor(item.mime);
                    const active = current?.attachmentId === item.attachmentId;
                    return (
                      <li key={item.attachmentId}>
                        <button
                          type="button"
                          onClick={() => setSelected(item.attachmentId)}
                          aria-current={active}
                          className={`flex min-h-target w-full flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors duration-fast ${
                            active
                              ? 'border-eqx-action bg-eqx-action/10'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle'
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate font-semibold">
                            {item.fileName}
                          </span>
                          <span className="tabular-nums text-eqx-text-muted">
                            {formatNumber(item.sizeKb)} KB
                          </span>
                          <Badge tone="neutral">{item.uploadedBy}</Badge>
                          <Badge tone={scanTone[item.scanStatus]}>{item.scanStatus}</Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
