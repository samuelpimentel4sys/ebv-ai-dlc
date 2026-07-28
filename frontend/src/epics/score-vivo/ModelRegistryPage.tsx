import { useState } from 'react';
import { ArrowUpCircle, History, Undo2 } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  DataTable,
  KeyValueList,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  TextAreaField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDate, formatNumber } from '@/lib/format';
import { modelVersions, type ModelStage, type ModelVersion } from '@/epics/score-vivo/data';
import { fetchModelsLive, promoteModelLive, rollbackModelLive } from '@/api/ep01';

const stageTone: Record<ModelStage, 'success' | 'info' | 'warning' | 'neutral'> = {
  producao: 'success',
  shadow: 'info',
  staging: 'warning',
  arquivado: 'neutral',
};

export function ModelRegistryPage() {
  const toast = useToast();
  const query = useDataQuery(() => modelVersions, fetchModelsLive, { latency: 340 });
  const [versions, setVersions] = useState<ModelVersion[] | null>(null);
  const [promoting, setPromoting] = useState<ModelVersion | null>(null);
  const [rollingBack, setRollingBack] = useState<ModelVersion | null>(null);
  const [justification, setJustification] = useState('');
  const [justificationError, setJustificationError] = useState<string | null>(null);

  const rows = versions ?? query.data ?? [];
  const production = rows.find(
    (item) => item.modelId === 'score-pf' && item.stage === 'producao',
  );
  const shadow = rows.find((item) => item.modelId === 'score-pf' && item.stage === 'shadow');

  const columns: Column<ModelVersion>[] = [
    {
      key: 'modelId',
      header: 'Modelo',
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-semibold">{row.modelId}</p>
          <p className="text-xs text-eqx-text-muted">v{row.version}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Estágio',
      align: 'center',
      render: (row) => <Badge tone={stageTone[row.stage]}>{row.stage}</Badge>,
    },
    { key: 'ks', header: 'KS', align: 'right', numeric: true, render: (row) => formatNumber(row.ks, 3) },
    { key: 'auc', header: 'AUC', align: 'right', numeric: true, render: (row) => formatNumber(row.auc, 3) },
    {
      key: 'psi',
      header: 'PSI',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.psi > 0.1 ? 'font-bold text-eqx-warning' : undefined}>
          {formatNumber(row.psi, 2)}
        </span>
      ),
    },
    {
      key: 'trafficPct',
      header: 'Tráfego',
      align: 'right',
      numeric: true,
      render: (row) => `${row.trafficPct}%`,
    },
    { key: 'trainedAt', header: 'Treinado em', render: (row) => formatDate(row.trainedAt) },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.stage !== 'producao' && row.stage !== 'arquivado' ? (
            <Button size="sm" variant="secondary" onClick={() => setPromoting(row)}>
              Promover
            </Button>
          ) : null}
          {row.stage === 'producao' ? (
            <Button size="sm" variant="ghost" onClick={() => setRollingBack(row)}>
              Rollback
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  async function confirmPromotion() {
    if (!promoting) return;
    if (justification.trim().length < 15) {
      setJustificationError(
        'Descreva em pelo menos 15 caracteres o motivo da promoção — o comitê de modelos usa este texto na auditoria.',
      );
      document.querySelector<HTMLElement>('[name="promotion-justification"]')?.focus();
      return;
    }
    try {
      if (isLiveMode()) {
        await promoteModelLive(promoting.modelId, promoting.version);
        setVersions(null);
        query.reload();
      } else {
        applyStage(promoting, 'producao', 100);
      }
      toast.success('Versão promovida', `POST /api/v1/models/${promoting.modelId}/promote`);
      setPromoting(null);
      setJustification('');
      setJustificationError(null);
    } catch (error) {
      toast.error('Falha na promoção', errorMessage(error));
    }
  }

  function applyStage(target: ModelVersion, stage: ModelStage, traffic: number) {
    setVersions(
      rows.map((item) => {
        if (item.modelId !== target.modelId) return item;
        if (item.version === target.version) return { ...item, stage, trafficPct: traffic };
        if (stage === 'producao' && item.stage === 'producao') {
          return { ...item, stage: 'arquivado', trafficPct: 0 };
        }
        return item;
      }),
    );
  }

  async function confirmRollback() {
    if (!rollingBack) return;
    try {
      if (isLiveMode()) {
        const previous = rows.find(
          (item) =>
            item.modelId === rollingBack.modelId &&
            item.version !== rollingBack.version &&
            item.stage !== 'producao',
        );
        if (!previous) {
          toast.error('Rollback indisponível', 'Não há versão anterior no registry para restaurar.');
          return;
        }
        await rollbackModelLive(rollingBack.modelId, previous.version);
        setVersions(null);
        query.reload();
      } else {
        applyStage(rollingBack, 'arquivado', 0);
      }
      toast.warning(
        'Rollback executado',
        `POST /api/v1/models/${rollingBack.modelId}/rollback`,
      );
      setRollingBack(null);
    } catch (error) {
      toast.error('Falha no rollback', errorMessage(error));
    }
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F09-US-FE-01"
      title="Registry de versões de modelo"
      description="Governança de versões: métricas KS, AUC e PSI por versão, divisão de tráfego entre produção e shadow, promoção com dupla confirmação e rollback rastreável."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /ml/models/registry
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhuma versão de modelo registrada.',
          description:
            'Registre a primeira versão pelo pipeline de treino para acompanhar KS, AUC, PSI e divisão de tráfego entre produção e shadow.',
        }}
      >
        {() => (
          <div className="grid gap-5">
            {shadow && production && shadow.ks > production.ks ? (
              <Notice tone="info" title="Candidata supera produção">
                A versão <code>{shadow.version}</code> tem KS {formatNumber(shadow.ks, 3)} contra{' '}
                {formatNumber(production.ks, 3)} da produção. PSI de {formatNumber(shadow.psi, 2)}{' '}
                exige monitoramento após promoção.
              </Notice>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={rows.length} label="Versões registradas" />
              <Metric
                value={rows.filter((item) => item.stage === 'producao').length}
                label="Em produção"
                tone="success"
              />
              <Metric
                value={rows.filter((item) => item.stage === 'shadow').length}
                label="Em shadow"
                tone="action"
                icon={<History size={18} aria-hidden="true" />}
              />
              <Metric
                value={formatNumber(production?.ks ?? 0, 3)}
                label="KS em produção (score-pf)"
                hint={`AUC ${formatNumber(production?.auc ?? 0, 3)}`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader
                  eyebrow="registry"
                  title="Versões e estágios"
                  description="GET /api/v1/models"
                />
                <DataTable
                  caption="Versões de modelo registradas"
                  columns={columns}
                  rows={rows}
                  rowKey={(row) => `${row.modelId}-${row.version}`}
                />
              </Card>
              <Card>
                <CardHeader
                  eyebrow="comparativo"
                  title="Produção vs. candidata"
                  description="score-pf · métricas de validação out-of-time"
                />
                {production && shadow ? (
                  <>
                    <BarChart
                      ariaLabel="Comparativo de métricas entre versão em produção e candidata"
                      digits={3}
                      max={1}
                      data={[
                        { label: `KS ${production.version}`, value: production.ks, tone: 'muted' },
                        { label: `KS ${shadow.version}`, value: shadow.ks, tone: 'success' },
                        { label: `AUC ${production.version}`, value: production.auc, tone: 'muted' },
                        { label: `AUC ${shadow.version}`, value: shadow.auc, tone: 'success' },
                      ]}
                    />
                    <KeyValueList
                      className="mt-5"
                      items={[
                        { label: 'Tráfego produção', value: `${production.trafficPct}%` },
                        { label: 'Tráfego shadow', value: `${shadow.trafficPct}%` },
                        { label: 'PSI produção', value: formatNumber(production.psi, 2) },
                        { label: 'PSI candidata', value: formatNumber(shadow.psi, 2) },
                      ]}
                    />
                  </>
                ) : (
                  <p className="text-sm text-eqx-text-muted">
                    Sem par produção/shadow disponível para comparação.
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={Boolean(promoting)}
        onClose={() => {
          setPromoting(null);
          setJustificationError(null);
        }}
        title={`Promover ${promoting?.modelId ?? ''} v${promoting?.version ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPromoting(null)}>
              Cancelar
            </Button>
            <Button
              icon={<ArrowUpCircle size={16} aria-hidden="true" />}
              onClick={confirmPromotion}
            >
              Confirmar promoção
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Notice tone="warning" title="Ação com impacto em produção">
            A versão atual em produção será arquivada e todo o tráfego migra para a nova versão. A
            operação é registrada na trilha de auditoria com seu usuário.
          </Notice>
          <TextAreaField
            label="Justificativa da promoção"
            name="promotion-justification"
            required
            value={justification}
            error={justificationError ?? undefined}
            onChange={(event) => {
              setJustification(event.target.value);
              setJustificationError(null);
            }}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(rollingBack)}
        onClose={() => setRollingBack(null)}
        title={`Rollback de ${rollingBack?.modelId ?? ''} v${rollingBack?.version ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRollingBack(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={<Undo2 size={16} aria-hidden="true" />}
              onClick={() => void confirmRollback()}
            >
              Executar rollback
            </Button>
          </>
        }
      >
        <p className="text-sm">
          O rollback restaura a versão anterior aprovada pelo comitê e mantém os snapshots das
          decisões já emitidas intactos — nenhuma decisão histórica é recalculada.
        </p>
      </Modal>
    </ScreenLayout>
  );
}
