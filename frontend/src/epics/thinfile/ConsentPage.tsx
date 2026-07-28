import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
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
import { formatDate, formatDateTime } from '@/lib/format';
import {
  consentHistory,
  consentPurposes,
  type ConsentEvent,
  type ConsentPurpose,
} from '@/epics/thinfile/data';

const actionTone = {
  concedido: 'success',
  renovado: 'info',
  revogado: 'danger',
  expirado: 'warning',
} as const;

export function ConsentPage() {
  const toast = useToast();
  const query = useMockQuery(() => ({ purposes: consentPurposes, history: consentHistory }), {
    latency: 320,
  });
  const { setData } = query;
  const [revoking, setRevoking] = useState<ConsentPurpose | null>(null);

  function patch(purpose: ConsentPurpose, changes: Partial<ConsentPurpose>) {
    setData((current) => ({
      ...current,
      purposes: current.purposes.map((item) =>
        item.consentId === purpose.consentId ? { ...item, ...changes } : item,
      ),
    }));
  }

  function toggle(purpose: ConsentPurpose) {
    if (!purpose.granted) {
      patch(purpose, { granted: true, grantedAt: new Date().toISOString() });
      toast.success('Permissão concedida', 'POST /api/v1/consents');
      return;
    }
    // Revogar finalidade essencial derruba o score thin-file: exige confirmação explícita.
    if (purpose.required) {
      setRevoking(purpose);
      return;
    }
    patch(purpose, {
      granted: false,
      grantedAt: undefined,
      expiresAt: undefined,
    });
    toast.undoable(
      'Permissão desativada',
      `DELETE /api/v1/consents/${purpose.consentId} — efeito imediato`,
      () =>
        patch(purpose, {
          granted: true,
          grantedAt: purpose.grantedAt,
          expiresAt: purpose.expiresAt,
        }),
      'Reativar',
    );
  }

  function confirmRevoke() {
    if (!revoking) return;
    patch(revoking, {
      granted: false,
      grantedAt: undefined,
      expiresAt: undefined,
    });
    toast.success(
      'Permissão revogada',
      `DELETE /api/v1/consents/${revoking.consentId} — efeito imediato`,
    );
    setRevoking(null);
  }

  const historyColumns: Column<ConsentEvent>[] = [
    { key: 'at', header: 'Quando', render: (row) => formatDateTime(row.at) },
    {
      key: 'action',
      header: 'Ação',
      align: 'center',
      render: (row) => <Badge tone={actionTone[row.action]}>{row.action}</Badge>,
    },
    { key: 'purpose', header: 'Finalidade', render: (row) => row.purpose },
    {
      key: 'channel',
      header: 'Canal',
      align: 'center',
      render: (row) => row.channel,
    },
    {
      key: 'ip',
      header: 'Origem',
      render: (row) => <code className="text-xs">{row.ip}</code>,
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F04-US-FE-01"
      title="Central de privacidade — minhas permissões"
      description="Controle granular do titular sobre cada finalidade de uso dos dados: o que é usado, por quanto tempo, ativação e revogação com efeito imediato, além do histórico completo de consentimentos."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Coach B2C
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /titular/privacidade
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Não encontramos permissões registradas no seu CPF.',
          description:
            'Nenhuma finalidade foi ativada ainda, então nenhum dado seu está sendo usado. Assim que você autorizar o primeiro uso, ele aparece aqui com data, prazo e opção de desativar.',
        }}
      >
        {(data) => (
          <div className="grid gap-5">
            <Notice tone="info" title="Você decide, e pode mudar de ideia">
              Revogar uma permissão interrompe o uso do dado a partir daquele instante. Decisões já
              tomadas permanecem registradas para fins de auditoria, conforme a LGPD.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                value={data.purposes.filter((item) => item.granted).length}
                label="Permissões ativas"
                tone="success"
                icon={<ShieldCheck size={18} aria-hidden="true" />}
              />
              <Metric
                value={data.purposes.filter((item) => !item.granted).length}
                label="Permissões desativadas"
                icon={<Lock size={18} aria-hidden="true" />}
              />
              <Metric
                value={data.history.length}
                label="Registros no histórico"
                hint="retidos por 5 anos"
              />
            </div>

            <Card>
              <CardHeader
                eyebrow="GET /api/v1/consents/{documento}"
                title="Finalidades de uso"
                description="Cada finalidade é independente: desativar uma não afeta as demais."
              />
              <ul className="grid gap-3">
                {data.purposes.map((purpose) => (
                  <li
                    key={purpose.consentId}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-eqx-border px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{purpose.purpose}</p>
                        {purpose.required ? <Badge tone="warning">essencial ao score</Badge> : null}
                        <Badge tone={purpose.granted ? 'success' : 'neutral'}>
                          {purpose.granted ? 'ativa' : 'desativada'}
                        </Badge>
                      </div>
                      <p className="mt-1 max-w-[70ch] text-sm text-eqx-text-muted">
                        {purpose.description}
                      </p>
                      <p className="mt-2 text-xs text-eqx-text-muted">
                        Dados usados: {purpose.dataUsed.join(' · ')}
                      </p>
                      {purpose.granted ? (
                        <p className="mt-1 text-xs">
                          Concedida em {formatDate(purpose.grantedAt)}
                          {purpose.expiresAt ? ` · renova em ${formatDate(purpose.expiresAt)}` : ''}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant={purpose.granted ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggle(purpose)}
                      aria-pressed={purpose.granted}
                    >
                      {purpose.granted ? 'Desativar' : 'Ativar'}
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                eyebrow="trilha"
                title="Histórico de consentimentos"
                description="Registro imutável de cada concessão, renovação e revogação."
              />
              <DataTable
                caption="Histórico de consentimentos"
                columns={historyColumns}
                rows={data.history}
                rowKey={(row) => `${row.at}-${row.purpose}`}
              />
            </Card>
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        title="Desativar permissão"
        description="Entenda o efeito antes de confirmar"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevoking(null)}>
              Manter ativa
            </Button>
            <Button variant="danger" onClick={confirmRevoke}>
              Desativar agora
            </Button>
          </>
        }
      >
        {revoking ? (
          <div className="grid gap-4">
            {revoking.required ? (
              <Notice tone="danger" title="Seu score thin-file deixará de ser calculado">
                Sem esta permissão, não podemos usar suas contas de consumo. Seu score volta a
                depender apenas do histórico bancário tradicional, o que pode reduzir as ofertas
                disponíveis.
              </Notice>
            ) : (
              <Notice tone="warning" title="Efeito da desativação">
                A finalidade abaixo deixa de ser executada imediatamente. Você pode reativar quando
                quiser, sem perder o histórico.
              </Notice>
            )}
            <KeyValueList
              columns={1}
              items={[
                { label: 'Finalidade', value: revoking.purpose },
                { label: 'Dados usados', value: revoking.dataUsed.join(' · ') },
                {
                  label: 'Concedida em',
                  value: formatDate(revoking.grantedAt),
                },
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
