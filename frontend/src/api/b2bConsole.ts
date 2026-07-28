/**
 * API client — Console B2B (onboarding, credenciais, consumo, analytics).
 */
import { httpClient } from '@/lib/httpClient';
import { toNumber } from '@/lib/number';
import type {
  ContractItem,
  Credential,
  Invoice,
  UsagePoint,
} from '@/epics/contestacao/data';
import { sacEconomics } from '@/epics/contestacao/data';

const TENANT_KEY = 'prisma.b2b.tenantId';
const CRED_KEY = 'prisma.b2b.credentials';

export function getTenantId(): string | null {
  try {
    return sessionStorage.getItem(TENANT_KEY);
  } catch {
    return null;
  }
}

export function setTenantId(id: string) {
  sessionStorage.setItem(TENANT_KEY, id);
}

function rememberedCredentials(): Credential[] {
  try {
    const raw = sessionStorage.getItem(CRED_KEY);
    return raw ? (JSON.parse(raw) as Credential[]) : [];
  } catch {
    return [];
  }
}

function rememberCredential(cred: Credential) {
  const next = [cred, ...rememberedCredentials().filter((c) => c.id !== cred.id)];
  sessionStorage.setItem(CRED_KEY, JSON.stringify(next.slice(0, 20)));
}

/* -------------------------------------------------------------------------- */
/* Onboarding                                                                 */
/* -------------------------------------------------------------------------- */

export async function startOnboardingLive(input: {
  cnpj: string;
  legalName: string;
  representative: string;
}): Promise<{ id: string; status: string }> {
  return httpClient('/api/v1/onboarding/start', {
    method: 'POST',
    body: {
      cnpj: input.cnpj,
      legalName: input.legalName,
      representative: input.representative,
    },
  });
}

export async function verifyOnboardingLive(id: string): Promise<{ id: string; status: string }> {
  return httpClient(`/api/v1/onboarding/${encodeURIComponent(id)}/verify`, {
    method: 'POST',
    body: {},
  });
}

export async function completeOnboardingLive(input: {
  id: string;
  contractVersion: string;
  billingEmail?: string;
}): Promise<{
  tenantId: string;
  credential: { id: string; clientId: string; secret: string; scopes: string[]; env: string };
}> {
  const res = await httpClient<{
    onboardingId: string;
    status: string;
    tenantId: string;
    credential: {
      id: string;
      clientId: string;
      secret: string;
      scopes: string[];
      env: string;
    };
    durationSeconds: number;
  }>(`/api/v1/onboarding/${encodeURIComponent(input.id)}/complete`, {
    method: 'POST',
    body: {
      contractVersion: input.contractVersion,
      accepted: true,
      billingEmail: input.billingEmail,
    },
  });
  setTenantId(res.tenantId);
  rememberCredential({
    id: res.credential.id,
    name: 'Credencial onboarding',
    environment: res.credential.env?.toLowerCase().includes('prod') ? 'producao' : 'sandbox',
    clientId: res.credential.clientId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 86400_000).toISOString(),
    scopes: res.credential.scopes ?? [],
    status: 'ativa',
  });
  return { tenantId: res.tenantId, credential: res.credential };
}

/* -------------------------------------------------------------------------- */
/* Credentials                                                                */
/* -------------------------------------------------------------------------- */

export async function fetchCredentialsLive(): Promise<Credential[]> {
  // BE lab não lista credenciais — usa sessão + create/rotate.
  return rememberedCredentials();
}

export async function createCredentialLive(input: {
  name: string;
  environment: 'sandbox' | 'producao';
  scopes: string[];
}): Promise<Credential & { secret?: string }> {
  const res = await httpClient<{
    id: string;
    clientId: string;
    secret: string;
    scopes: string[];
    env: string;
    status: string;
  }>('/api/v1/credentials', {
    method: 'POST',
    body: {
      tenantId: getTenantId() ?? undefined,
      scopes: input.scopes,
      env: input.environment === 'producao' ? 'PROD' : 'SANDBOX',
    },
  });
  const cred: Credential = {
    id: res.id,
    name: input.name,
    environment: input.environment,
    clientId: res.clientId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 86400_000).toISOString(),
    scopes: res.scopes ?? input.scopes,
    status: 'ativa',
  };
  rememberCredential(cred);
  return { ...cred, secret: res.secret };
}

export async function rotateCredentialLive(id: string): Promise<Credential & { secret?: string }> {
  const res = await httpClient<{
    id: string;
    clientId: string;
    secret: string;
    scopes: string[];
    status: string;
  }>(`/api/v1/credentials/${encodeURIComponent(id)}/rotate`, {
    method: 'POST',
    body: { reason: 'Rotação via Prisma Equifax' },
  });
  const prev = rememberedCredentials().find((c) => c.id === id);
  const cred: Credential = {
    id: res.id,
    name: prev?.name ?? 'Credencial rotacionada',
    environment: prev?.environment ?? 'sandbox',
    clientId: res.clientId,
    createdAt: new Date().toISOString(),
    lastUsedAt: prev?.lastUsedAt,
    expiresAt: new Date(Date.now() + 180 * 86400_000).toISOString(),
    scopes: res.scopes ?? prev?.scopes ?? [],
    status: 'ativa',
  };
  rememberCredential(cred);
  return { ...cred, secret: res.secret };
}

export async function revokeCredentialLive(id: string): Promise<void> {
  await httpClient(`/api/v1/credentials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    empty: true,
  });
  const next = rememberedCredentials().map((c) =>
    c.id === id ? { ...c, status: 'revogada' as const } : c,
  );
  sessionStorage.setItem(CRED_KEY, JSON.stringify(next));
}

/* -------------------------------------------------------------------------- */
/* Console usage / invoices / contracts                                       */
/* -------------------------------------------------------------------------- */

export async function fetchConsoleLive(): Promise<{
  usage: UsagePoint[];
  invoices: Invoice[];
  contracts: ContractItem[];
}> {
  const qs = getTenantId() ? `?tenantId=${encodeURIComponent(getTenantId()!)}` : '';
  const [usage, invoices, contracts] = await Promise.all([
    httpClient<{
      tenantId: string;
      dataFreshnessAt: string;
      items: {
        productCode: string;
        environment: string;
        callCount: number | string;
        amount: number | string;
        currency: string;
      }[];
      totals: { callCount: number | string; amount: number | string };
    }>(`/api/v1/console/usage${qs}`),
    httpClient<{
      items: {
        id: string;
        invoiceNumber: string;
        periodLabel: string;
        amount: number | string;
        currency: string;
        status: string;
        issuedAt: string;
      }[];
    }>(`/api/v1/console/invoices${qs}`),
    httpClient<{
      items: {
        id: string;
        contractCode: string;
        version: string;
        status: string;
        acceptedAt: string;
      }[];
    }>(`/api/v1/console/contracts${qs}`),
  ]);

  const usagePoints: UsagePoint[] = (usage.items ?? []).map((item) => ({
    label: item.productCode || item.environment || 'uso',
    calls: toNumber(item.callCount),
    cost: toNumber(item.amount),
  }));

  if (!usagePoints.length && usage.totals) {
    usagePoints.push({
      label: 'Total',
      calls: toNumber(usage.totals.callCount),
      cost: toNumber(usage.totals.amount),
    });
  }

  const mappedInvoices: Invoice[] = (invoices.items ?? []).map((item) => {
    const st = (item.status || '').toUpperCase();
    let status: Invoice['status'] = 'aberta';
    if (st.includes('PAID') || st.includes('PAGA')) status = 'paga';
    else if (st.includes('OVER') || st.includes('VENC')) status = 'vencida';
    return {
      invoiceId: item.invoiceNumber || item.id,
      period: item.periodLabel,
      amount: toNumber(item.amount),
      status,
      dueDate: item.issuedAt?.slice(0, 10) ?? '',
      calls: 0,
    };
  });

  const mappedContracts: ContractItem[] = (contracts.items ?? []).map((item) => {
    const st = (item.status || '').toUpperCase();
    return {
      contractId: item.contractCode || item.id,
      product: item.contractCode || 'Contrato',
      plan: item.version || '—',
      unitPrice: 0,
      minimumCalls: 0,
      startedAt: item.acceptedAt?.slice(0, 10) ?? '',
      renewalAt: '',
      status: st.includes('RENEW') ? 'em_renovacao' : 'ativo',
    };
  });

  return {
    usage: usagePoints,
    invoices: mappedInvoices,
    contracts: mappedContracts,
  };
}

/* -------------------------------------------------------------------------- */
/* Analytics / deflection                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchDeflectionLive(): Promise<{
  deflectionSeries: { label: string; digitalPct: number; humanCalls: number; digitalCalls: number }[];
  deflectionFunnel: { step: string; value: number }[];
  sacEconomics: typeof sacEconomics;
}> {
  const [deflection, sac, baseline] = await Promise.all([
    httpClient<{
      from: string;
      to: string;
      deflectionRate: number;
      deflectedCases: number;
      totalCases: number;
      reclassified48h: number;
      baselineDeflectionRate: number;
      deltaPp: number;
    }>('/api/v1/analytics/deflection'),
    httpClient<{
      from: string;
      to: string;
      channels: { channel: string; avgCost: number; currency: string }[];
    }>('/api/v1/analytics/sac-cost'),
    httpClient<{
      label: string;
      items: {
        metricKey: string;
        channel: string;
        value: number;
        periodFrom: string;
        periodTo: string;
      }[];
    }>('/api/v1/analytics/baseline').catch(() => ({ label: 'baseline', items: [] })),
  ]);

  const rate =
    deflection.deflectionRate <= 1
      ? deflection.deflectionRate * 100
      : deflection.deflectionRate;
  const baselineRate =
    deflection.baselineDeflectionRate <= 1
      ? deflection.baselineDeflectionRate * 100
      : deflection.baselineDeflectionRate;

  const human = Math.max(0, deflection.totalCases - deflection.deflectedCases);
  const digital = deflection.deflectedCases;

  const humanCost =
    sac.channels?.find((c) => c.channel.toLowerCase().includes('human') || c.channel.toLowerCase().includes('sac'))
      ?.avgCost ?? sacEconomics.costPerHumanCall;
  const digitalCost =
    sac.channels?.find((c) => c.channel.toLowerCase().includes('digit') || c.channel.toLowerCase().includes('portal'))
      ?.avgCost ?? sacEconomics.costPerDigitalCall;

  return {
    deflectionSeries: [
      {
        label: deflection.to?.slice(5, 7) || 'Atual',
        digitalPct: rate,
        humanCalls: human,
        digitalCalls: digital,
      },
      {
        label: 'Base',
        digitalPct: baselineRate,
        humanCalls: Math.round(human * 1.2),
        digitalCalls: Math.round(digital * 0.7),
      },
    ],
    deflectionFunnel: [
      { step: 'Casos totais', value: deflection.totalCases },
      { step: 'Desviados digital', value: deflection.deflectedCases },
      { step: 'Reclassificados 48h', value: deflection.reclassified48h },
      ...(baseline.items ?? []).slice(0, 2).map((i) => ({
        step: i.metricKey,
        value: Math.round(i.value),
      })),
    ],
    sacEconomics: {
      costPerHumanCall: humanCost,
      costPerDigitalCall: digitalCost,
      baselineDigitalPct: baselineRate,
      monthSavings: Math.round((humanCost - digitalCost) * digital),
      yearToDateSavings: Math.round((humanCost - digitalCost) * digital * 6),
    },
  };
}
