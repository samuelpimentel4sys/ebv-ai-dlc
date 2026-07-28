import { useState } from 'react';
import { Eye, PenLine, ThumbsUp } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  Metric,
  Modal,
  Notice,
  ProgressBar,
  QueryBoundary,
  TextAreaField,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { reasonCodes, type ReasonCode } from '@/epics/explicabilidade/data';
import { createReasonLive, fetchReasonsLive } from '@/api/explainability';

const statusTone = {
  publicado: 'success',
  aprovacao: 'warning',
  rascunho: 'neutral',
} as const;

export function ReasonsCatalogPage() {
  const toast = useToast();
  const query = useDataQuery(() => reasonCodes, fetchReasonsLive, { latency: 320 });
  const [codes, setCodes] = useState<ReasonCode[] | null>(null);
  const [editing, setEditing] = useState<ReasonCode | null>(null);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<ReasonCode | null>(null);
  const [approving, setApproving] = useState<ReasonCode | null>(null);

  const rows = codes ?? query.data ?? [];
  const pending = rows.filter((row) => row.status !== 'publicado');

  function startEditing(row: ReasonCode) {
    setEditing(row);
    setDraft(row.titularLabel);
    setDraftError(null);
  }

  function submitDraft() {
    if (!editing) return;
    const text = draft.trim();
    if (text.length < 20) {
      setDraftError(
        'Escreva ao menos 20 caracteres explicando o motivo em linguagem do titular — o texto vai direto ao portal.',
      );
      document.querySelector<HTMLElement>('[name="reason-titular-label"]')?.focus();
      return;
    }
    if (/\bscore\b|percentil|modelo|variável/i.test(text)) {
      setDraftError(
        'Evite jargão de modelagem (score, percentil, variável). Descreva o fato que levou à recusa em linguagem comum.',
      );
      document.querySelector<HTMLElement>('[name="reason-titular-label"]')?.focus();
      return;
    }
    void (async () => {
      try {
        if (isLiveMode()) {
          await createReasonLive({
            code: editing.code,
            consumerText: text,
            analystText: editing.technicalLabel,
          });
          query.reload();
          setCodes(null);
        } else {
          setCodes(
            rows.map((row) =>
              row.code === editing.code
                ? {
                    ...row,
                    titularLabel: text,
                    status: 'aprovacao',
                    lastUpdatedAt: new Date().toISOString(),
                  }
                : row,
            ),
          );
        }
        toast.success('Texto enviado para aprovação', 'POST /api/v1/reasons');
        setEditing(null);
        setDraftError(null);
      } catch (error) {
        toast.error('Falha ao salvar motivo', errorMessage(error));
      }
    })();
  }

  const columns: Column<ReasonCode>[] = [
    {
      key: 'code',
      header: 'Código',
      width: '6rem',
      render: (row) => <code className="text-xs font-semibold">{row.code}</code>,
    },
    {
      key: 'technicalLabel',
      header: 'Regra técnica',
      render: (row) => <code className="text-xs text-eqx-text-muted">{row.technicalLabel}</code>,
    },
    {
      key: 'titularLabel',
      header: 'Texto exibido ao titular',
      render: (row) => <span className="text-sm">{row.titularLabel}</span>,
    },
    { key: 'category', header: 'Categoria', render: (row) => row.category },
    {
      key: 'readability',
      header: 'Legibilidade',
      render: (row) => (
        <ProgressBar
          label={`${row.readability}`}
          value={row.readability}
          tone={row.readability >= 70 ? 'success' : row.readability >= 60 ? 'warning' : 'danger'}
        />
      ),
      width: '10rem',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'lastUpdatedAt',
      header: 'Atualizado',
      render: (row) => formatDate(row.lastUpdatedAt),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye size={14} aria-hidden="true" />}
            onClick={() => setPreviewing(row)}
          >
            Prévia
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<PenLine size={14} aria-hidden="true" />}
            onClick={() => startEditing(row)}
          >
            Editar
          </Button>
          {row.status === 'aprovacao' ? (
            <Button size="sm" variant="secondary" onClick={() => setApproving(row)}>
              Aprovar
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F05-US-FE-01"
      title="Curadoria dos motivos de recusa"
      description="Catálogo que traduz regras técnicas em linguagem compreensível ao titular, com índice de legibilidade, prévia do texto no portal e fila de aprovação por compliance."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/motivos/catalogo
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhum motivo catalogado ainda.',
          description:
            'Enquanto o catálogo estiver vazio o portal mostra apenas o código técnico da regra. Cadastre o primeiro motivo para o titular receber uma explicação legível.',
        }}
      >
        {() => (
          <div className="grid gap-5">
            {pending.length ? (
              <Notice tone="warning" title={`${pending.length} textos aguardando publicação`}>
                Motivos em rascunho ou aprovação não são exibidos ao titular; o portal usa o texto
                publicado anterior até a aprovação.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={rows.length} label="Motivos catalogados" />
              <Metric
                value={rows.filter((row) => row.status === 'publicado').length}
                label="Publicados"
                tone="success"
              />
              <Metric value={pending.length} label="Em curadoria" tone="warning" />
              <Metric
                value={Math.round(
                  rows.reduce((sum, row) => sum + row.readability, 0) / Math.max(rows.length, 1),
                )}
                label="Legibilidade média"
                hint="Flesch adaptado; meta ≥ 70"
              />
            </div>

            <Card>
              <CardHeader
                eyebrow="catálogo"
                title="Motivos e textos ao titular"
                description="GET /api/v1/reasons · GET /api/v1/reasons/resolve/{decisionId}"
              />
              <DataTable
                caption="Catálogo de motivos de recusa"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.code}
              />
            </Card>
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title="Prévia no portal do titular"
        description="Como o texto aparece na tela de decisão do portal"
      >
        {previewing ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-eqx-border bg-eqx-surface-subtle p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-eqx-text-muted">
                Por que a solicitação não foi aprovada
              </p>
              <p className="mt-3 text-lg font-semibold">{previewing.titularLabel}</p>
              <p className="mt-3 text-sm text-eqx-text-muted">
                Você pode pedir revisão humana ou acompanhar as ações recomendadas para melhorar seu
                score.
              </p>
            </div>
            <Notice tone="info" title="Regra técnica correspondente">
              <code className="text-xs">{previewing.technicalLabel}</code>
            </Notice>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setDraftError(null);
        }}
        title={`Editar motivo ${editing?.code ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={submitDraft}>Enviar para aprovação</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <TextField label="Regra técnica" value={editing?.technicalLabel ?? ''} readOnly />
          <TextAreaField
            label="Texto exibido ao titular"
            name="reason-titular-label"
            required
            value={draft}
            error={draftError ?? undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setDraftError(null);
            }}
            hint="Evite jargão. Frases curtas, voz ativa, sem termos de modelagem estatística."
            rows={4}
          />
          <Notice tone="warning" title="Revisão obrigatória">
            Alterações em texto ao titular passam por compliance antes de ir ao portal.
          </Notice>
        </div>
      </Modal>

      <Modal
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        title={`Aprovar motivo ${approving?.code ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproving(null)}>
              Cancelar
            </Button>
            <Button
              icon={<ThumbsUp size={16} aria-hidden="true" />}
              onClick={() => {
                if (!approving) return;
                setCodes(
                  rows.map((row) =>
                    row.code === approving.code ? { ...row, status: 'publicado' } : row,
                  ),
                );
                toast.success('Motivo publicado no portal');
                setApproving(null);
              }}
            >
              Aprovar e publicar
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Texto proposto: <strong>{approving?.titularLabel}</strong>
        </p>
      </Modal>
    </ScreenLayout>
  );
}
