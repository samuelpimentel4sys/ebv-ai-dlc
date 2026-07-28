import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  KeyValueList,
  Notice,
  SelectField,
  Stepper,
  TextField,
  useToast,
} from '@/ds';
import { VEGA } from '@/app/story';
import {
  onboardingPlans,
  onboardingPrefill,
  sandboxCredential,
  type OnboardingDraft,
} from '@/epics/contestacao/data';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

const steps = [
  {
    id: 'cnpj',
    label: 'Identificação da empresa',
    description: 'CNPJ e segmento',
  },
  {
    id: 'rep',
    label: 'Representante legal',
    description: 'dados e verificação',
  },
  {
    id: 'contract',
    label: 'Contrato e plano',
    description: 'aceite eletrônico',
  },
  {
    id: 'credential',
    label: 'Credencial sandbox',
    description: 'acesso imediato',
  },
];

const summaryTitle = ['Dados incompletos', 'Representante incompleto', 'Aceite pendente'] as const;

export function OnboardingPage() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<OnboardingDraft>(onboardingPrefill);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(formRef.current);
  }, [focusNonce]);

  function update<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (step === 0) {
      if (draft.cnpj.replace(/\D/g, '').length !== 14) {
        found.cnpj = 'Informe um CNPJ com 14 dígitos, sem pontos, barra ou traço.';
      }
      if (draft.razaoSocial.trim().length < 3) {
        found.razaoSocial = 'Informe a razão social como consta no cartão CNPJ.';
      }
    }
    if (step === 1) {
      if (draft.repName.trim().length < 3) {
        found.repName = 'Informe o nome completo do representante legal.';
      }
      if (draft.repCpf.replace(/\D/g, '').length !== 11) {
        found.repCpf = 'Informe um CPF com 11 dígitos, sem pontos ou traço.';
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.repEmail.trim())) {
        found.repEmail = 'Informe um e-mail corporativo válido, no formato nome@empresa.com.br.';
      }
    }
    if (step === 2 && !draft.contractAccepted) {
      found.contractAccepted =
        'Marque o aceite do contrato para concluir a contratação — sem ele não emitimos credencial.';
    }
    return found;
  }

  function next() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShowSummary(true);
      setFocusNonce((value) => value + 1);
      return;
    }
    setShowSummary(false);
    if (step === 0) toast.success('CNPJ validado', 'POST /api/v1/onboarding/start');
    if (step === 1)
      toast.success('Representante verificado', 'POST /api/v1/onboarding/{id}/verify');
    if (step === 2) toast.success('Contrato aceito', 'POST /api/v1/onboarding/{id}/complete');
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  const summary =
    showSummary && step < 3 ? (
      <Notice tone="danger" title={summaryTitle[step]}>
        Corrija os campos destacados abaixo para continuar. Nada do que você já preencheu é perdido.
      </Notice>
    ) : null;

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F03-US-FE-01"
      title="Contratação self-service B2B"
      description="Fluxo de contratação sem intervenção comercial: validação de CNPJ, verificação do representante legal, aceite eletrônico do contrato e liberação imediata de credencial de sandbox."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Console B2B
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /b2b/onboarding
        </Badge>,
      ]}
    >
      <div className="grid gap-5">
        <Stepper currentIndex={step} steps={steps} />

        {step === 0 ? (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader
              eyebrow="etapa 1"
              title="Identificação da empresa"
              description="Consultamos a situação cadastral na Receita Federal automaticamente."
            />
            <div className="grid gap-4" ref={formRef}>
              {summary}
              <TextField
                label="CNPJ"
                required
                inputMode="numeric"
                placeholder={VEGA.document}
                value={draft.cnpj}
                error={errors.cnpj}
                onChange={(event) => update('cnpj', event.target.value)}
              />
              <TextField
                label="Razão social"
                required
                placeholder={VEGA.name}
                value={draft.razaoSocial}
                error={errors.razaoSocial}
                onChange={(event) => update('razaoSocial', event.target.value)}
              />
              <SelectField
                label="Segmento"
                value={draft.segment}
                onChange={(event) => update('segment', event.target.value)}
                options={[
                  { value: 'banco', label: 'Banco ou financeira' },
                  { value: 'fintech', label: 'Fintech' },
                  { value: 'varejo', label: 'Varejo' },
                  { value: 'servicos', label: 'Serviços' },
                ]}
              />
              <Button onClick={next}>Validar CNPJ e continuar</Button>
            </div>
          </Card>
        ) : null}

        {step === 1 ? (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader
              eyebrow="etapa 2"
              title="Representante legal"
              description="A verificação usa biometria e checagem de poderes no contrato social."
            />
            <div className="grid gap-4" ref={formRef}>
              {summary}
              <TextField
                label="Nome completo"
                required
                value={draft.repName}
                error={errors.repName}
                onChange={(event) => update('repName', event.target.value)}
              />
              <TextField
                label="CPF"
                required
                inputMode="numeric"
                value={draft.repCpf}
                error={errors.repCpf}
                onChange={(event) => update('repCpf', event.target.value)}
              />
              <TextField
                label="E-mail corporativo"
                required
                type="email"
                value={draft.repEmail}
                error={errors.repEmail}
                onChange={(event) => update('repEmail', event.target.value)}
                hint="Receberá o link de verificação e o contrato para aceite."
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button icon={<ShieldCheck size={16} aria-hidden="true" />} onClick={next}>
                  Verificar representante
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader
              eyebrow="etapa 3"
              title="Plano e contrato"
              description="O plano pode ser alterado depois no console, sem custo de migração."
            />
            <div className="grid gap-4" ref={formRef}>
              {summary}
              <SelectField
                label="Plano inicial"
                value={draft.plan}
                onChange={(event) => update('plan', event.target.value)}
                options={onboardingPlans}
              />
              <div className="max-h-56 overflow-y-auto eqx-scrollbar rounded-md border border-eqx-border bg-eqx-surface-subtle p-4 text-sm">
                <p className="font-semibold">Termos essenciais</p>
                <ul className="mt-2 grid gap-2 text-eqx-text-muted">
                  <li>· Uso das APIs restrito às finalidades declaradas no cadastro.</li>
                  <li>· Consulta a dados de titular exige base legal e registro de finalidade.</li>
                  <li>· Faturamento mensal por volume, com mínimo contratado do plano.</li>
                  <li>· Suspensão em caso de uso divergente da finalidade declarada.</li>
                  <li>· Retenção de logs de acesso por 5 anos para fins de auditoria.</li>
                </ul>
              </div>
              <div className="grid gap-2">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.contractAccepted}
                    aria-invalid={errors.contractAccepted ? true : undefined}
                    onChange={(event) => update('contractAccepted', event.target.checked)}
                    className="mt-1 h-5 w-5 accent-eqx-action"
                  />
                  <span>
                    Declaro que tenho poderes para representar a empresa e aceito os termos do
                    contrato de prestação de serviços.
                  </span>
                </label>
                {errors.contractAccepted ? (
                  <p role="alert" className="text-sm font-semibold text-eqx-danger">
                    {errors.contractAccepted}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={next}>Aceitar e concluir</Button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 3 ? (
          <div className="mx-auto grid w-full max-w-2xl gap-4">
            <Notice tone="success" title="Contratação concluída">
              A credencial de sandbox está ativa. A credencial de produção é liberada após o
              primeiro teste bem-sucedido e a confirmação de finalidade de uso.
            </Notice>
            <Card accent="action">
              <CardHeader
                eyebrow="credencial sandbox"
                title="Acesso imediato ao ambiente de testes"
                actions={<KeyRound size={18} aria-hidden="true" />}
              />
              <KeyValueList
                columns={1}
                items={[
                  {
                    label: 'Base URL',
                    value: <code className="text-xs">{sandboxCredential.baseUrl}</code>,
                  },
                  {
                    label: 'Client ID',
                    value: <code className="text-xs">{sandboxCredential.clientId}</code>,
                  },
                  {
                    label: 'Client secret',
                    value: (
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="text-xs">{sandboxCredential.clientSecret}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Copy size={14} aria-hidden="true" />}
                          onClick={() =>
                            toast.success('Secret copiado', 'Visível apenas nesta tela')
                          }
                        >
                          Copiar
                        </Button>
                      </span>
                    ),
                  },
                  {
                    label: 'Escopos',
                    value: sandboxCredential.scopes.join(', '),
                  },
                  {
                    label: 'Limite de taxa',
                    value: sandboxCredential.rateLimit,
                  },
                ]}
              />
              <Notice tone="warning" className="mt-4" title="Guarde o secret agora">
                Por segurança, o secret não é exibido novamente. Em caso de perda, gere uma rotação
                na tela de credenciais.
              </Notice>
              <div className="mt-4 grid gap-2">
                <p className="text-sm text-eqx-text-muted">
                  Próximos passos da integração: emitir a credencial de produção, fazer a primeira
                  consulta e acompanhar o consumo no console.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/b2b/credenciais" className={buttonClass()}>
                    <KeyRound size={16} aria-hidden="true" />
                    Gerenciar credenciais
                  </Link>
                  <Link to="/integracao/playground/decisoes" className={buttonClass('secondary')}>
                    Fazer a primeira consulta
                  </Link>
                  <Link to="/b2b/console" className={buttonClass('ghost')}>
                    <Activity size={16} aria-hidden="true" />
                    Acompanhar consumo
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </ScreenLayout>
  );
}
