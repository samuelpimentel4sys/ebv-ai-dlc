import { useEffect, useState } from 'react';
import { GitCompare, Rocket, Undo2 } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  SelectField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatDateTime, formatPercent } from '@/lib/format';
import {
  policyDiff as mockPolicyDiff,
  policyVersions,
  type PolicyDiffLine,
  type PolicyVersion,
} from '@/epics/explicabilidade/data';
import {
  fetchPolicyDiffLive,
  fetchPolicyVersionsLive,
  publishPolicyLive,
} from '@/api/explainability';
import { cn } from '@/lib/cn';

const statusTone = {
  ativa: 'success',
  aprovada: 'info',
  rascunho: 'neutral',
  arquivada: 'warning',
} as const;

type LivePolicy = PolicyVersion & { artifactHash?: string; approvalId?: string | null };

export function PolicyVersionsPage() {
  const toast = useToast();
  const query = useDataQuery(() => policyVersions as LivePolicy[], fetchPolicyVersionsLive, {
    latency: 340,
  });
  const [versions, setVersions] = useState<LivePolicy[] | null>(null);
  const [left, setLeft] = useState('policy-pf-17');
  const [right, setRight] = useState('policy-pf-18');
  const [diffLines, setDiffLines] = useState<PolicyDiffLine[]>(mockPolicyDiff);
  const [promoting, setPromoting] = useState<LivePolicy | null>(null);
  const [publishing, setPublishing] = useState(false);

  const rows = versions ?? query.data ?? [];
  const active = rows.find((row) => row.status === 'ativa');

  useEffect(() => {
    if (!rows.length) return;
    const ids = rows.map((r) => r.id);
    if (!ids.includes(left)) setLeft(ids[0]);
    if (!ids.includes(right)) setRight(ids[1] ?? ids[0]);
  }, [rows, left, right]);

  useEffect(() => {
    if (!left || !right || left === right) {
      setDiffLines([{ kind: 'context', text: 'Selecione duas versões distintas.' }]);
      return;
    }
    if (!isLiveMode()) {
      setDiffLines(mockPolicyDiff);
      return;
    }
    void (async () => {
      try {
        setDiffLines(await fetchPolicyDiffLive(left, right));
      } catch (error) {
        setDiffLines([{ kind: 'context', text: errorMessage(error) }]);
      }
    })();
  }, [left, right, query.data]);

  const columns: Column<LivePolicy>[] = [
    {
      key: 'id',
      header: 'Versão',
      render: (row) => (
        <code className="text-xs font-semibold">
          {row.version ? `v${row.version}` : row.id.slice(0, 8)}
        </code>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    { key: 'author', header: 'Autor', render: (row) => row.author },
    {
      key: 'approvalRatePct',
      header: 'Aprovação estimada',
      align: 'right',
      numeric: true,
      render: (row) => (row.approvalRatePct ? formatPercent(row.approvalRatePct) : '—'),
    },
    {
      key: 'changes',
      header: 'Regras alteradas',
      align: 'right',
      numeric: true,
      render: (row) => row.changes || '—',
    },
    { key: 'createdAt', header: 'Criada em', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) =>
        row.status === 'ativa' ? (
          <span className="text-xs text-eqx-text-muted">em produção</span>
        ) : row.status === 'arquivada' ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<Undo2 size={14} aria-hidden="true" />}
            onClick={() => setPromoting(row)}
          >
            Reativar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={<Rocket size={14} aria-hidden="true" />}
            onClick={() => setPromoting(row)}
          >
            Promover
          </Button>
        ),
    },
  ];

  async function confirmPromote() {
    if (!promoting) return;
    setPublishing(true);
    try {
      if (isLiveMode()) {
        await publishPolicyLive({
          id: promoting.id,
          artifactHash: promoting.artifactHash || '',
          approvalId: promoting.approvalId,
        });
        query.reload();
        setVersions(null);
      } else {
        setVersions(
          rows.map((row) =>
            row.id === promoting.id
              ? { ...row, status: 'ativa' }
              : row.status === 'ativa'
                ? { ...row, status: 'arquivada' }
                : row,
          ),
        );
      }
      toast.success(
        `${promoting.id.slice(0, 8)} ativa em produção`,
        'POST /api/v1/policy/versions/{id}/publish',
      );
      setPromoting(null);
    } catch (error) {
      toast.error('Falha ao promover política', errorMessage(error));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-02-F10-US-FE-01"
      title="Versões e diferenças de política"
      description="Linha do tempo das versões de política de crédito com comparação linha a linha entre duas versões, tradução de cada mudança em impacto de negócio e promoção rastreada na trilha de auditoria."
      meta={[
        <Badge key="epic" tone="accent">
          EP-02 · Explicabilidade
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /compliance/politicas/versoes
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhuma versão de política registrada.',
          description:
            'Crie a primeira versão no ensaio de política para ter histórico comparável e trilha de promoção auditável.',
        }}
      >
        {() => (
          <div className="grid gap-5">
            <Notice tone="info" title={`Política ativa: ${active?.version ?? active?.id ?? '—'}`}>
              Promoções exigem dupla aprovação (risco e compliance) e geram evento
              <code className="mx-1">POLICY_VERSION_ACTIVATED</code>na trilha de auditoria.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric value={rows.length} label="Versões registradas" />
              <Metric
                value={rows.filter((row) => row.status === 'rascunho').length}
                label="Rascunhos"
                hint="prontos para simulação"
              />
              <Metric
                value={active?.approvalRatePct ? formatPercent(active.approvalRatePct) : '—'}
                label="Aprovação da política ativa"
                tone="success"
              />
              <Metric value="dupla" label="Aprovação exigida" hint="risco + compliance" />
            </div>

            <Card>
              <CardHeader
                eyebrow="histórico"
                title="Versões de política"
                description="GET /api/v1/policy/versions"
              />
              <DataTable
                caption="Versões de política de crédito"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
              />
            </Card>

            <Card accent="accent">
              <CardHeader
                eyebrow="comparação"
                title="Diferenças entre versões"
                description="GET /api/v1/policy/versions/{a}/diff/{b}"
                actions={<GitCompare size={18} aria-hidden="true" />}
              />
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Versão base"
                  value={left}
                  onChange={(event) => setLeft(event.target.value)}
                  options={rows.map((row) => ({
                    value: row.id,
                    label: `${row.version || row.id.slice(0, 8)} · ${row.status}`,
                  }))}
                />
                <SelectField
                  label="Versão comparada"
                  value={right}
                  onChange={(event) => setRight(event.target.value)}
                  options={rows.map((row) => ({
                    value: row.id,
                    label: `${row.version || row.id.slice(0, 8)} · ${row.status}`,
                  }))}
                />
              </div>

              <div className="overflow-hidden rounded-md border border-eqx-border">
                <div className="flex items-center justify-between gap-3 border-b border-eqx-border bg-eqx-surface-subtle px-3 py-2 text-xs font-semibold">
                  <span>
                    <code>{left.slice(0, 8)}</code> → <code>{right.slice(0, 8)}</code>
                  </span>
                  <span className="text-eqx-text-muted">
                    {diffLines.filter((line) => line.kind !== 'context').length} linhas alteradas
                  </span>
                </div>
                <ul className="divide-y divide-eqx-border">
                  {diffLines.map((line, index) => (
                    <li
                      key={`${line.kind}-${index}`}
                      className={cn(
                        'px-3 py-2 font-mono text-xs',
                        line.kind === 'added' && 'bg-eqx-success-bg/50',
                        line.kind === 'removed' && 'bg-eqx-danger-bg/50',
                      )}
                    >
                      <span
                        className={cn(
                          'mr-2 select-none font-bold',
                          line.kind === 'added' && 'text-eqx-success',
                          line.kind === 'removed' && 'text-eqx-danger',
                          line.kind === 'context' && 'text-eqx-text-muted',
                        )}
                        aria-hidden="true"
                      >
                        {line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' '}
                      </span>
                      <span className="whitespace-pre-wrap">{line.text}</span>
                      {line.businessMeaning ? (
                        <p className="mt-1 font-sans text-xs text-eqx-text-muted">
                          {line.businessMeaning}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={Boolean(promoting)}
        onClose={() => setPromoting(null)}
        title={`Promover ${promoting?.version ?? promoting?.id?.slice(0, 8) ?? ''} para produção`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPromoting(null)}>
              Cancelar
            </Button>
            <Button
              icon={<Rocket size={16} aria-hidden="true" />}
              loading={publishing}
              onClick={() => void confirmPromote()}
            >
              Confirmar promoção
            </Button>
          </>
        }
      >
        <div className="grid gap-3 text-sm">
          <p>
            A promoção substitui <code>{active?.version ?? active?.id}</code> imediatamente. Decisões
            em andamento terminam com a versão anterior; novas requisições passam a usar{' '}
            <code>{promoting?.version ?? promoting?.id}</code>.
          </p>
          <Notice tone="warning" title="Impacto estimado">
            Lab: promoção chama POST /api/v1/policy/versions/&#123;id&#125;/publish com hash do artefato.
          </Notice>
        </div>
      </Modal>
    </ScreenLayout>
  );
}
