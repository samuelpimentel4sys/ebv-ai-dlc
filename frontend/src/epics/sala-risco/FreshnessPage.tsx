import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, RefreshCw } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDateTime, formatNumber } from '@/lib/format';
import { cubes, type CubeFreshness } from '@/epics/sala-risco/data';

const statusTone = {
  ok: 'success',
  atrasado: 'warning',
  falha: 'danger',
} as const;

function ageLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${formatNumber(hours, 1)} h`;
  return `${formatNumber(hours / 24, 1)} d`;
}

export function FreshnessPage() {
  const toast = useToast();
  const query = useMockQuery(() => cubes, { latency: 320 });
  const [rows, setRows] = useState<CubeFreshness[] | null>(null);

  const columns: Column<CubeFreshness>[] = [
    {
      key: 'cube',
      header: 'Cubo agregado',
      render: (row) => (
        <div className="min-w-0">
          <code className="text-xs font-semibold">{row.cube}</code>
          <p className="text-xs text-eqx-text-muted">
            {row.domain} · responsável {row.owner}
          </p>
        </div>
      ),
    },
    {
      key: 'lastRefreshAt',
      header: 'Última carga',
      render: (row) => formatDateTime(row.lastRefreshAt),
    },
    {
      key: 'ageMinutes',
      header: 'Idade',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.ageMinutes > row.slaMinutes ? 'font-semibold text-eqx-danger' : undefined}>
          {ageLabel(row.ageMinutes)}
        </span>
      ),
    },
    {
      key: 'slaMinutes',
      header: 'SLA',
      align: 'right',
      numeric: true,
      render: (row) => ageLabel(row.slaMinutes),
    },
    {
      key: 'consumption',
      header: 'Consumo do SLA',
      render: (row) => (
        <ProgressBar
          label=""
          value={Math.min((row.ageMinutes / row.slaMinutes) * 100, 100)}
          tone={row.ageMinutes > row.slaMinutes ? 'danger' : row.ageMinutes / row.slaMinutes > 0.8 ? 'warning' : 'success'}
        />
      ),
      width: '10rem',
    },
    {
      key: 'rows',
      header: 'Linhas',
      align: 'right',
      numeric: true,
      render: (row) => formatNumber(row.rows),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant={row.status === 'ok' ? 'ghost' : 'secondary'}
          icon={<RefreshCw size={14} aria-hidden="true" />}
          onClick={() => {
            setRows((current) =>
              (current ?? query.data ?? []).map((item) =>
                item.cube === row.cube
                  ? {
                      ...item,
                      lastRefreshAt: new Date().toISOString(),
                      ageMinutes: 0,
                      status: 'ok',
                    }
                  : item,
              ),
            );
            toast.success('Recarga disparada', `POST /api/v1/portfolio/aggregates/refresh`);
          }}
        >
          Recarregar
        </Button>
      ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-04-F05-US-FE-01"
      title="Frescor dos dados da sala de risco"
      description="Verificação da idade de cada cubo agregado contra seu SLA, com aviso explícito quando um painel está sendo alimentado por dado vencido e ação de recarga sob demanda."
      meta={[
        <Badge key="epic" tone="accent">
          EP-04 · Sala de Risco
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/carteira/frescor
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhum cubo agregado está sendo monitorado.',
          description:
            'Sem cubo registrado não há como afirmar que a sala de risco usa dado fresco. Cadastre os cubos e seus SLAs antes de levar números ao comitê.',
          action: (
            <Link to="/risco/carteira/cockpit" className={buttonClass('secondary')}>
              Abrir cockpit da carteira
            </Link>
          ),
        }}
      >
        {(cubeList) => {
          const current = rows ?? cubeList;
          const breached = current.filter((row) => row.status !== 'ok');
          const withinSla = current.filter((row) => row.status === 'ok');
          return (
            <div className="grid gap-5">
              {breached.length ? (
                <Notice tone="danger" title={`${breached.length} cubos fora do SLA`}>
                  Painéis que dependem de {breached.map((row) => row.cube).join(', ')} exibem dado
                  vencido. Números apresentados em comitê devem citar a data-base efetiva de cada cubo.
                </Notice>
              ) : (
                <Notice tone="success" title="Todos os cubos dentro do SLA">
                  A sala de risco está operando com dados atualizados.
                </Notice>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric value={current.length} label="Cubos monitorados" />
                <Metric
                  value={withinSla.length}
                  label="Dentro do SLA"
                  tone="success"
                  icon={<Clock size={18} aria-hidden="true" />}
                />
                <Metric
                  value={current.filter((row) => row.status === 'atrasado').length}
                  label="Atrasados"
                  tone="warning"
                />
                <Metric
                  value={current.filter((row) => row.status === 'falha').length}
                  label="Com falha de carga"
                  tone="danger"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="cubos"
                  title="Frescor por cubo agregado"
                  description="GET /api/v1/portfolio/aggregates/freshness"
                />
                <DataTable
                  caption="Frescor dos cubos agregados da sala de risco"
                  columns={columns}
                  rows={current}
                  rowKey={(row) => row.cube}
                  footer={`${withinSla.length} de ${current.length} cubos dentro do SLA`}
                />
              </Card>
            </div>
          );
        }}
      </QueryBoundary>
    </ScreenLayout>
  );
}
