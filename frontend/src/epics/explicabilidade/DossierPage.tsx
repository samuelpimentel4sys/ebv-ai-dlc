import { useState } from 'react';
import { Download, FileText, Stamp } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Metric,
  Notice,
  SelectField,
  Stepper,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { formatDateTime, formatNumber } from '@/lib/format';
import { dossierHistory, dossierSections, type DossierRecord } from '@/epics/explicabilidade/data';

const statusTone = {
  gerando: 'info',
  disponivel: 'success',
  expirado: 'neutral',
} as const;

export function DossierPage() {
  const toast = useToast();
  const [documento, setDocumento] = useState('12345678901');
  const [decisionId, setDecisionId] = useState('dec-2026-07-27-1104');
  const [format, setFormat] = useState('PDF');
  const [step, setStep] = useState(0);
  const [records, setRecords] = useState<DossierRecord[]>(dossierHistory);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const columns: Column<DossierRecord>[] = [
    {
      key: 'dossierId',
      header: 'Dossiê',
      render: (row) => <code className="text-xs font-semibold">{row.dossierId}</code>,
    },
    { key: 'documento', header: 'Titular', render: (row) => row.documento },
    {
      key: 'decisionId',
      header: 'Decisão',
      render: (row) => <code className="text-xs">{row.decisionId}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    { key: 'format', header: 'Formato', align: 'center', render: (row) => row.format },
    {
      key: 'sizeKb',
      header: 'Tamanho',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.sizeKb)} KB`,
    },
    { key: 'requestedAt', header: 'Solicitado em', render: (row) => formatDateTime(row.requestedAt) },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) =>
        row.status === 'disponivel' ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={14} aria-hidden="true" />}
            onClick={() =>
              toast.success('Download iniciado', `GET /api/v1/dossier/${row.dossierId}/download`)
            }
          >
            Baixar
          </Button>
        ) : (
          <span className="text-xs text-eqx-text-muted">indisponível</span>
        ),
    },
  ];

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const digits = documento.trim();
    if (!digits) {
      next.documento = 'Informe o documento do titular para localizar a decisão.';
    } else if (!/^\d+$/.test(digits)) {
      next.documento = 'Use apenas dígitos: remova pontos, barras e hífens do documento.';
    } else if (digits.length !== 11 && digits.length !== 14) {
      next.documento = 'Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.';
    }
    if (!decisionId.trim()) {
      next.decisionId = 'Informe o decision_id da decisão que motivou o pedido do titular.';
    } else if (!/^dec-\d{4}-\d{2}-\d{2}-\d{4}$/.test(decisionId.trim())) {
      next.decisionId = 'Use o formato dec-AAAA-MM-DD-HHMM, como dec-2026-07-27-1104.';
    }
    setErrors(next);
    const firstInvalid = next.documento ? 'documento' : next.decisionId ? 'decision-id' : null;
    if (firstInvalid) {
      document.querySelector<HTMLElement>(`[name="dossier-${firstInvalid}"]`)?.focus();
      return false;
    }
    return true;
  }

  function emit() {
    if (!validate()) return;
    const record: DossierRecord = {
      dossierId: `dos-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      documento: `${documento.slice(0, 3)}.***.**${documento.slice(9)}`,
      decisionId,
      requestedAt: new Date().toISOString(),
      status: 'disponivel',
      format: format as 'PDF' | 'JSON',
      sizeKb: format === 'PDF' ? 838 : 312,
      requestedBy: 'encarregado.dpo',
      expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
    setRecords([record, ...records]);
    setStep(2);
    toast.success('Dossiê emitido', 'POST /api/v1/dossier');
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F03-US-FE-01"
      title="Emissão de dossiê LGPD art. 20"
      description="Geração do dossiê de decisão automatizada exigido pelo art. 20 da LGPD, com pré-visualização das seções obrigatórias, controle de validade e histórico auditável de emissões."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/dossies/emissao
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Stepper
          currentIndex={step}
          steps={[
            { id: 'form', label: 'Identificar decisão', description: 'titular e decision_id' },
            { id: 'preview', label: 'Revisar conteúdo', description: '8 seções obrigatórias' },
            { id: 'issue', label: 'Emitir e entregar', description: 'link válido por 30 dias' },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              eyebrow="formulário"
              title="Dados da emissão"
              description="POST /api/v1/dossier"
            />
            <div className="grid gap-4">
              <TextField
                label="Documento do titular"
                name="dossier-documento"
                required
                value={documento}
                error={errors.documento}
                onChange={(event) => {
                  setDocumento(event.target.value);
                  clearError('documento');
                }}
                hint="CPF ou CNPJ apenas com dígitos"
              />
              <TextField
                label="decision_id"
                name="dossier-decision-id"
                required
                value={decisionId}
                error={errors.decisionId}
                onChange={(event) => {
                  setDecisionId(event.target.value);
                  clearError('decisionId');
                }}
              />
              <SelectField
                label="Formato"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                options={[
                  { value: 'PDF', label: 'PDF assinado digitalmente' },
                  { value: 'JSON', label: 'JSON estruturado (portabilidade)' },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={<FileText size={16} aria-hidden="true" />}
                  onClick={() => setStep(1)}
                >
                  Pré-visualizar
                </Button>
                <Button icon={<Stamp size={16} aria-hidden="true" />} onClick={emit}>
                  Emitir dossiê
                </Button>
              </div>
            </div>
          </Card>

          <Card accent="brand">
            <CardHeader
              eyebrow="pré-visualização"
              title="Seções obrigatórias do dossiê"
              description="Conteúdo montado a partir da decisão, dos fatores e dos contrafactuais."
            />
            <ol className="grid gap-2">
              {dossierSections.map((section, index) => (
                <li
                  key={section}
                  className="flex items-start gap-3 rounded-md border border-eqx-border px-3 py-2 text-sm"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-eqx-brand text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {section}
                </li>
              ))}
            </ol>
            <Notice tone="info" className="mt-4" title="Prazo legal">
              A resposta ao titular deve ocorrer em até 15 dias corridos, prorrogáveis de forma
              justificada.
            </Notice>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric value={records.length} label="Dossiês na janela" />
          <Metric
            value={records.filter((item) => item.status === 'disponivel').length}
            label="Disponíveis para download"
            tone="success"
          />
          <Metric
            value={records.filter((item) => item.status === 'expirado').length}
            label="Expirados"
            hint="links com validade de 30 dias"
          />
        </div>

        <Card>
          <CardHeader
            eyebrow="histórico"
            title="Emissões registradas"
            description="GET /api/v1/dossier/{dossierId}"
          />
          <DataTable
            caption="Histórico de dossiês emitidos"
            columns={columns}
            rows={records}
            rowKey={(row) => row.dossierId}
          />
        </Card>
      </div>
    </ScreenLayout>
  );
}
