/**
 * DTOs e mocks do EP-05 — Contestação Digital & Console B2B.
 * Tipos derivados da seção 8.1 das US-FE PRISMA-EP-05-F01..F09.
 */

import { DEMO_DATE, MARIA, VEGA } from '@/app/story';

/** Máscara de privacidade das telas de operação: prefixo e dois últimos dígitos. */
const MARIA_DOC_MASKED = `${MARIA.document.slice(0, 3)}.***.**${MARIA.document.slice(-2)}`;

const [DISPUTED_RECORD, OPEN_RECORD] = MARIA.records;

/* --------------------------------------- F01 · acompanhamento titular */

export type DisputeStage =
  'recebida' | 'em_analise' | 'aguardando_titular' | 'consulta_fonte' | 'concluida';

export interface DisputeTimelineEvent {
  at: string;
  stage: DisputeStage;
  title: string;
  detail: string;
  actor: 'titular' | 'analista' | 'sistema' | 'fonte';
}

export interface DisputeTracking {
  protocol: string;
  documento: string;
  openedAt: string;
  slaDueAt: string;
  stage: DisputeStage;
  subject: string;
  outcome?: 'procedente' | 'improcedente' | 'parcial';
  nextAction?: { title: string; description: string; dueAt: string };
  timeline: DisputeTimelineEvent[];
}

export const stageOrder: DisputeStage[] = [
  'recebida',
  'em_analise',
  'consulta_fonte',
  'aguardando_titular',
  'concluida',
];

export const stageLabel: Record<DisputeStage, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  consulta_fonte: 'Consulta à fonte',
  aguardando_titular: 'Aguardando titular',
  concluida: 'Concluída',
};

export const tracking: DisputeTracking = {
  protocol: MARIA.disputeProtocol,
  documento: MARIA_DOC_MASKED,
  openedAt: '2026-07-24T14:05:00Z',
  slaDueAt: '2026-07-29T14:05:00Z',
  stage: 'aguardando_titular',
  subject: `Apontamento ${DISPUTED_RECORD.id} (${DISPUTED_RECORD.creditor}) de R$ 1.284,90 alegadamente quitado em 20/07/2026`,
  nextAction: {
    title: 'Enviar comprovante de pagamento',
    description:
      'Anexe o comprovante emitido pelo credor com data, valor e identificação do contrato para concluirmos a análise.',
    dueAt: '2026-07-28T23:59:00Z',
  },
  timeline: [
    {
      at: '2026-07-24T14:05:00Z',
      stage: 'recebida',
      title: 'Contestação registrada',
      detail: `Protocolo ${MARIA.disputeProtocol} gerado no portal do titular.`,
      actor: 'titular',
    },
    {
      at: '2026-07-24T14:06:00Z',
      stage: 'recebida',
      title: 'Identidade confirmada',
      detail: 'Validação por biometria facial concluída com sucesso.',
      actor: 'sistema',
    },
    {
      at: '2026-07-25T09:12:00Z',
      stage: 'em_analise',
      title: 'Análise iniciada',
      detail: 'Caso atribuído à equipe de tratativa com prioridade alta.',
      actor: 'analista',
    },
    {
      at: '2026-07-25T16:40:00Z',
      stage: 'consulta_fonte',
      title: 'Consulta enviada ao credor',
      detail: 'Solicitação de confirmação de baixa enviada à fonte informante.',
      actor: 'sistema',
    },
    {
      at: '2026-07-27T11:02:00Z',
      stage: 'aguardando_titular',
      title: 'Documentação complementar solicitada',
      detail: 'A fonte não localizou a baixa; comprovante do titular é necessário.',
      actor: 'analista',
    },
  ],
};

/* ---------------------------------------------- F02 · fila operacional */

export interface DisputeQueueItem {
  id: string;
  protocol: string;
  documento: string;
  subject: string;
  openedAt: string;
  slaDueAt: string;
  stage: DisputeStage;
  priority: 'critica' | 'alta' | 'media';
  channel: 'portal' | 'sac' | 'b2b' | 'procon';
  assignee?: string;
  evidences: number;
}

export const disputeQueue: DisputeQueueItem[] = [
  {
    id: 'dsp-9011',
    protocol: MARIA.disputeProtocol,
    documento: MARIA_DOC_MASKED,
    subject: `Apontamento ${DISPUTED_RECORD.id} alegadamente quitado`,
    openedAt: '2026-07-24T14:05:00Z',
    slaDueAt: '2026-07-29T14:05:00Z',
    stage: 'aguardando_titular',
    priority: 'alta',
    channel: 'portal',
    assignee: 'ana.lima',
    evidences: 2,
  },
  {
    id: 'dsp-9008',
    protocol: 'CT-2026-448094',
    documento: '987.***.**55',
    subject: 'Dados cadastrais divergentes (endereço)',
    openedAt: '2026-07-26T08:30:00Z',
    slaDueAt: '2026-07-28T08:30:00Z',
    stage: 'em_analise',
    priority: 'critica',
    channel: 'procon',
    assignee: 'ana.lima',
    evidences: 3,
  },
  {
    id: 'dsp-9004',
    protocol: 'CT-2026-448061',
    documento: '456.***.**23',
    subject: 'Consulta indevida ao CPF por cliente B2B',
    openedAt: '2026-07-26T19:14:00Z',
    slaDueAt: '2026-07-31T19:14:00Z',
    stage: 'consulta_fonte',
    priority: 'media',
    channel: 'sac',
    evidences: 1,
  },
  {
    id: 'dsp-8997',
    protocol: 'CT-2026-448012',
    documento: '321.***.**77',
    subject: 'Homônimo: dívida de terceiro no CPF',
    openedAt: '2026-07-27T07:45:00Z',
    slaDueAt: '2026-08-01T07:45:00Z',
    stage: 'recebida',
    priority: 'alta',
    channel: 'b2b',
    evidences: 0,
  },
];

export const disputeOutcomes = [
  { value: 'procedente', label: 'Procedente — remover apontamento' },
  { value: 'parcial', label: 'Parcialmente procedente — corrigir valor' },
  { value: 'improcedente', label: 'Improcedente — manter registro' },
];

/* ------------------------------------------------- F03 · onboarding B2B */

export interface OnboardingDraft {
  cnpj: string;
  razaoSocial: string;
  segment: string;
  repName: string;
  repCpf: string;
  repEmail: string;
  plan: string;
  contractAccepted: boolean;
}

export const onboardingPlans = [
  { value: 'starter', label: 'Starter — 5 mil consultas/mês' },
  { value: 'growth', label: 'Growth — 50 mil consultas/mês' },
  { value: 'escala', label: `${VEGA.plan} — 500 mil consultas/mês` },
];

/** Cadastro que a Vega submete na trilha ep05-b2b; OnboardingPage inicia com este draft. */
export const onboardingPrefill: OnboardingDraft = {
  cnpj: VEGA.document,
  razaoSocial: VEGA.name,
  segment: 'fintech',
  repName: 'Paula Nunes',
  repCpf: '32198765400',
  repEmail: 'paula.nunes@fintechvega.com.br',
  plan: 'escala',
  contractAccepted: false,
};

export const sandboxCredential = {
  clientId: `${VEGA.clientId}-sandbox`,
  clientSecret: 'sk_sbx_9c14b2ea77d0416f8b3e5c0a2d94f6a1',
  baseUrl: 'https://sandbox.api.prisma.equifax.com.br/v1',
  scopes: ['score:read', 'explain:read', 'decision:simulate'],
  rateLimit: '60 req/min',
};

/* --------------------------------------------- F04 · console consumo */

export interface UsagePoint {
  label: string;
  calls: number;
  cost: number;
}

export interface Invoice {
  invoiceId: string;
  period: string;
  amount: number;
  status: 'paga' | 'aberta' | 'vencida';
  dueDate: string;
  calls: number;
}

export interface ContractItem {
  contractId: string;
  product: string;
  plan: string;
  unitPrice: number;
  minimumCalls: number;
  startedAt: string;
  renewalAt: string;
  status: 'ativo' | 'em_renovacao';
}

export interface OrgUser {
  email: string;
  role: 'admin' | 'desenvolvedor' | 'financeiro' | 'leitura';
  lastAccessAt: string;
  mfa: boolean;
}

export const usageSeries: UsagePoint[] = [
  { label: 'Fev', calls: 288_000, cost: 41_040 },
  { label: 'Mar', calls: 312_400, cost: 44_520 },
  { label: 'Abr', calls: 341_800, cost: 48_720 },
  { label: 'Mai', calls: 368_200, cost: 52_480 },
  { label: 'Jun', calls: 402_600, cost: 57_360 },
  { label: 'Jul', calls: 438_900, cost: 62_540 },
];

export const invoices: Invoice[] = [
  {
    invoiceId: 'INV-2026-07',
    period: 'Julho/2026',
    amount: 62_540,
    status: 'aberta',
    dueDate: '2026-08-10',
    calls: 438_900,
  },
  {
    invoiceId: 'INV-2026-06',
    period: 'Junho/2026',
    amount: 57_360,
    status: 'paga',
    dueDate: '2026-07-10',
    calls: 402_600,
  },
  {
    invoiceId: 'INV-2026-05',
    period: 'Maio/2026',
    amount: 52_480,
    status: 'paga',
    dueDate: '2026-06-10',
    calls: 368_200,
  },
  {
    invoiceId: 'INV-2026-04',
    period: 'Abril/2026',
    amount: 48_720,
    status: 'vencida',
    dueDate: '2026-05-10',
    calls: 341_800,
  },
];

export const contracts: ContractItem[] = [
  {
    contractId: 'CTR-4412',
    product: 'Score PF em tempo real',
    plan: VEGA.plan,
    unitPrice: 0.128,
    minimumCalls: 300_000,
    startedAt: '2025-08-01',
    renewalAt: '2026-08-01',
    status: 'em_renovacao',
  },
  {
    contractId: 'CTR-4418',
    product: 'Explicabilidade (explain)',
    plan: 'Growth',
    unitPrice: 0.092,
    minimumCalls: 40_000,
    startedAt: '2025-11-01',
    renewalAt: '2026-11-01',
    status: 'ativo',
  },
  {
    contractId: 'CTR-4451',
    product: 'Copiloto PJ',
    plan: 'Starter',
    unitPrice: 4.9,
    minimumCalls: 500,
    startedAt: '2026-03-01',
    renewalAt: '2027-03-01',
    status: 'ativo',
  },
];

export const orgUsers: OrgUser[] = [
  {
    email: 'paula.nunes@fintechvega.com.br',
    role: 'admin',
    lastAccessAt: '2026-07-27T13:20:00Z',
    mfa: true,
  },
  {
    email: 'dev.integracao@fintechvega.com.br',
    role: 'desenvolvedor',
    lastAccessAt: '2026-07-27T13:02:00Z',
    mfa: true,
  },
  {
    email: 'financeiro@fintechvega.com.br',
    role: 'financeiro',
    lastAccessAt: '2026-07-25T11:40:00Z',
    mfa: false,
  },
  {
    email: 'auditoria@fintechvega.com.br',
    role: 'leitura',
    lastAccessAt: '2026-07-20T09:15:00Z',
    mfa: true,
  },
];

/* ----------------------------------------- F05 · portal do titular */

export interface TitularRecord {
  recordId: string;
  type: 'apontamento' | 'consulta' | 'cadastro' | 'score';
  title: string;
  detail: string;
  amount?: number;
  source: string;
  occurredAt: string;
  disputable: boolean;
}

/** Exatamente os dois apontamentos da fixture: o primeiro já está sob contestação. */
export const titularRecords: TitularRecord[] = [
  {
    recordId: DISPUTED_RECORD.id,
    type: 'apontamento',
    title: 'Apontamento negativo ativo · em contestação',
    detail: `Registro ${DISPUTED_RECORD.id} · aberto em ${DISPUTED_RECORD.openedAt} · protocolo ${DISPUTED_RECORD.protocol}`,
    amount: DISPUTED_RECORD.amount,
    source: DISPUTED_RECORD.creditor,
    occurredAt: '2026-03-12T00:00:00Z',
    disputable: false,
  },
  {
    recordId: OPEN_RECORD.id,
    type: 'apontamento',
    title: 'Apontamento negativo ativo',
    detail: `Registro ${OPEN_RECORD.id} · aberto em ${OPEN_RECORD.openedAt}`,
    amount: OPEN_RECORD.amount,
    source: OPEN_RECORD.creditor,
    occurredAt: '2026-06-02T00:00:00Z',
    disputable: true,
  },
  {
    recordId: 'rec-1003',
    type: 'consulta',
    title: 'Consulta ao seu CPF',
    detail: 'Banco Parceiro S.A. · finalidade: concessão de crédito',
    source: 'Banco Parceiro S.A.',
    occurredAt: '2026-07-27T11:04:00Z',
    disputable: true,
  },
  {
    recordId: 'rec-1004',
    type: 'cadastro',
    title: 'Endereço cadastral',
    detail: 'Rua das Acácias, 120, ap. 42 — São Paulo/SP',
    source: 'Base cadastral Prisma',
    occurredAt: '2026-01-15T00:00:00Z',
    disputable: true,
  },
  {
    recordId: 'rec-1005',
    type: 'score',
    title: `Score atual: ${MARIA.score} pontos`,
    detail: `Atualizado em ${DEMO_DATE} com base em 6 fatores`,
    source: `Modelo score-pf ${MARIA.modelVersion}`,
    occurredAt: '2026-07-27T11:04:00Z',
    disputable: false,
  },
];

export const disputeReasons = [
  { value: 'quitado', label: 'Dívida já foi paga' },
  { value: 'desconhecido', label: 'Não reconheço esta dívida' },
  { value: 'valor', label: 'O valor está incorreto' },
  { value: 'homonimo', label: 'É de outra pessoa com nome parecido' },
  { value: 'consulta', label: 'Não autorizei esta consulta' },
  { value: 'cadastro', label: 'Meus dados cadastrais estão errados' },
];

/* --------------------------------------------------- F06 · risco SLA */

export interface SlaCase {
  id: string;
  protocol: string;
  hoursRemaining: number;
  slaHours: number;
  band: 'no_prazo' | 'atencao' | 'risco' | 'estourado';
  assignee?: string;
  stage: DisputeStage;
  channel: string;
}

export const slaCases: SlaCase[] = [
  {
    id: 'dsp-9008',
    protocol: 'CT-2026-448094',
    hoursRemaining: 6,
    slaHours: 48,
    band: 'risco',
    assignee: 'ana.lima',
    stage: 'em_analise',
    channel: 'procon',
  },
  {
    id: 'dsp-9011',
    protocol: MARIA.disputeProtocol,
    hoursRemaining: 38,
    slaHours: 120,
    band: 'atencao',
    assignee: 'ana.lima',
    stage: 'aguardando_titular',
    channel: 'portal',
  },
  {
    id: 'dsp-9004',
    protocol: 'CT-2026-448061',
    hoursRemaining: 96,
    slaHours: 120,
    band: 'no_prazo',
    stage: 'consulta_fonte',
    channel: 'sac',
  },
  {
    id: 'dsp-8997',
    protocol: 'CT-2026-448012',
    hoursRemaining: 118,
    slaHours: 120,
    band: 'no_prazo',
    stage: 'recebida',
    channel: 'b2b',
  },
  {
    id: 'dsp-8990',
    protocol: 'CT-2026-447980',
    hoursRemaining: -4,
    slaHours: 48,
    band: 'estourado',
    assignee: 'bruno.reis',
    stage: 'em_analise',
    channel: 'procon',
  },
];

export interface Escalation {
  at: string;
  protocol: string;
  from: string;
  to: string;
  reason: string;
}

export const escalations: Escalation[] = [
  {
    at: '2026-07-27T13:00:00Z',
    protocol: 'CT-2026-447980',
    from: 'bruno.reis',
    to: 'coordenacao.disputas',
    reason: 'SLA estourado em 4 h',
  },
  {
    at: '2026-07-27T14:00:00Z',
    protocol: 'CT-2026-448094',
    from: 'fila geral',
    to: 'ana.lima',
    reason: 'Canal Procon com SLA de 48 h',
  },
  {
    at: '2026-07-26T09:00:00Z',
    protocol: 'CT-2026-448061',
    from: 'fila geral',
    to: 'fila especializada',
    reason: 'Consulta indevida requer análise de acesso',
  },
];

export const slaPolicies = [
  {
    channel: 'Procon',
    slaHours: 48,
    escalateAtPct: 75,
    notify: 'coordenacao.disputas',
  },
  {
    channel: 'Portal do titular',
    slaHours: 120,
    escalateAtPct: 80,
    notify: 'time.disputas',
  },
  { channel: 'SAC', slaHours: 120, escalateAtPct: 80, notify: 'time.disputas' },
  {
    channel: 'API B2B',
    slaHours: 120,
    escalateAtPct: 85,
    notify: 'time.disputas',
  },
];

/* ------------------------------------------------ F07 · credenciais */

export interface Credential {
  id: string;
  name: string;
  environment: 'sandbox' | 'producao';
  clientId: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  scopes: string[];
  status: 'ativa' | 'rotacionando' | 'revogada';
}

export const credentials: Credential[] = [
  {
    id: 'cred-01',
    name: 'Integração core bancário',
    environment: 'producao',
    clientId: VEGA.clientId,
    createdAt: '2025-09-14T10:00:00Z',
    lastUsedAt: '2026-07-27T13:58:00Z',
    expiresAt: '2026-09-14T10:00:00Z',
    scopes: ['score:read', 'explain:read', 'decision:create'],
    status: 'ativa',
  },
  {
    id: 'cred-02',
    name: 'App mobile — leitura',
    environment: 'producao',
    clientId: `${VEGA.clientId}-mobile`,
    createdAt: '2026-02-02T09:00:00Z',
    lastUsedAt: '2026-07-27T13:11:00Z',
    expiresAt: '2026-08-02T09:00:00Z',
    scopes: ['score:read'],
    status: 'ativa',
  },
  {
    id: 'cred-03',
    name: 'Sandbox squad integração',
    environment: 'sandbox',
    clientId: sandboxCredential.clientId,
    createdAt: '2026-06-20T14:30:00Z',
    lastUsedAt: '2026-07-26T16:40:00Z',
    expiresAt: '2026-12-20T14:30:00Z',
    scopes: ['score:read', 'explain:read', 'decision:simulate'],
    status: 'ativa',
  },
  {
    id: 'cred-04',
    name: 'Piloto antifraude (desativado)',
    environment: 'producao',
    clientId: `${VEGA.clientId}-antifraude`,
    createdAt: '2025-05-10T08:00:00Z',
    expiresAt: '2026-05-10T08:00:00Z',
    scopes: ['score:read'],
    status: 'revogada',
  },
];

export const availableScopes = [
  'score:read',
  'explain:read',
  'decision:create',
  'decision:simulate',
  'dispute:write',
  'console:read',
];

/* --------------------------------------------------- F08 · evidências */

export interface Attachment {
  attachmentId: string;
  fileName: string;
  mime: string;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: 'titular' | 'analista' | 'fonte';
  scanStatus: 'limpo' | 'analisando' | 'bloqueado';
  description: string;
}

export const attachments: Attachment[] = [
  {
    attachmentId: 'att-01',
    fileName: 'comprovante-pagamento.pdf',
    mime: 'application/pdf',
    sizeKb: 412,
    uploadedAt: '2026-07-24T14:10:00Z',
    uploadedBy: 'titular',
    scanStatus: 'limpo',
    description: 'Comprovante de pagamento emitido pelo credor em 20/07/2026.',
  },
  {
    attachmentId: 'att-02',
    fileName: 'print-extrato-app.png',
    mime: 'image/png',
    sizeKb: 1_180,
    uploadedAt: '2026-07-24T14:12:00Z',
    uploadedBy: 'titular',
    scanStatus: 'limpo',
    description: 'Captura de tela do extrato bancário com o débito identificado.',
  },
  {
    attachmentId: 'att-03',
    fileName: 'resposta-fonte-informante.pdf',
    mime: 'application/pdf',
    sizeKb: 208,
    uploadedAt: '2026-07-26T10:22:00Z',
    uploadedBy: 'fonte',
    scanStatus: 'limpo',
    description: 'Resposta do credor informando que não localizou a baixa.',
  },
  {
    attachmentId: 'att-04',
    fileName: 'anexo-suspeito.zip',
    mime: 'application/zip',
    sizeKb: 4_820,
    uploadedAt: '2026-07-27T08:04:00Z',
    uploadedBy: 'titular',
    scanStatus: 'bloqueado',
    description: 'Arquivo compactado bloqueado pelo antivírus; solicitar reenvio em PDF.',
  },
];

/* ------------------------------------------------ F09 · desvio de SAC */

export interface DeflectionPoint {
  label: string;
  digitalPct: number;
  humanCalls: number;
  digitalCalls: number;
}

export const deflectionSeries: DeflectionPoint[] = [
  { label: 'Fev', digitalPct: 18.4, humanCalls: 41_200, digitalCalls: 9_280 },
  { label: 'Mar', digitalPct: 24.1, humanCalls: 38_600, digitalCalls: 12_260 },
  { label: 'Abr', digitalPct: 31.8, humanCalls: 34_100, digitalCalls: 15_890 },
  { label: 'Mai', digitalPct: 39.2, humanCalls: 30_400, digitalCalls: 19_600 },
  { label: 'Jun', digitalPct: 46.7, humanCalls: 26_800, digitalCalls: 23_480 },
  { label: 'Jul', digitalPct: 52.3, humanCalls: 23_900, digitalCalls: 26_210 },
];

export const deflectionFunnel = [
  { step: 'Acessou o portal', value: 68_400 },
  { step: 'Confirmou identidade', value: 52_180 },
  { step: 'Visualizou registros', value: 44_900 },
  { step: 'Iniciou contestação', value: 31_200 },
  { step: 'Concluiu com protocolo', value: 26_210 },
];

export const sacEconomics = {
  costPerHumanCall: 14.8,
  costPerDigitalCall: 0.92,
  baselineDigitalPct: 18.4,
  monthSavings: 361_000,
  yearToDateSavings: 1_842_000,
};
