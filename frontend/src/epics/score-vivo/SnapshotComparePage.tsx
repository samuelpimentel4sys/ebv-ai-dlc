import { useState } from 'react';
import { CheckCircle2, FileSearch, ShieldCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  DivergingBars,
  KeyValueList,
  Notice,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime } from '@/lib/format';
import { decisionPair, type AttributeDiff, type DecisionMeta } from '@/epics/score-vivo/data';
import { fetchDecisionCompareLive, verifyDecisionLive } from '@/api/ep01';
import { HttpError } from '@/lib/httpClient';

function loadDecisionIdsFromSession(): [string, string] {
  try {
    const raw = sessionStorage.getItem('prisma.decisionIds');
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (ids.length < 2) {
      throw new HttpError({
        status: 404,
        error: 'Not Found',
        message:
          'Gere pelo menos 2 decisões no Playground (F05) antes de comparar snapshots WORM.',
        path: '/api/v1/decisions',
        correlationId: 'local-session',
      });
    }
    return [ids[ids.length - 2], ids[ids.length - 1]];
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError({
      status: 404,
      error: 'Not Found',
      message: 'Não foi possível ler decisionIds da sessão.',
      path: '/api/v1/decisions',
      correlationId: 'local-session',
    });
  }
}

const outcomeTone = {
  aprovado: 'success',
  recusado: 'danger',
  revisao: 'warning',
} as const;

function DecisionCard({ decision, side }: { decision: DecisionMeta; side: 'A' | 'B' }) {
  return (
    <Card accent={side === 'A' ? 'action' : 'accent'}>
      <CardHeader
        eyebrow={`decisão ${side}`}
        title={<code className="text-base">{decision.decisionId}</code>}
        actions={<Badge tone={outcomeTone[decision.outcome]}>{decision.outcome}</Badge>}
      />
      <KeyValueList
        items={[
          { label: 'Decidido em', value: formatDateTime(decision.decidedAt) },
          { label: 'Score', value: decision.score },
          { label: 'Modelo', value: <code className="text-xs">{decision.modelVersion}</code> },
          { label: 'Política', value: <code className="text-xs">{decision.policyVersion}</code> },
          { label: 'Latência', value: `${decision.latencyMs} ms` },
          { label: 'Hash do snapshot', value: <code className="text-xs">{decision.snapshotHash}</code> },
        ]}
      />
    </Card>
  );
}

export function SnapshotComparePage() {
  const toast = useToast();
  const [verified, setVerified] = useState(false);
  const query = useDataQuery(
    decisionPair,
    async () => {
      const [leftId, rightId] = loadDecisionIdsFromSession();
      return fetchDecisionCompareLive(leftId, rightId);
    },
    { latency: 400 },
  );

  const columns: Column<AttributeDiff>[] = [
    {
      key: 'attribute',
      header: 'Atributo',
      render: (row) => <code className="text-xs">{row.attribute}</code>,
    },
    { key: 'left', header: 'Decisão A', render: (row) => row.left },
    { key: 'right', header: 'Decisão B', render: (row) => row.right },
    {
      key: 'changed',
      header: 'Situação',
      align: 'center',
      render: (row) =>
        row.changed ? <Badge tone="warning">alterado</Badge> : <Badge tone="neutral">igual</Badge>,
    },
    {
      key: 'contribution',
      header: 'Contribuição na Δ score',
      align: 'right',
      numeric: true,
      render: (row) => (row.contribution ? `${row.contribution} pts` : '—'),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F04-US-FE-01"
      title="Visualizador e comparação de snapshots de decisão"
      description="Compare dois snapshots imutáveis (WORM) lado a lado, veja quais atributos mudaram, quanto cada mudança contribuiu para a variação do score e verifique a integridade do hash."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/decisoes/comparar
        </Badge>,
      ]}
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={<ShieldCheck size={16} aria-hidden="true" />}
          onClick={() => {
            void (async () => {
              try {
                if (isLiveMode() && query.data) {
                  const okLeft = await verifyDecisionLive(query.data.left.decisionId);
                  const okRight = await verifyDecisionLive(query.data.right.decisionId);
                  if (!okLeft || !okRight) {
                    toast.error('Integridade falhou', 'Um dos snapshots não passou em verify.');
                    return;
                  }
                }
                setVerified(true);
                toast.success('Integridade confirmada', 'POST /api/v1/decisions/{id}/verify');
              } catch (error) {
                toast.error('Falha no verify', errorMessage(error));
              }
            })();
          }}
        >
          Verificar integridade
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Não há snapshots para comparar.',
          description:
            'Escolha duas decisões do mesmo titular na trilha de auditoria para abrir a comparação lado a lado dos snapshots WORM.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            {verified ? (
              <Notice
                tone="success"
                title="Snapshots íntegros"
                actions={<CheckCircle2 size={20} aria-hidden="true" />}
              >
                Hashes recalculados coincidem com os registros WORM. Nenhuma alteração posterior
                detectada nas duas decisões.
              </Notice>
            ) : (
              <Notice tone="info" title="Snapshots carregados">
                Use “Verificar integridade” para recalcular o hash SHA-256 dos payloads e confrontar
                com o registro imutável.
              </Notice>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <DecisionCard decision={data.left} side="A" />
              <DecisionCard decision={data.right} side="B" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader
                  eyebrow="diff de atributos"
                  title="O que mudou entre as duas decisões"
                  description={`${data.diff.filter((item) => item.changed).length} de ${
                    data.diff.length
                  } atributos alterados`}
                />
                <DataTable
                  caption="Comparação atributo a atributo entre dois snapshots"
                  columns={columns}
                  rows={data.diff}
                  rowKey={(row) => row.attribute}
                />
              </Card>
              <Card>
                <CardHeader
                  eyebrow="atribuição"
                  title="Contribuição para a variação de score"
                  description={`Δ total de ${data.right.score - data.left.score} pontos entre A e B.`}
                />
                <DivergingBars
                  ariaLabel="Contribuição de cada atributo para a variação do score"
                  digits={0}
                  unit=" pts"
                  data={data.diff
                    .filter((item) => item.contribution !== 0)
                    .map((item) => ({ label: item.attribute, value: item.contribution }))}
                />
                <div className="mt-4 flex items-center gap-2 text-sm text-eqx-text-muted">
                  <FileSearch size={16} aria-hidden="true" />
                  GET /api/v1/decisions/{'{decisionId}'}/snapshot
                </div>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>
    </ScreenLayout>
  );
}
