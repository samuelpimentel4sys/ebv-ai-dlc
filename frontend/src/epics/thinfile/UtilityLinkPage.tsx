import { useEffect, useRef, useState } from 'react';
import { Link2, Plug, Unlink } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Metric,
  Notice,
  QueryBoundary,
  SelectField,
  Stepper,
  TextField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';
import { formatDate } from '@/lib/format';
import { linkablePartners, utilityLinks, type UtilityLink } from '@/epics/thinfile/data';

const statusTone = {
  validado: 'success',
  validando: 'info',
  falhou: 'danger',
  revogado: 'neutral',
} as const;

const statusLabel: Record<UtilityLink['status'], string> = {
  validado: 'validado',
  validando: 'em validação',
  falhou: 'falhou',
  revogado: 'revogado',
};

const wizardSteps = [
  {
    id: 'partner',
    label: 'Escolher o serviço',
    description: 'energia, água ou telecom',
  },
  {
    id: 'account',
    label: 'Identificar a conta',
    description: 'número da unidade',
  },
  {
    id: 'consent',
    label: 'Autorizar o uso',
    description: 'consentimento explícito',
  },
];

export function UtilityLinkPage() {
  const toast = useToast();
  const query = useMockQuery(() => utilityLinks, { latency: 320 });
  const { setData } = query;
  const [step, setStep] = useState(0);
  const [partner, setPartner] = useState(linkablePartners[0].value);
  const [accountRef, setAccountRef] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusNonce, setFocusNonce] = useState(0);
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(wizardRef.current);
  }, [focusNonce]);

  function next() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      if (accountRef.trim().length < 4) {
        setErrors({
          accountRef:
            'Informe o número da conta ou da unidade consumidora com pelo menos 4 dígitos — ele aparece no topo da fatura.',
        });
        setFocusNonce((value) => value + 1);
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }

    if (!consent) {
      setErrors({
        consent:
          'Marque a autorização para concluir: sem ela não podemos consultar o histórico dessa conta.',
      });
      setFocusNonce((value) => value + 1);
      return;
    }

    const created: UtilityLink = {
      linkId: `lnk-${Math.random().toString(36).slice(2, 6)}`,
      partner: linkablePartners.find((item) => item.value === partner)?.label ?? partner,
      category: partner.includes('agua')
        ? 'agua'
        : partner.includes('telecom')
          ? 'telecom'
          : partner.includes('stream')
            ? 'streaming'
            : 'energia',
      accountRef,
      linkedAt: new Date().toISOString(),
      status: 'validando',
      monthsHistory: 0,
    };
    setData((list) => [created, ...list]);
    setStep(0);
    setAccountRef('');
    setConsent(false);
    setErrors({});
    toast.success('Vínculo enviado para validação', 'POST /api/v1/utilities/link');
    setTimeout(() => {
      setData((list) =>
        list.map((link) =>
          link.linkId === created.linkId
            ? { ...link, status: 'validado', monthsHistory: 11 }
            : link,
        ),
      );
    }, 1_800);
  }

  function revoke(link: UtilityLink) {
    setData((list) =>
      list.map((item) => (item.linkId === link.linkId ? { ...item, status: 'revogado' } : item)),
    );
    toast.undoable(
      'Vínculo removido',
      `DELETE /api/v1/utilities/links/${link.linkId} — o histórico dessa conta sai do cálculo`,
      () =>
        setData((list) =>
          list.map((item) =>
            item.linkId === link.linkId ? { ...item, status: link.status } : item,
          ),
        ),
      'Restaurar vínculo',
    );
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F08-US-FE-01"
      title="Vincular minhas contas de consumo"
      description="Fluxo guiado de vinculação de contas de energia, água, telecom e assinaturas: identificação da conta, autorização explícita de uso, acompanhamento da validação de titularidade e remoção do vínculo a qualquer momento."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Thin-file
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /titular/vinculos
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader
            eyebrow="novo vínculo"
            title="Conectar uma conta"
            description="Três passos: escolher o serviço, identificar a conta e autorizar o uso."
            actions={<Plug size={18} aria-hidden="true" />}
          />
          <Stepper currentIndex={step} steps={wizardSteps} className="mb-5" />

          <div ref={wizardRef} className="lg:max-w-2xl">
            {step === 0 ? (
              <div className="grid gap-4">
                <SelectField
                  label="Serviço"
                  value={partner}
                  onChange={(event) => setPartner(event.target.value)}
                  options={linkablePartners}
                  hint="Apenas parceiros com integração ativa aparecem na lista."
                />
                <Button onClick={next}>Continuar</Button>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4">
                <TextField
                  label="Número da conta ou unidade consumidora"
                  required
                  value={accountRef}
                  error={errors.accountRef}
                  onChange={(event) => {
                    setAccountRef(event.target.value);
                    setErrors({});
                  }}
                  hint="Encontre esse número no topo da sua fatura."
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setStep(0)}>
                    Voltar
                  </Button>
                  <Button onClick={next}>Continuar</Button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4">
                <div className="rounded-md border border-eqx-border bg-eqx-surface-subtle p-4 text-sm">
                  <p className="font-semibold">O que vamos usar</p>
                  <ul className="mt-2 grid gap-1 text-eqx-text-muted">
                    <li>· Datas de vencimento e de pagamento das faturas</li>
                    <li>· Tempo de vínculo com a conta</li>
                    <li>· Situação de titularidade (para confirmar que a conta é sua)</li>
                  </ul>
                  <p className="mt-3 font-semibold">O que não usamos</p>
                  <ul className="mt-2 grid gap-1 text-eqx-text-muted">
                    <li>· Valor detalhado de consumo por período</li>
                    <li>· Conteúdo de mensagens ou dados de navegação</li>
                  </ul>
                </div>
                <div className="grid gap-1">
                  <label className="flex min-h-target items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      aria-invalid={errors.consent ? true : undefined}
                      aria-describedby={errors.consent ? 'consent-error' : undefined}
                      onChange={(event) => {
                        setConsent(event.target.checked);
                        setErrors({});
                      }}
                      className="mt-1 h-5 w-5 accent-eqx-action"
                    />
                    <span>
                      Autorizo o uso do histórico de pagamento desta conta no cálculo do meu score,
                      podendo revogar quando quiser.
                    </span>
                  </label>
                  {errors.consent ? (
                    <p
                      id="consent-error"
                      role="alert"
                      className="text-sm font-semibold text-eqx-danger"
                    >
                      {errors.consent}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button onClick={next}>Concluir vínculo</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <QueryBoundary
          query={query}
          loadingRows={5}
          empty={{
            title: 'Você ainda não tem contas conectadas.',
            description:
              'Sem pelo menos uma conta de consumo validada, seu score depende apenas do histórico bancário tradicional. Use o assistente acima para conectar a primeira conta — a validação de titularidade leva cerca de dois dias úteis.',
          }}
        >
          {(list) => {
            const validated = list.filter((link) => link.status === 'validado');

            return (
              <div className="grid gap-5">
                {validated.length === 0 ? (
                  <Notice tone="warning" title="Nenhuma conta validada">
                    Sem pelo menos uma conta de consumo validada, o modelo thin-file não é executado
                    e seu score depende apenas do histórico bancário tradicional.
                  </Notice>
                ) : (
                  <Notice
                    tone="success"
                    title={`${validated.length} conta(s) alimentando seu score`}
                  >
                    Contas com histórico maior pesam mais. A conta de energia com 14 meses é hoje o
                    seu sinal positivo mais forte.
                  </Notice>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    value={validated.length}
                    label="Vínculos validados"
                    tone="success"
                    icon={<Link2 size={18} aria-hidden="true" />}
                  />
                  <Metric
                    value={list.filter((link) => link.status === 'validando').length}
                    label="Em validação"
                    hint="prazo médio de 2 dias úteis"
                  />
                  <Metric
                    value={`${Math.max(...validated.map((link) => link.monthsHistory), 0)} meses`}
                    label="Maior histórico disponível"
                  />
                </div>

                <Card>
                  <CardHeader
                    eyebrow="GET /api/v1/utilities/links"
                    title="Minhas contas conectadas"
                    description="Situação da validação de titularidade por conta."
                  />
                  <ul className="grid gap-3">
                    {list.map((link) => (
                      <li
                        key={link.linkId}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-eqx-border px-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{link.partner}</p>
                            <Badge tone={statusTone[link.status]}>{statusLabel[link.status]}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-eqx-text-muted">
                            {link.accountRef} · {link.category}
                          </p>
                          <p className="mt-1 text-xs text-eqx-text-muted">
                            Vinculada em {formatDate(link.linkedAt)}
                            {link.monthsHistory > 0
                              ? ` · ${link.monthsHistory} meses de histórico`
                              : ''}
                          </p>
                          {link.failReason ? (
                            <p className="mt-2 text-xs font-semibold text-eqx-danger">
                              {link.failReason}
                            </p>
                          ) : null}
                        </div>
                        {link.status === 'validado' || link.status === 'validando' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Unlink size={14} aria-hidden="true" />}
                            onClick={() => revoke(link)}
                          >
                            Remover
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </ScreenLayout>
  );
}
