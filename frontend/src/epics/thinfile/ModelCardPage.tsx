import { BookOpen, Ban, CircleCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Accordion,
  Badge,
  BarChart,
  Card,
  CardHeader,
  DataTable,
  DivergingBars,
  KeyValueList,
  Metric,
  Notice,
  QueryBoundary,
  Tabs,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDate, formatNumber } from '@/lib/format';
import { bandPerformance, modelCard, type BandPerformance } from '@/epics/thinfile/data';

export function ModelCardPage() {
  const query = useMockQuery(() => ({ card: modelCard, bands: bandPerformance }), { latency: 340 });

  const bandColumns: Column<BandPerformance>[] = [
    { key: 'band', header: 'Faixa de risco', render: (row) => row.band },
    {
      key: 'volume',
      header: 'Volume avaliado',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.volume),
    },
    {
      key: 'thinFileApproval',
      header: 'Aprovação thin-file',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.thinFileApproval, 1)}%`,
    },
    {
      key: 'traditionalApproval',
      header: 'Aprovação tradicional',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.traditionalApproval, 1)}%`,
    },
    {
      key: 'badRateThin',
      header: 'Inadimplência thin-file',
      align: 'right',
      numeric: true,
      render: (row) => `${formatNumber(row.badRateThin, 1)}%`,
    },
    {
      key: 'badRateTraditional',
      header: 'Inadimplência tradicional',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span
          className={
            row.badRateTraditional > row.badRateThin ? 'font-semibold text-eqx-success' : undefined
          }
        >
          {formatNumber(row.badRateTraditional, 1)}%
        </span>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F02-US-FE-01"
      title="Ficha do modelo thin-file"
      description="Documentação viva do modelo de risco para população sem histórico bancário: finalidade, população de treino, features e fontes, métricas de performance, comparação com o score tradicional, limitações e usos vedados."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Thin-file
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /thinfile/ficha-modelo
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'A ficha deste modelo ainda não foi publicada.',
          description:
            'Nenhuma versão aprovada pelo comitê de modelos está disponível para consulta, então nenhuma decisão pode usar o thin-file neste momento. A ficha aparece aqui assim que a governança publicar a versão vigente.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            <Notice tone="info" title="Uso responsável é condição de operação">
              Esta ficha acompanha toda decisão baseada no modelo. Utilizações fora da lista
              aprovada são bloqueadas no gateway de decisão e registradas na trilha de auditoria.
            </Notice>

            <Card accent="action">
              <CardHeader
                eyebrow={`${data.card.modelId} · v${data.card.version}`}
                title="Identificação e finalidade"
                actions={<BookOpen size={18} aria-hidden="true" />}
              />
              <p className="max-w-[80ch] text-sm">{data.card.purpose}</p>
              <KeyValueList
                className="mt-4"
                columns={3}
                items={[
                  {
                    label: 'Publicado em',
                    value: formatDate(data.card.publishedAt),
                  },
                  { label: 'Responsável', value: data.card.owner },
                  {
                    label: 'Janela de treino',
                    value: data.card.trainingWindow,
                  },
                  {
                    label: 'População de treino',
                    value: `${formatNumber(data.card.populationSize)} pessoas`,
                  },
                  {
                    label: 'Features',
                    value: `${data.card.features.length} atributos`,
                  },
                  {
                    label: 'Governança',
                    value: 'aprovado no comitê de modelos',
                  },
                ]}
              />
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {data.card.metrics.map((metric) => (
                <Metric
                  key={metric.name}
                  value={formatNumber(metric.value, metric.value < 5 ? 3 : 1)}
                  label={metric.name}
                  hint={metric.hint}
                  tone={
                    metric.name === 'Estabilidade (PSI)' && metric.value > 0.1
                      ? 'warning'
                      : 'default'
                  }
                />
              ))}
            </div>

            <Tabs
              items={[
                {
                  id: 'features',
                  label: 'Features e fontes',
                  content: (
                    <Card>
                      <CardHeader
                        eyebrow="GET /api/v1/thinfile/model-card"
                        title="Importância relativa das features"
                        description="Contribuição média para a predição, calculada por SHAP na safra de validação."
                      />
                      <BarChart
                        ariaLabel="Importância relativa das features do modelo thin-file"
                        unit="%"
                        digits={1}
                        data={data.card.features.map((feature) => ({
                          label: feature.name,
                          value: feature.importance * 100,
                          hint: `fonte: ${feature.source}`,
                        }))}
                      />
                    </Card>
                  ),
                },
                {
                  id: 'comparativo',
                  label: 'vs. score tradicional',
                  content: (
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader
                          eyebrow="ganho de inclusão"
                          title="Aprovação adicional por faixa"
                          description="Diferença percentual entre a aprovação com modelo thin-file e a política tradicional."
                        />
                        <DivergingBars
                          ariaLabel="Ganho de aprovação por faixa de risco"
                          unit=" p.p."
                          data={data.bands.map((band) => ({
                            label: band.band,
                            value: band.thinFileApproval - band.traditionalApproval,
                            hint: `inadimplência ${formatNumber(band.badRateThin, 1)}% vs. ${formatNumber(
                              band.badRateTraditional,
                              1,
                            )}%`,
                          }))}
                        />
                      </Card>
                      <DataTable
                        caption="Performance por faixa de risco"
                        columns={bandColumns}
                        rows={data.bands}
                        rowKey={(row) => row.band}
                        footer="A inadimplência observada no modelo thin-file é igual ou menor que a da política tradicional em todas as faixas."
                      />
                    </div>
                  ),
                },
                {
                  id: 'limites',
                  label: 'Limitações e usos',
                  content: (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card accent="warning">
                        <CardHeader
                          eyebrow="limitações conhecidas"
                          title="O que o modelo não resolve"
                        />
                        <ul className="grid gap-2 text-sm">
                          {data.card.limitations.map((limitation) => (
                            <li key={limitation} className="flex gap-2">
                              <span aria-hidden="true" className="text-eqx-warning">
                                ·
                              </span>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </Card>
                      <div className="grid gap-4">
                        <Card accent="success">
                          <CardHeader eyebrow="usos aprovados" title="Onde pode ser aplicado" />
                          <ul className="grid gap-2 text-sm">
                            {data.card.approvedUses.map((use) => (
                              <li key={use} className="flex items-center gap-2">
                                <CircleCheck
                                  size={14}
                                  className="text-eqx-success"
                                  aria-hidden="true"
                                />
                                {use}
                              </li>
                            ))}
                          </ul>
                        </Card>
                        <Card accent="danger">
                          <CardHeader eyebrow="usos vedados" title="Onde é bloqueado" />
                          <ul className="grid gap-2 text-sm">
                            {data.card.prohibitedUses.map((use) => (
                              <li key={use} className="flex items-center gap-2">
                                <Ban size={14} className="text-eqx-danger" aria-hidden="true" />
                                {use}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    </div>
                  ),
                },
              ]}
            />

            <Accordion
              items={[
                {
                  id: 'contrato',
                  title: 'Contrato de consumo do modelo',
                  content: (
                    <div className="grid gap-2 text-sm">
                      <p>
                        O cálculo é executado por <code>POST /api/v1/thinfile/score</code> e exige
                        consentimento ativo do titular para as fontes alternativas.
                      </p>
                      <p>
                        A consulta pontual do resultado mais recente usa{' '}
                        <code>GET /api/v1/thinfile/&#123;documento&#125;</code> e retorna a versão
                        do modelo aplicada, permitindo reprodução da decisão.
                      </p>
                      <p>
                        Sem consentimento, a resposta é HTTP 409 com o código{' '}
                        <code>CONSENT_REQUIRED</code>, e a esteira deve seguir pela política
                        tradicional.
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </QueryBoundary>
    </ScreenLayout>
  );
}
