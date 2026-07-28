import { useState } from 'react';
import { FileUp, Lock, Trash2 } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  SelectField,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { AURORA } from '@/app/story';
import { library, type LibraryDocument } from '@/epics/copiloto-pj/data';

const indexTone = {
  indexado: 'success',
  indexando: 'info',
  falha: 'danger',
  nao_indexado: 'neutral',
} as const;

const typeLabel = {
  balanco: 'Balanço',
  dre: 'DRE',
  contrato: 'Contrato',
  certidao: 'Certidão',
  ata: 'Ata',
  outros: 'Outros',
} as const;

export function LibraryPage() {
  const toast = useToast();
  const query = useMockQuery(() => library, { latency: 340 });
  const [docs, setDocs] = useState<LibraryDocument[] | null>(null);
  const [type, setType] = useState('todos');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('balanco');
  const [removing, setRemoving] = useState<LibraryDocument | null>(null);

  const all = docs ?? query.data ?? [];

  const columns: Column<LibraryDocument>[] = [
    {
      key: 'name',
      header: 'Documento',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.name}</p>
          <p className="text-xs text-eqx-text-muted">
            <code>{row.docId}</code> · {formatNumber(row.sizeKb)} KB
          </p>
        </div>
      ),
    },
    { key: 'type', header: 'Tipo', render: (row) => typeLabel[row.type] },
    {
      key: 'indexStatus',
      header: 'Indexação',
      align: 'center',
      render: (row) => (
        <Badge tone={indexTone[row.indexStatus]}>{row.indexStatus.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'chunks',
      header: 'Trechos',
      align: 'right',
      numeric: true,
      render: (row) => (row.chunks ? formatNumber(row.chunks) : '—'),
    },
    {
      key: 'uploadedAt',
      header: 'Enviado',
      render: (row) => (
        <span title={`por ${row.uploadedBy}`}>{formatDateTime(row.uploadedAt)}</span>
      ),
    },
    {
      key: 'retentionUntil',
      header: 'Retenção até',
      render: (row) => formatDate(row.retentionUntil),
    },
    {
      key: 'legalHold',
      header: 'Bloqueio',
      align: 'center',
      render: (row) =>
        row.legalHold ? (
          <Badge tone="warning" icon={<Lock size={12} aria-hidden="true" />}>
            legal hold
          </Badge>
        ) : (
          <span className="text-xs text-eqx-text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Trash2 size={14} aria-hidden="true" />}
          disabled={row.legalHold}
          onClick={() => setRemoving(row)}
        >
          Excluir
        </Button>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F07-US-FE-01"
      title="Biblioteca de documentos do cliente"
      description="Acervo por CNPJ que alimenta a recuperação do copiloto: status de indexação, contagem de trechos, retenção, bloqueio jurídico e envio de novos documentos."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/:cnpj/biblioteca
        </Badge>,
      ]}
      actions={
        <Button
          size="sm"
          icon={<FileUp size={16} aria-hidden="true" />}
          onClick={() => setUploadOpen(true)}
        >
          Enviar documento
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Este CNPJ ainda não tem documentos no acervo.',
          description:
            'O copiloto só cita trechos de documentos indexados. Envie o balanço, a DRE ou o contrato de financiamento para que a recuperação passe a funcionar.',
          action: (
            <Button
              icon={<FileUp size={16} aria-hidden="true" />}
              onClick={() => setUploadOpen(true)}
            >
              Enviar documento
            </Button>
          ),
        }}
        noResults={{
          active: type !== 'todos',
          onClear: () => setType('todos'),
          description:
            'O filtro de tipo excluiu todos os documentos. Limpe o filtro para ver o acervo completo do CNPJ.',
        }}
      >
        {(documents) => {
          const list = docs ?? documents;
          const rows = list.filter((row) => type === 'todos' || row.type === type);
          return (
            <div className="grid gap-5">
              {list.some((row) => row.indexStatus === 'falha') ? (
                <Notice tone="danger" title="Falha de indexação">
                  Documentos com falha não participam da recuperação. Reenvie o arquivo ou verifique
                  se o PDF é digitalizado sem camada de texto.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={list.length} label="Documentos no acervo" />
                <Metric
                  value={list.filter((row) => row.indexStatus === 'indexado').length}
                  label="Indexados"
                  tone="success"
                />
                <Metric
                  value={formatNumber(list.reduce((sum, row) => sum + row.chunks, 0))}
                  label="Trechos recuperáveis"
                  tone="action"
                />
                <Metric
                  value={list.filter((row) => row.legalHold).length}
                  label="Sob legal hold"
                  tone="warning"
                  hint="exclusão bloqueada"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="acervo"
                  title={`CNPJ ${AURORA.documentMasked} · ${AURORA.shortName}`}
                  description="GET /api/v1/pj/library/{cnpj}"
                />
                <div className="mb-4 max-w-xs">
                  <SelectField
                    label="Tipo de documento"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    options={[
                      { value: 'todos', label: 'Todos os tipos' },
                      ...Object.entries(typeLabel).map(([value, label]) => ({ value, label })),
                    ]}
                  />
                </div>
                {rows.length === 0 ? (
                  <EmptyState
                    title="Nenhum documento deste tipo no acervo."
                    description="O acervo tem documentos de outros tipos. Limpe o filtro para ver todos ou envie um documento deste tipo."
                    action={
                      <Button variant="secondary" onClick={() => setType('todos')}>
                        Limpar filtro
                      </Button>
                    }
                  />
                ) : (
                  <DataTable
                    caption="Documentos da biblioteca do cliente"
                    columns={columns}
                    rows={rows}
                    rowKey={(row) => row.docId}
                    footer={`${rows.length} de ${list.length} documentos`}
                  />
                )}
              </Card>
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar documento ao acervo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={uploadName.trim().length === 0}
              onClick={() => {
                setDocs([
                  {
                    docId: `doc-${Math.random().toString(16).slice(2, 6)}`,
                    name: uploadName.endsWith('.pdf') ? uploadName : `${uploadName}.pdf`,
                    type: uploadType as LibraryDocument['type'],
                    sizeKb: 1_240,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'carla.ribeiro',
                    indexStatus: 'indexando',
                    chunks: 0,
                    legalHold: false,
                    retentionUntil: new Date(Date.now() + 5 * 365 * 86_400_000).toISOString(),
                  },
                  ...all,
                ]);
                setUploadName('');
                setUploadOpen(false);
                toast.success('Documento enviado', 'POST /api/v1/pj/library/documents');
              }}
            >
              Enviar e indexar
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <TextField
            label="Nome do arquivo"
            required
            value={uploadName}
            onChange={(event) => setUploadName(event.target.value)}
            placeholder="ex.: balanco-aurora-2026.pdf"
          />
          <SelectField
            label="Tipo"
            value={uploadType}
            onChange={(event) => setUploadType(event.target.value)}
            options={Object.entries(typeLabel).map(([value, label]) => ({ value, label }))}
          />
          <Notice tone="info" title="Indexação assíncrona">
            O documento fica disponível para consulta após a geração dos trechos, normalmente em menos
            de 2 minutos para arquivos de até 50 páginas.
          </Notice>
        </div>
      </Modal>

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Excluir ${removing?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!removing) return;
                setDocs(all.filter((row) => row.docId !== removing.docId));
                toast.success(
                  'Documento excluído',
                  `DELETE /api/v1/pj/library/documents/${removing.docId}`,
                );
                setRemoving(null);
              }}
            >
              Excluir definitivamente
            </Button>
          </>
        }
      >
        <p className="text-sm">
          A exclusão remove os trechos do índice e passa a valer para novas consultas. Pareceres já
          emitidos continuam citando o documento pelo identificador, com o conteúdo preservado no
          snapshot da decisão.
        </p>
      </Modal>
    </ScreenLayout>
  );
}
