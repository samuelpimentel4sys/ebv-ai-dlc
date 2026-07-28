import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, FileCheck2, Sigma } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatNumber } from '@/lib/format';
import { AURORA } from '@/app/story';
import { ratios, type FinancialRatio } from '@/epics/copiloto-pj/data';

const statusTone = {
  bom: 'success',
  atencao: 'warning',
  critico: 'danger',
  nao_calculavel: 'neutral',
} as const;

function display(ratio: FinancialRatio) {
  if (ratio.value === null) return 'não calculável';
  return `${formatNumber(ratio.value, 2)}${ratio.unit === '%' ? '%' : ratio.unit === 'dias' ? ' dias' : '×'}`;
}

export function RatiosPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const query = useMockQuery(() => ratios, { latency: 360 });
  const [detail, setDetail] = useState<FinancialRatio | null>(null);

  const sourceDocument = searchParams.get('documento');

  const columns: Column<FinancialRatio>[] = [
    { key: 'name', header: 'Índice', render: (row) => row.name },
    {
      key: 'value',
      header: 'Apurado',
      align: 'right',
      numeric: true,
      render: (row) =>
        row.value === null ? (
          <Badge tone="neutral">não calculável</Badge>
        ) : (
          <strong>{display(row)}</strong>
        ),
    },
    {
      key: 'sectorMedian',
      header: 'Mediana CNAE',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.sectorMedian, 2),
    },
    {
      key: 'delta',
      header: 'vs. setor',
      align: 'right',
      numeric: true,
      render: (row) =>
        row.value === null ? (
          <span className="text-eqx-text-muted">—</span>
        ) : (
          <span className={row.value >= row.sectorMedian ? 'text-eqx-success' : 'text-eqx-danger'}>
            {formatNumber(((row.value - row.sectorMedian) / row.sectorMedian) * 100, 1)}%
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Leitura',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: 'Fórmula',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>
          Ver cálculo
        </Button>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F05-US-FE-01"
      title="Análise dos índices financeiros"
      description="Quadro de índices calculados a partir da extração conferida, com fórmula e insumos auditáveis, comparação com a mediana do CNAE e marcação explícita dos índices não calculáveis."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/:cnpj/indices
        </Badge>,
        ...(sourceDocument
          ? [
              <Badge key="doc" tone="info" className="font-mono">
                origem {sourceDocument}
              </Badge>,
            ]
          : []),
      ]}
      actions={
        <Button
          size="sm"
          variant="secondary"
          icon={<Calculator size={16} aria-hidden="true" />}
          onClick={() => {
            query.reload();
            toast.info('Recalculando índices', 'POST /api/v1/pj/ratios/calculate');
          }}
        >
          Recalcular
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum índice foi calculado para este exercício.',
          description:
            'O cálculo depende dos campos conferidos na extração. Conclua a conferência do balanço para que os índices sejam apurados.',
          action: (
            <Link
              to={`/pj/documentos/${AURORA.documentId}/conferencia`}
              className={buttonClass('secondary')}
            >
              Abrir conferência da extração
            </Link>
          ),
        }}
      >
        {(data) => {
          const computed = data.filter((row) => row.value !== null);
          const critical = data.filter((row) => row.status === 'critico');
          const notComputable = data.filter((row) => row.status === 'nao_calculavel');
          return (
            <div className="grid gap-5">
              {sourceDocument ? (
                <Notice
                  tone="info"
                  title="Números vindos da extração conferida"
                  actions={
                    <Link
                      to={`/pj/documentos/${sourceDocument}/conferencia`}
                      className={buttonClass('secondary', 'sm')}
                    >
                      Ver documento
                    </Link>
                  }
                >
                  Todos os insumos abaixo saíram do documento <code>{sourceDocument}</code>, aprovado
                  na conferência de extração. Alterar um campo lá recalcula estes índices.
                </Notice>
              ) : null}

              {critical.length ? (
                <Notice tone="danger" title={`${critical.length} índice em nível crítico`}>
                  {critical.map((row) => `${row.name}: ${display(row)}`).join(' · ')}. Exige
                  condicionante no parecer ou recusa fundamentada.
                </Notice>
              ) : null}

              {notComputable.length ? (
                <Notice tone="warning" title="Índices sem insumo suficiente">
                  {notComputable.map((row) => row.name).join(', ')} — complete a extração para
                  habilitar o cálculo. Índices sem insumo nunca são estimados.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={computed.length} label="Índices calculados" />
                <Metric value={critical.length} label="Em nível crítico" tone="danger" />
                <Metric
                  value={
                    data.filter((row) => row.value !== null && row.value >= row.sectorMedian).length
                  }
                  label="Acima da mediana setorial"
                  tone="success"
                />
                <Metric
                  value={notComputable.length}
                  label="Não calculáveis"
                  hint="insumo ausente na extração"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="quadro de índices"
                  title={`${AURORA.shortName} · exercício 2025`}
                  description="GET /api/v1/pj/{cnpj}/ratios"
                  actions={<Sigma size={18} aria-hidden="true" />}
                />
                <DataTable
                  caption="Índices financeiros apurados e comparação setorial"
                  columns={columns}
                  rows={data}
                  rowKey={(row) => row.id}
                />
              </Card>

              <Card>
                <CardHeader
                  eyebrow="benchmark"
                  title="Distância da mediana do CNAE 24.24-5"
                  description="GET /api/v1/pj/ratios/benchmarks"
                />
                <BarChart
                  ariaLabel="Comparação entre índices apurados e mediana do setor"
                  digits={2}
                  data={computed.map((row) => ({
                    label: `${row.name} (setor ${formatNumber(row.sectorMedian, 2)})`,
                    value: row.value ?? 0,
                    tone:
                      row.status === 'critico'
                        ? 'danger'
                        : row.status === 'atencao'
                          ? 'warning'
                          : 'success',
                  }))}
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
        description="Fórmula, insumos e leitura do índice"
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              columns={1}
              items={[
                { label: 'Fórmula', value: <code className="text-xs">{detail.formula}</code> },
                { label: 'Insumos aplicados', value: <code className="text-xs">{detail.inputs}</code> },
                { label: 'Resultado', value: display(detail) },
                { label: 'Mediana do CNAE', value: formatNumber(detail.sectorMedian, 2) },
                ...(sourceDocument
                  ? [
                      {
                        label: 'Documento de origem',
                        value: <code className="text-xs">{sourceDocument}</code>,
                      },
                    ]
                  : []),
              ]}
            />
            <Notice
              tone={detail.status === 'critico' ? 'danger' : detail.status === 'bom' ? 'success' : 'warning'}
              title="Leitura"
            >
              {detail.interpretation}
            </Notice>
            <p className="flex items-start gap-2 text-sm text-eqx-text-muted">
              <FileCheck2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              Os insumos vêm exclusivamente dos campos conferidos na tela de extração. Alterar um campo
              recalcula o índice e invalida a verificação do parecer.
            </p>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
