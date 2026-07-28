import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, RotateCw, ShieldX } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  DataTable,
  KeyValueList,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatDate, formatDateTime } from '@/lib/format';
import { VEGA } from '@/app/story';
import { availableScopes, credentials, type Credential } from '@/epics/contestacao/data';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

const statusTone = {
  ativa: 'success',
  rotacionando: 'warning',
  revogada: 'neutral',
} as const;

function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function CredentialsPage() {
  const toast = useToast();
  const query = useMockQuery(() => credentials, { latency: 300 });
  const { setData } = query;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['score:read']);
  const [revoking, setRevoking] = useState<Credential | null>(null);
  const [created, setCreated] = useState<Credential | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusNonce, setFocusNonce] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(formRef.current);
  }, [focusNonce]);

  function patch(id: string, changes: Partial<Credential>) {
    setData((list) => list.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }

  function rotate(row: Credential) {
    patch(row.id, { status: 'rotacionando' });
    toast.undoable(
      'Rotação iniciada',
      'Credencial antiga válida por 24 h para transição sem downtime',
      () => patch(row.id, { status: row.status }),
      'Cancelar rotação',
    );
  }

  function create() {
    if (name.trim().length < 3) {
      setErrors({
        name: 'Dê um nome de pelo menos 3 caracteres que identifique a integração, como “esteira de crédito”.',
      });
      setFocusNonce((value) => value + 1);
      return;
    }
    const record: Credential = {
      id: `cred-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      environment: 'sandbox',
      clientId: `prisma-sbx-${Math.random().toString(16).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 180 * 86_400_000).toISOString(),
      scopes,
      status: 'ativa',
    };
    setData((list) => [record, ...list]);
    setCreating(false);
    setName('');
    setErrors({});
    setCreated(record);
    toast.success(
      'Credencial criada',
      'POST /api/v1/console/credentials — secret exibido uma única vez',
    );
  }

  const columns: Column<Credential>[] = [
    {
      key: 'name',
      header: 'Credencial',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold">{row.name}</p>
          <code className="text-xs text-eqx-text-muted">{row.clientId}</code>
        </div>
      ),
    },
    {
      key: 'environment',
      header: 'Ambiente',
      align: 'center',
      render: (row) => (
        <Badge tone={row.environment === 'producao' ? 'danger' : 'info'}>{row.environment}</Badge>
      ),
    },
    {
      key: 'scopes',
      header: 'Escopos',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.scopes.map((scope) => (
            <Badge key={scope} tone="neutral">
              {scope}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'lastUsedAt',
      header: 'Último uso',
      render: (row) => formatDateTime(row.lastUsedAt),
    },
    {
      key: 'expiresAt',
      header: 'Expira em',
      render: (row) => {
        const days = daysUntil(row.expiresAt);
        return (
          <span
            className={
              days <= 30 && row.status === 'ativa' ? 'font-semibold text-eqx-warning' : undefined
            }
          >
            {formatDate(row.expiresAt)} ({days} d)
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Situação',
      align: 'center',
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (row) =>
        row.status === 'revogada' ? (
          <span className="text-xs text-eqx-text-muted">—</span>
        ) : (
          <span className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<RotateCw size={14} aria-hidden="true" />}
              onClick={() => rotate(row)}
            >
              Rotacionar
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<ShieldX size={14} aria-hidden="true" />}
              onClick={() => setRevoking(row)}
            >
              Revogar
            </Button>
          </span>
        ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F07-US-FE-01"
      title="Credenciais e escopos de API"
      description="Gestão de credenciais OAuth do cliente B2B: criação com escopo mínimo, rotação sem downtime, alerta de expiração e revogação imediata em caso de vazamento."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Console B2B
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /b2b/credenciais
        </Badge>,
        <Badge key="client" tone="neutral" className="font-mono">
          {VEGA.clientId}
        </Badge>,
      ]}
      actions={
        <Button icon={<KeyRound size={16} aria-hidden="true" />} onClick={() => setCreating(true)}>
          Nova credencial
        </Button>
      }
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Nenhuma credencial emitida para esta conta.',
          description:
            'A integração ainda não tem chave de acesso. Use “Nova credencial” para emitir uma chave de sandbox com o escopo mínimo necessário e começar os testes sem tocar em dados de produção.',
        }}
      >
        {(list) => {
          const expiring = list.filter(
            (item) => item.status === 'ativa' && daysUntil(item.expiresAt) <= 30,
          );
          return (
            <div className="grid gap-5">
              {created ? (
                <Notice
                  tone="success"
                  title={`Credencial "${created.name}" ativa em sandbox`}
                  actions={
                    <Link
                      to="/integracao/playground/decisoes"
                      className={buttonClass('secondary', 'sm')}
                    >
                      Fazer a primeira consulta
                    </Link>
                  }
                >
                  O próximo passo da integração é chamar a API com esta credencial e acompanhar o
                  volume no console de consumo.
                </Notice>
              ) : null}

              {expiring.length > 0 ? (
                <Notice
                  tone="warning"
                  title={`${expiring.length} credencial(is) expirando em até 30 dias`}
                >
                  Programe a rotação antes do vencimento: chamadas com credencial expirada retornam
                  HTTP 401 e podem interromper a esteira de crédito.
                </Notice>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  value={list.filter((item) => item.status === 'ativa').length}
                  label="Credenciais ativas"
                />
                <Metric
                  value={
                    list.filter(
                      (item) => item.environment === 'producao' && item.status === 'ativa',
                    ).length
                  }
                  label="Em produção"
                  tone="action"
                />
                <Metric value={expiring.length} label="Expirando em 30 dias" tone="warning" />
                <Metric
                  value={list.filter((item) => item.status === 'revogada').length}
                  label="Revogadas"
                  hint="mantidas para auditoria"
                />
              </div>

              <Card>
                <CardHeader
                  eyebrow="GET /api/v1/console/credentials"
                  title="Credenciais da organização"
                  description="Princípio do menor privilégio: conceda apenas os escopos usados pela integração."
                />
                <DataTable
                  caption="Credenciais de API"
                  columns={columns}
                  rows={list}
                  rowKey={(row) => row.id}
                />
              </Card>
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova credencial de sandbox"
        description="Credenciais de produção requerem aprovação do administrador da conta."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={create}>Criar credencial</Button>
          </>
        }
      >
        <div className="grid gap-4" ref={formRef}>
          <TextField
            label="Nome da integração"
            required
            value={name}
            error={errors.name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors({});
            }}
            hint="Ex.: esteira de crédito consignado"
          />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Escopos</legend>
            {availableScopes.map((scope) => (
              <label key={scope} className="flex min-h-[2.5rem] items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  onChange={(event) =>
                    setScopes((current) =>
                      event.target.checked
                        ? [...current, scope]
                        : current.filter((item) => item !== scope),
                    )
                  }
                  className="h-5 w-5 accent-eqx-action"
                />
                <code className="text-xs">{scope}</code>
              </label>
            ))}
          </fieldset>
        </div>
      </Modal>

      <Modal
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        title="Revogar credencial"
        description="A revogação é imediata e não pode ser desfeita."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevoking(null)}>
              Manter ativa
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!revoking) return;
                patch(revoking.id, { status: 'revogada' });
                toast.success(
                  'Credencial revogada',
                  `DELETE /api/v1/console/credentials/${revoking.id}`,
                );
                setRevoking(null);
              }}
            >
              Revogar agora
            </Button>
          </>
        }
      >
        {revoking ? (
          <div className="grid gap-4">
            <Notice tone="danger" title="Impacto imediato">
              Todas as chamadas com esta credencial passarão a retornar HTTP 401. Para trocar a
              chave sem interromper a integração, use a rotação: ela mantém a credencial antiga
              válida por 24 horas.
            </Notice>
            <KeyValueList
              columns={1}
              items={[
                { label: 'Credencial', value: revoking.name },
                {
                  label: 'Client ID',
                  value: <code className="text-xs">{revoking.clientId}</code>,
                },
                { label: 'Ambiente', value: revoking.environment },
                {
                  label: 'Último uso',
                  value: formatDateTime(revoking.lastUsedAt),
                },
              ]}
            />
          </div>
        ) : null}
      </Modal>
    </ScreenLayout>
  );
}
