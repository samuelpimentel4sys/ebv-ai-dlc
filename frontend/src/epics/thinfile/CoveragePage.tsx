import { useState } from 'react';
import { Database, RefreshCw, TriangleAlert } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  ingestBatches,
  partnerCoverage,
  qualityDimensions,
  type IngestBatch,
  type PartnerCoverage,
} from '@/epics/thinfile/data';

const statusTone = {
  ativo: 'success',
  degradado: 'warning',
  suspenso: 'danger',
} as const;
const batchTone = {
  processado: 'success',
  processando: 'info',
  com_erros: 'danger',
} as const;

const ALL = 'todos';

export function CoveragePage() {
  const toast = useToast();
  const [nonce, setNonce] = useState(0);
  const [status, setStatus] = useState(ALL);
  const query = useMockQuery(
    () => ({
      partners: partnerCoverage.filter((item) => status === ALL || item.status === status),
      quality: qualityDimensions,
      batches: ingestBatches,
    }),
    {
      latency: 380,
      deps: [nonce, status],
      isEmpty: (data) => data.partners.length === 0,
    },
  );
  const [detail, setDetail] = useState<PartnerCoverage | null>(null);

  const partnerColumns: Column<PartnerCoverage>[] = [
    {
      key: 'name',
      header: 'Parceiro',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-eqx-text-muted">
            {row.category} · {row.region}
          </p>
        </div>
      ),
    },
    {
      key: 'coveragePct',
      header: 'Cobertura',
      render: (row) => (
        <ProgressBar
          label={`${formatNumber(row.coveragePct, 1)}% da base regional`}
          value={row.coveragePct}
          tone={row.coveragePct >= 60 ? 'success' : row.coveragePct >= 40 ? 'warning' : 'danger'}
        />
      ),
    },
    {
      key: 'records',
      header: 'Registros',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.records),
    },
    {
      key: 'qualityScore',
      header: 'Qualidade',
      align: 'right',
      numeric: true,
      render: (row) => (
        <Badge
          tone={row.qualityScore >= 90 ? 'success' : row.qualityScore >= 80 ? 'warning' : 'danger'}
        >
          {row.qualityScore}
        </Badge>
      ),
    },
    {
      key: 'lastIngestAt',
      header: 'Último lote',
      render: (row) => formatDateTime(row.lastIngestAt),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
  ];

  const batchColumns: Column<IngestBatch>[] = [
    {
      key: 'batchId',
      header: 'Lote',
      render: (row) => <code className="text-xs">{row.batchId}</code>,
    },
    {
      key: 'receivedAt',
      header: 'Recebido',
      render: (row) => formatDateTime(row.receivedAt),
    },
    {
      key: 'records',
      header: 'Registros',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.records),
    },
    {
      key: 'rejected',
      header: 'Rejeitados',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.rejected / row.records > 0.05 ? 'font-semibold text-eqx-danger' : undefined
          }
        >
          {formatNumber(row.rejected)} ({formatNumber((row.rejected / row.records) * 100, 1)}%)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={batchTone[row.status]}>{row.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'rejectReason',
      header: 'Motivo predominante',
      render: (row) => row.rejectReason ?? '—',
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F01-US-FE-01"
      title="Cobertura de dados alternativos por parceiro"
      description="Monitor das parcerias de dados de consumo: cobertura da base por região, índice de qualidade por dimensão, lotes recebidos e rejeições que impedem o cálculo do score thin-file."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Thin-file
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /thinfile/cobertura
        </Badge>,
      ]}
      actions={
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          onClick={() => {
            setNonce((value) => value + 1);
            toast.info('Ingestão solicitada', 'POST /api/v1/alternative-data/ingest');
          }}
        >
          Solicitar ingestão
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum parceiro de dados alternativos está conectado.',
          description:
            'Sem parceiro ativo não há sinal de consumo para o modelo thin-file, e a população sem histórico bancário volta a ser avaliada apenas pela política tradicional. Reative um contrato de ingestão para restabelecer a cobertura.',
        }}
        noResults={{
          active: status !== ALL,
          description:
            'Nenhum parceiro está nessa situação agora. Volte para todas as situações para ver a carteira completa.',
          onClear: () => setStatus(ALL),
        }}
      >
        {(data) => {
          const records = data.partners.reduce((sum, item) => sum + item.records, 0);
          const weighted =
            records > 0
              ? data.partners.reduce((sum, item) => sum + item.coveragePct * item.records, 0) /
                records
              : 0;
          const active = data.partners.filter((item) => item.status === 'ativo').length;

          return (
            <div className="grid gap-5">
              {data.partners.some((item) => item.status === 'suspenso') ? (
                <Notice tone="danger" title="Parceiro suspenso reduz cobertura no Nordeste">
                  A Rede Imobiliária Aluguel Fácil está suspensa por falha de layout desde 18/07.
                  Sinais de aluguel formal deixaram de alimentar o modelo na região.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={`${formatNumber(weighted, 1)}%`}
                  label="Cobertura ponderada"
                  icon={<Database size={18} aria-hidden="true" />}
                  hint="média ponderada por volume de registros"
                />
                <Metric value={formatNumber(records)} label="Registros disponíveis" />
                <Metric
                  value={`${active}/${data.partners.length}`}
                  label="Parceiros ativos"
                  tone={active === data.partners.length ? 'success' : 'warning'}
                />
                <Metric
                  value={data.batches.filter((item) => item.status === 'com_erros').length}
                  label="Lotes com erro (24 h)"
                  tone="danger"
                  icon={<TriangleAlert size={18} aria-hidden="true" />}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/alternative-data/quality"
                    title="Qualidade por dimensão"
                    description="Comparação do índice observado com a meta contratual."
                  />
                  <div className="grid gap-4">
                    {data.quality.map((dimension) => (
                      <div key={dimension.dimension}>
                        <ProgressBar
                          label={`${dimension.dimension} — meta ${dimension.target}`}
                          value={dimension.score}
                          tone={dimension.score >= dimension.target ? 'success' : 'warning'}
                        />
                        <p className="mt-1 text-xs text-eqx-text-muted">{dimension.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <CardHeader
                    eyebrow="distribuição"
                    title="Cobertura por categoria de dado"
                    description="Percentual da base coberto por cada tipo de fonte alternativa."
                  />
                  <BarChart
                    ariaLabel="Cobertura por categoria de dado alternativo"
                    unit="%"
                    digits={1}
                    data={data.partners.map((partner) => ({
                      label: `${partner.category} · ${partner.region}`,
                      value: partner.coveragePct,
                      tone:
                        partner.status === 'suspenso'
                          ? 'danger'
                          : partner.status === 'degradado'
                            ? 'warning'
                            : 'action',
                      hint: `${formatNumber(partner.records)} registros`,
                    }))}
                  />
                </Card>
              </div>

              <Card>
                <CardHeader
                  eyebrow="GET /api/v1/alternative-data/coverage"
                  title="Parceiros de dados"
                  description="Selecione um parceiro para ver os lotes e as rejeições do período."
                  actions={
                    <div className="w-48">
                      <SelectField
                        label="Situação"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        options={[
                          { value: ALL, label: 'Todas as situações' },
                          { value: 'ativo', label: 'Ativos' },
                          { value: 'degradado', label: 'Degradados' },
                          { value: 'suspenso', label: 'Suspensos' },
                        ]}
                      />
                    </div>
                  }
                />
                <DataTable
                  caption="Cobertura por parceiro de dados alternativos"
                  columns={partnerColumns}
                  rows={data.partners}
                  rowKey={(row) => row.partnerId}
                  onRowClick={setDetail}
                />
              </Card>

              <Card>
                <CardHeader eyebrow="ingestão" title="Lotes recebidos nas últimas 48 horas" />
                <DataTable
                  caption="Lotes de ingestão"
                  columns={batchColumns}
                  rows={data.batches}
                  rowKey={(row) => row.batchId}
                  footer="Rejeições acima de 5% acionam revisão de layout com o parceiro."
                />
              </Card>
            </div>
          );
        }}
      </QueryBoundary>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        description="Detalhe de cobertura e qualidade do parceiro"
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Categoria', value: detail.category },
                { label: 'Região', value: detail.region },
                {
                  label: 'Cobertura',
                  value: `${formatNumber(detail.coveragePct, 1)}%`,
                },
                { label: 'Registros', value: formatNumber(detail.records) },
                { label: 'Índice de qualidade', value: detail.qualityScore },
                {
                  label: 'Último lote',
                  value: formatDateTime(detail.lastIngestAt),
                },
              ]}
            />
            <section>
              <h3 className="mb-2 text-base">Lotes deste parceiro</h3>
              <ul className="grid gap-2 text-sm">
                {ingestBatches
                  .filter((batch) => batch.partnerId === detail.partnerId)
                  .map((batch) => (
                    <li
                      key={batch.batchId}
                      className="rounded-md border border-eqx-border px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <code className="text-xs">{batch.batchId}</code>
                        <Badge tone={batchTone[batch.status]}>
                          {batch.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-eqx-text-muted">
                        {formatNumber(batch.accepted)} aceitos · {formatNumber(batch.rejected)}{' '}
                        rejeitados
                      </p>
                      {batch.rejectReason ? (
                        <p className="mt-1 text-xs">{batch.rejectReason}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </section>
            {detail.status !== 'ativo' ? (
              <Notice tone="warning" title="Parceiro fora do estado normal">
                Enquanto o parceiro estiver {detail.status}, as features derivadas desta fonte
                entram em degradação controlada e o score sinaliza cobertura parcial.
              </Notice>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
