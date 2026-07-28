/**
 * DTOs e mocks do EP-01 — Score Vivo Event-Driven & Point-in-Time.
 * Tipos espelham a seção 8.1 das US-FE PRISMA-EP-01-F01..F10.
 */

import { DEMO_TIMESTAMP, MARIA } from '@/app/story';

/** Máscara de privacidade das telas de auditoria: prefixo e dois últimos dígitos. */
const MARIA_DOC_MASKED = `${MARIA.document.slice(0, 3)}.***.**${MARIA.document.slice(-2)}`;

/* --------------------------------------------- F01 · saúde do barramento */

export type TopicStatus = 'healthy' | 'warning' | 'critical';

export interface TopicHealth {
  topic: string;
  consumerGroup: string;
  partitions: number;
  lagMessages: number;
  lagSeconds: number;
  throughputPerMin: number;
  status: TopicStatus;
  schemaVersion: string;
}

export interface QuarantineEvent {
  eventId: string;
  topic: string;
  reason: string;
  occurredAt: string;
  payloadSize: number;
  retries: number;
}

export interface StreamHealthResponse {
  updatedAt: string;
  lagThresholdSeconds: number;
  topics: TopicHealth[];
  quarantine: QuarantineEvent[];
  throughputSeries: { label: string; value: number }[];
}

export function streamHealth(): StreamHealthResponse {
  return {
    updatedAt: DEMO_TIMESTAMP,
    lagThresholdSeconds: 30,
    topics: [
      {
        topic: 'credit.events.payment.v2',
        consumerGroup: 'score-recalc',
        partitions: 24,
        lagMessages: 1840,
        lagSeconds: 8,
        throughputPerMin: 184_500,
        status: 'healthy',
        schemaVersion: 'v2.3',
      },
      {
        topic: 'credit.events.contract.v1',
        consumerGroup: 'score-recalc',
        partitions: 12,
        lagMessages: 620,
        lagSeconds: 4,
        throughputPerMin: 42_300,
        status: 'healthy',
        schemaVersion: 'v1.8',
      },
      {
        topic: 'credit.events.negative.v3',
        consumerGroup: 'score-recalc',
        partitions: 12,
        lagMessages: 41_200,
        lagSeconds: 47,
        throughputPerMin: 96_800,
        status: 'critical',
        schemaVersion: 'v3.1',
      },
      {
        topic: 'credit.events.openfinance.v1',
        consumerGroup: 'feature-store-writer',
        partitions: 8,
        lagMessages: 9_400,
        lagSeconds: 22,
        throughputPerMin: 31_200,
        status: 'warning',
        schemaVersion: 'v1.2',
      },
      {
        topic: 'credit.events.identity.v1',
        consumerGroup: 'identity-resolver',
        partitions: 6,
        lagMessages: 210,
        lagSeconds: 2,
        throughputPerMin: 8_400,
        status: 'healthy',
        schemaVersion: 'v1.4',
      },
      {
        topic: 'credit.decisions.emitted.v2',
        consumerGroup: 'audit-writer',
        partitions: 16,
        lagMessages: 75,
        lagSeconds: 1,
        throughputPerMin: 128_900,
        status: 'healthy',
        schemaVersion: 'v2.0',
      },
    ],
    quarantine: [
      {
        eventId: 'evt-9f2c41a8',
        topic: 'credit.events.negative.v3',
        reason: 'Schema incompatível: campo obrigatório amountCents ausente',
        occurredAt: '2026-07-27T12:41:08Z',
        payloadSize: 812,
        retries: 3,
      },
      {
        eventId: 'evt-71bd0e33',
        topic: 'credit.events.payment.v2',
        reason: 'documento fora do padrão (CPF com 10 dígitos)',
        occurredAt: '2026-07-27T12:38:52Z',
        payloadSize: 640,
        retries: 2,
      },
      {
        eventId: 'evt-3ac7d190',
        topic: 'credit.events.openfinance.v1',
        reason: 'Consentimento expirado no momento da ingestão',
        occurredAt: '2026-07-27T12:22:17Z',
        payloadSize: 1_284,
        retries: 5,
      },
      {
        eventId: 'evt-52ee9b04',
        topic: 'credit.events.contract.v1',
        reason: 'Ordenação violada: eventTime anterior ao último snapshot',
        occurredAt: '2026-07-27T11:58:03Z',
        payloadSize: 998,
        retries: 1,
      },
    ],
    throughputSeries: [
      { label: '12:00', value: 428 },
      { label: '12:05', value: 441 },
      { label: '12:10', value: 462 },
      { label: '12:15', value: 455 },
      { label: '12:20', value: 481 },
      { label: '12:25', value: 502 },
      { label: '12:30', value: 493 },
      { label: '12:35', value: 468 },
      { label: '12:40', value: 492 },
    ],
  };
}

/* ------------------------------------------ F02 · catálogo de atributos */

export interface FeatureCatalogItem {
  name: string;
  entity: 'CPF' | 'CNPJ';
  dataType: 'int' | 'decimal' | 'bool' | 'string' | 'timestamp';
  domain: string;
  freshnessMinutes: number;
  pitSupported: boolean;
  owner: string;
  description: string;
  lineage: string[];
  nullRate: number;
}

export const featureCatalog: FeatureCatalogItem[] = [
  {
    name: 'pay_delay_avg_90d',
    entity: 'CPF',
    dataType: 'decimal',
    domain: 'Pagamentos',
    freshnessMinutes: 4,
    pitSupported: true,
    owner: 'squad-score',
    description: 'Atraso médio de pagamento em dias nos últimos 90 dias.',
    lineage: ['credit.events.payment.v2', 'feature-store.online', 'model:score-pf'],
    nullRate: 1.8,
  },
  {
    name: 'negative_active_count',
    entity: 'CPF',
    dataType: 'int',
    domain: 'Negativação',
    freshnessMinutes: 2,
    pitSupported: true,
    owner: 'squad-score',
    description: 'Quantidade de apontamentos negativos ativos.',
    lineage: ['credit.events.negative.v3', 'feature-store.online'],
    nullRate: 0.3,
  },
  {
    name: 'income_estimated_of',
    entity: 'CPF',
    dataType: 'decimal',
    domain: 'Open Finance',
    freshnessMinutes: 38,
    pitSupported: true,
    owner: 'squad-dados-alt',
    description: 'Renda estimada a partir de fluxo consentido de Open Finance.',
    lineage: ['credit.events.openfinance.v1', 'feature-store.offline'],
    nullRate: 22.4,
  },
  {
    name: 'contract_utilization_pct',
    entity: 'CPF',
    dataType: 'decimal',
    domain: 'Contratos',
    freshnessMinutes: 6,
    pitSupported: true,
    owner: 'squad-score',
    description: 'Percentual de utilização de limites contratados.',
    lineage: ['credit.events.contract.v1', 'feature-store.online'],
    nullRate: 3.1,
  },
  {
    name: 'cnpj_revenue_band',
    entity: 'CNPJ',
    dataType: 'string',
    domain: 'PJ',
    freshnessMinutes: 1_440,
    pitSupported: false,
    owner: 'squad-pj',
    description: 'Faixa de faturamento declarada, atualizada em lote diário.',
    lineage: ['batch.receita.v1', 'feature-store.offline'],
    nullRate: 11.7,
  },
  {
    name: 'partner_group_exposure',
    entity: 'CNPJ',
    dataType: 'decimal',
    domain: 'PJ',
    freshnessMinutes: 120,
    pitSupported: true,
    owner: 'squad-pj',
    description: 'Exposição consolidada do grupo econômico do CNPJ.',
    lineage: ['graph.economic-group', 'feature-store.offline'],
    nullRate: 8.9,
  },
  {
    name: 'thinfile_alt_signals',
    entity: 'CPF',
    dataType: 'int',
    domain: 'Thin-file',
    freshnessMinutes: 60,
    pitSupported: true,
    owner: 'squad-inclusao',
    description: 'Sinais alternativos consentidos disponíveis (contas, telecom, aluguel).',
    lineage: ['partners.alt-data.v1', 'feature-store.offline'],
    nullRate: 44.2,
  },
  {
    name: 'device_risk_score',
    entity: 'CPF',
    dataType: 'int',
    domain: 'Fraude',
    freshnessMinutes: 1,
    pitSupported: true,
    owner: 'squad-fraude',
    description: 'Score de risco de dispositivo na sessão de consulta.',
    lineage: ['sessions.device.v2', 'feature-store.online'],
    nullRate: 5.6,
  },
];

export interface PitLookupResult {
  documento: string;
  asOf: string;
  values: { name: string; value: string; observedAt: string; source: string }[];
}

export function pitLookup(documento: string, asOf: string): PitLookupResult {
  return {
    documento,
    asOf,
    values: [
      { name: 'pay_delay_avg_90d', value: '18,4 dias', observedAt: asOf, source: 'online' },
      { name: 'negative_active_count', value: String(MARIA.records.length), observedAt: asOf, source: 'online' },
      { name: 'income_estimated_of', value: 'R$ 5.180,00', observedAt: asOf, source: 'offline' },
      { name: 'contract_utilization_pct', value: '92,7%', observedAt: asOf, source: 'online' },
      { name: 'device_risk_score', value: '134', observedAt: asOf, source: 'online' },
    ],
  };
}

/* ------------------------------------------------ F03 · score do titular */

export interface ScoreCurrentResponse {
  documento: string;
  score: number;
  band: string;
  modelVersion: string;
  updatedAt: string;
  pd12m: number;
}

export interface ScoreHistoryPoint {
  observedAt: string;
  score: number;
  modelVersion: string;
  triggerEvent?: string;
  delta: number;
}

/**
 * Faixa de referência desenhada sob a série do gráfico. Precisa cercar o score
 * canónico de Maria (486); a faixa B usada antes (700–800) deixava a linha
 * inteira fora da banda.
 */
export const SCORE_BAND_REFERENCE = { min: 400, max: 600, label: 'faixa D' };

export function scoreCurrent(documento: string): ScoreCurrentResponse {
  return {
    documento,
    score: MARIA.score,
    band: MARIA.scoreBand,
    modelVersion: MARIA.modelVersion,
    updatedAt: DEMO_TIMESTAMP,
    pd12m: 14.6,
  };
}

/**
 * Série de 6 meses da Maria: queda provocada pelos dois apontamentos e pela
 * utilização de limite, recuperação parcial em julho com o consentimento de
 * Open Finance e nova queda até o score canónico. O penúltimo ponto é o
 * `previousScore` e o último é o `score` da fixture.
 */
export function scoreHistory(): ScoreHistoryPoint[] {
  return [
    { observedAt: '2026-02-02T09:00:00Z', score: 642, modelVersion: 'v4.1.0', delta: 0 },
    { observedAt: '2026-03-02T09:00:00Z', score: 631, modelVersion: 'v4.1.0', delta: -11 },
    {
      observedAt: '2026-03-12T14:22:00Z',
      score: 547,
      modelVersion: 'v4.1.0',
      triggerEvent: `negative.registered · ${MARIA.records[0].id} ${MARIA.records[0].creditor} (R$ 1.284,90)`,
      delta: -84,
    },
    {
      observedAt: '2026-04-13T10:05:00Z',
      score: 500,
      modelVersion: 'v4.1.0',
      triggerEvent: 'payment.late · atraso médio de 90 dias sobe para 18,4 dias',
      delta: -47,
    },
    {
      observedAt: '2026-05-04T09:00:00Z',
      score: 448,
      modelVersion: 'v4.1.0',
      triggerEvent: 'contract.utilization · utilização de limite chega a 92,7%',
      delta: -52,
    },
    {
      observedAt: '2026-06-02T11:20:00Z',
      score: 429,
      modelVersion: 'v4.1.0',
      triggerEvent: `negative.registered · ${MARIA.records[1].id} ${MARIA.records[1].creditor} (R$ 219,40)`,
      delta: -19,
    },
    {
      observedAt: '2026-07-01T09:00:00Z',
      score: MARIA.previousScore,
      modelVersion: 'v4.1.0',
      triggerEvent: 'openfinance.consent.granted · renda de R$ 5.180 comprovada',
      delta: 83,
    },
    {
      observedAt: DEMO_TIMESTAMP,
      score: MARIA.score,
      modelVersion: MARIA.modelVersion,
      triggerEvent: `negative.aging · ${MARIA.records[0].id} completa 120 dias sem baixa`,
      delta: MARIA.score - MARIA.previousScore,
    },
  ];
}

/* ----------------------------------------- F04 · comparação de decisões */

export interface DecisionMeta {
  decisionId: string;
  documento: string;
  decidedAt: string;
  outcome: 'aprovado' | 'recusado' | 'revisao';
  score: number;
  modelVersion: string;
  policyVersion: string;
  snapshotHash: string;
  latencyMs: number;
}

export interface AttributeDiff {
  attribute: string;
  left: string;
  right: string;
  changed: boolean;
  contribution: number;
}

export function decisionPair(): { left: DecisionMeta; right: DecisionMeta; diff: AttributeDiff[] } {
  return {
    left: {
      decisionId: 'dec-2026-03-02-8841',
      documento: MARIA_DOC_MASKED,
      decidedAt: '2026-03-02T10:06:11Z',
      outcome: 'aprovado',
      score: 631,
      modelVersion: 'v4.1.0',
      policyVersion: 'policy-pf-16',
      snapshotHash: 'sha256:9f21ac…b7e0',
      latencyMs: 187,
    },
    right: {
      decisionId: MARIA.decisionId,
      documento: MARIA_DOC_MASKED,
      decidedAt: DEMO_TIMESTAMP,
      outcome: 'recusado',
      score: MARIA.score,
      modelVersion: MARIA.modelVersion,
      policyVersion: 'policy-pf-17',
      snapshotHash: 'sha256:41c8de…2a94',
      latencyMs: 163,
    },
    diff: [
      { attribute: 'pay_delay_avg_90d', left: '3,9 dias', right: '18,4 dias', changed: true, contribution: -47 },
      { attribute: 'negative_active_count', left: '0', right: '2', changed: true, contribution: -84 },
      { attribute: 'contract_utilization_pct', left: '61,4%', right: '92,7%', changed: true, contribution: -31 },
      { attribute: 'income_estimated_of', left: '—', right: 'R$ 5.180,00', changed: true, contribution: 12 },
      { attribute: 'device_risk_score', left: '118', right: '134', changed: true, contribution: -2 },
      { attribute: 'relationship_months', left: '69 meses', right: '74 meses', changed: true, contribution: 7 },
      { attribute: 'entity_type', left: 'CPF', right: 'CPF', changed: false, contribution: 0 },
    ],
  };
}

/* ---------------------------------------------------- F05 · playground */

export interface PlaygroundResponse {
  decisionId: string;
  score: number;
  outcome: string;
  modelVersion: string;
  latency: { total: number; featureStore: number; model: number; policy: number; audit: number };
  reasons: { code: string; label: string; weight: number }[];
}

export const playgroundSamplePayload = `{
  "documento": "${MARIA.document}",
  "produto": "cartao_credito",
  "valorSolicitado": 3500.00,
  "canal": "app",
  "consentimentos": ["openfinance", "cadastro_positivo"],
  "contexto": {
    "deviceId": "dev-77af21",
    "ip": "191.32.44.10"
  }
}`;

export function playgroundRun(): PlaygroundResponse {
  return {
    decisionId: MARIA.decisionId,
    score: MARIA.score,
    outcome: 'recusado',
    modelVersion: MARIA.modelVersion,
    latency: { total: 168, featureStore: 41, model: 62, policy: 28, audit: 37 },
    reasons: [
      { code: 'R004', label: 'Dois apontamentos negativos ativos', weight: 41 },
      { code: 'R012', label: 'Atraso médio de 18,4 dias nos últimos 90 dias', weight: 26 },
      { code: 'R021', label: 'Utilização de limite acima de 90%', weight: 19 },
      { code: 'R033', label: 'Renda comprovada via Open Finance (fator positivo)', weight: 9 },
    ],
  };
}

/* -------------------------------------------------- F06 · conectores */

export type SourceStatus = 'online' | 'degradado' | 'offline';

export interface IngestSource {
  id: string;
  name: string;
  type: 'batch' | 'stream' | 'api';
  status: SourceStatus;
  lastSyncAt: string;
  recordsToday: number;
  errorRatePct: number;
  slaMinutes: number;
  owner: string;
}

export const ingestSources: IngestSource[] = [
  {
    id: 'src-serasa-batch',
    name: 'Bureau parceiro · lote diário',
    type: 'batch',
    status: 'online',
    lastSyncAt: '2026-07-27T06:12:00Z',
    recordsToday: 8_420_000,
    errorRatePct: 0.02,
    slaMinutes: 120,
    owner: 'squad-dados',
  },
  {
    id: 'src-openfinance',
    name: 'Open Finance · consentimentos',
    type: 'api',
    status: 'degradado',
    lastSyncAt: '2026-07-27T12:31:00Z',
    recordsToday: 214_800,
    errorRatePct: 4.7,
    slaMinutes: 15,
    owner: 'squad-dados-alt',
  },
  {
    id: 'src-cartorios',
    name: 'Cartórios · protestos',
    type: 'batch',
    status: 'online',
    lastSyncAt: '2026-07-27T05:40:00Z',
    recordsToday: 96_300,
    errorRatePct: 0.11,
    slaMinutes: 240,
    owner: 'squad-dados',
  },
  {
    id: 'src-telecom',
    name: 'Telecom · adimplência de plano',
    type: 'stream',
    status: 'online',
    lastSyncAt: '2026-07-27T12:39:00Z',
    recordsToday: 1_284_000,
    errorRatePct: 0.34,
    slaMinutes: 5,
    owner: 'squad-inclusao',
  },
  {
    id: 'src-utilities',
    name: 'Concessionárias · contas de consumo',
    type: 'batch',
    status: 'offline',
    lastSyncAt: '2026-07-26T04:58:00Z',
    recordsToday: 0,
    errorRatePct: 100,
    slaMinutes: 360,
    owner: 'squad-inclusao',
  },
  {
    id: 'src-cadastro-positivo',
    name: 'Cadastro Positivo · gestores',
    type: 'api',
    status: 'online',
    lastSyncAt: '2026-07-27T12:20:00Z',
    recordsToday: 642_900,
    errorRatePct: 0.08,
    slaMinutes: 30,
    owner: 'squad-dados',
  },
];

/* ------------------------------------------ F07 · mesclagem de identidade */

export interface IdentityCandidate {
  candidateId: string;
  documento: string;
  matchScore: number;
  reason: string;
  createdAt: string;
  status: 'pendente' | 'mesclado' | 'descartado';
  left: Record<string, string>;
  right: Record<string, string>;
}

export const identityCandidates: IdentityCandidate[] = [
  {
    candidateId: 'cand-4471',
    documento: MARIA_DOC_MASKED,
    matchScore: 0.94,
    reason: 'Nome + data de nascimento + endereço com divergência de grafia',
    createdAt: '2026-07-27T11:12:00Z',
    status: 'pendente',
    left: {
      nome: 'MARIA SOUSA',
      nascimento: '1988-03-14',
      documento: MARIA.documentMasked,
      endereco: 'R. das Acácias 120, Ap 42 — São Paulo/SP',
      telefone: '(11) 9****-1234',
      origem: 'bureau-parceiro',
    },
    right: {
      nome: MARIA.name.toUpperCase(),
      nascimento: '1988-03-14',
      documento: MARIA.documentMasked,
      endereco: 'Rua Acacias, 120 apto 42 — Sao Paulo/SP',
      telefone: '(11) 9****-1234',
      origem: 'open-finance',
    },
  },
  {
    candidateId: 'cand-4468',
    documento: '987.***.**55',
    matchScore: 0.81,
    reason: 'Mesmo CPF com dois nomes sociais distintos',
    createdAt: '2026-07-27T10:48:00Z',
    status: 'pendente',
    left: {
      nome: 'J. P. ALMEIDA',
      nascimento: '1975-11-02',
      documento: '987.654.321-55',
      endereco: 'Av. Central 900 — Recife/PE',
      telefone: '(81) 9****-7788',
      origem: 'cadastro-positivo',
    },
    right: {
      nome: 'JOAO PEDRO ALMEIDA',
      nascimento: '1975-11-02',
      documento: '987.654.321-55',
      endereco: 'Av. Central 900, sala 3 — Recife/PE',
      telefone: '(81) 9****-7788',
      origem: 'telecom',
    },
  },
  {
    candidateId: 'cand-4459',
    documento: '456.***.**23',
    matchScore: 0.67,
    reason: 'Similaridade fonética de nome com endereço divergente',
    createdAt: '2026-07-27T09:30:00Z',
    status: 'pendente',
    left: {
      nome: 'ANA CLARA LIMA',
      nascimento: '1993-06-21',
      documento: '456.789.012-23',
      endereco: 'R. Bahia 45 — Belo Horizonte/MG',
      telefone: '(31) 9****-0090',
      origem: 'bureau-parceiro',
    },
    right: {
      nome: 'ANNA KLARA LIMMA',
      nascimento: '1993-06-21',
      documento: '456.789.012-23',
      endereco: 'R. Ceará 45 — Belo Horizonte/MG',
      telefone: '(31) 9****-4412',
      origem: 'utilities',
    },
  },
];

/* -------------------------------------------------------- F08 · SLO */

export interface SloResponse {
  window: string;
  latency: { p50: number; p95: number; p99: number; target: number };
  availabilityPct: number;
  errorBudget: { consumedPct: number; remainingMinutes: number; windowDays: number };
  series: { label: string; value: number }[];
  traces: {
    decisionId: string;
    totalMs: number;
    spans: { name: string; ms: number }[];
    status: 'ok' | 'slow' | 'error';
  }[];
}

export function sloSnapshot(): SloResponse {
  return {
    window: 'últimas 24 h',
    latency: { p50: 96, p95: 231, p99: 388, target: 250 },
    availabilityPct: 99.94,
    errorBudget: { consumedPct: 38, remainingMinutes: 26, windowDays: 30 },
    series: [
      { label: '00h', value: 212 },
      { label: '03h', value: 198 },
      { label: '06h', value: 205 },
      { label: '09h', value: 244 },
      { label: '12h', value: 268 },
      { label: '15h', value: 251 },
      { label: '18h', value: 239 },
      { label: '21h', value: 226 },
    ],
    traces: [
      {
        decisionId: MARIA.decisionId,
        totalMs: 163,
        status: 'ok',
        spans: [
          { name: 'gateway', ms: 12 },
          { name: 'feature-store', ms: 41 },
          { name: 'model-serving', ms: 62 },
          { name: 'policy-engine', ms: 28 },
          { name: 'audit-write', ms: 20 },
        ],
      },
      {
        decisionId: 'dec-2026-07-27-1888',
        totalMs: 412,
        status: 'slow',
        spans: [
          { name: 'gateway', ms: 14 },
          { name: 'feature-store', ms: 208 },
          { name: 'model-serving', ms: 96 },
          { name: 'policy-engine', ms: 61 },
          { name: 'audit-write', ms: 33 },
        ],
      },
      {
        decisionId: 'dec-2026-07-27-1841',
        totalMs: 502,
        status: 'error',
        spans: [
          { name: 'gateway', ms: 11 },
          { name: 'feature-store', ms: 74 },
          { name: 'model-serving', ms: 380 },
          { name: 'policy-engine', ms: 0 },
          { name: 'audit-write', ms: 37 },
        ],
      },
    ],
  };
}

/* --------------------------------------------- F09 · registry de modelos */

export type ModelStage = 'producao' | 'shadow' | 'staging' | 'arquivado';

export interface ModelVersion {
  modelId: string;
  version: string;
  stage: ModelStage;
  ks: number;
  auc: number;
  psi: number;
  trainedAt: string;
  approvedBy: string;
  trafficPct: number;
}

/** O registry não repete o prefixo `v` do rótulo de produto: `modelId` + `version`. */
export const modelVersions: ModelVersion[] = [
  {
    modelId: 'score-pf',
    version: MARIA.modelVersion.replace(/^v/, ''),
    stage: 'producao',
    ks: 0.481,
    auc: 0.812,
    psi: 0.06,
    trainedAt: '2026-07-08T00:00:00Z',
    approvedBy: 'comitê de modelos',
    trafficPct: 90,
  },
  {
    modelId: 'score-pf',
    version: '4.3.0-rc',
    stage: 'shadow',
    ks: 0.497,
    auc: 0.824,
    psi: 0.09,
    trainedAt: '2026-07-22T00:00:00Z',
    approvedBy: '—',
    trafficPct: 10,
  },
  {
    modelId: 'score-pf',
    version: '4.1.0',
    stage: 'arquivado',
    ks: 0.463,
    auc: 0.798,
    psi: 0.12,
    trainedAt: '2026-01-20T00:00:00Z',
    approvedBy: 'comitê de modelos',
    trafficPct: 0,
  },
  {
    modelId: 'score-thinfile',
    version: '2.4.0',
    stage: 'producao',
    ks: 0.402,
    auc: 0.751,
    psi: 0.11,
    trainedAt: '2026-06-19T00:00:00Z',
    approvedBy: 'comitê de modelos',
    trafficPct: 100,
  },
  {
    modelId: 'score-pj',
    version: '1.7.0',
    stage: 'staging',
    ks: 0.438,
    auc: 0.776,
    psi: 0.07,
    trainedAt: '2026-07-15T00:00:00Z',
    approvedBy: '—',
    trafficPct: 0,
  },
];

/* --------------------------------------------------------- F10 · replay */

export interface ReplayJob {
  jobId: string;
  window: string;
  status: 'executando' | 'concluido' | 'abortado' | 'falha';
  progressPct: number;
  eventsProcessed: number;
  eventsTotal: number;
  divergences: number;
  startedAt: string;
  requestedBy: string;
}

export const replayJobs: ReplayJob[] = [
  {
    jobId: 'rpl-2026-07-27-04',
    window: '2026-07-20 → 2026-07-26',
    status: 'executando',
    progressPct: 62,
    eventsProcessed: 18_420_000,
    eventsTotal: 29_700_000,
    divergences: 148,
    startedAt: '2026-07-27T11:02:00Z',
    requestedBy: 'ana.martins',
  },
  {
    jobId: 'rpl-2026-07-26-03',
    window: '2026-07-01 → 2026-07-19',
    status: 'concluido',
    progressPct: 100,
    eventsProcessed: 71_200_000,
    eventsTotal: 71_200_000,
    divergences: 512,
    startedAt: '2026-07-26T02:00:00Z',
    requestedBy: 'pipeline-agendado',
  },
  {
    jobId: 'rpl-2026-07-24-02',
    window: '2026-06-01 → 2026-06-30',
    status: 'abortado',
    progressPct: 34,
    eventsProcessed: 22_100_000,
    eventsTotal: 64_800_000,
    divergences: 1_204,
    startedAt: '2026-07-24T22:10:00Z',
    requestedBy: 'carlos.dias',
  },
  {
    jobId: 'rpl-2026-07-20-01',
    window: '2026-05-01 → 2026-05-31',
    status: 'falha',
    progressPct: 12,
    eventsProcessed: 7_400_000,
    eventsTotal: 61_300_000,
    divergences: 88,
    startedAt: '2026-07-20T03:00:00Z',
    requestedBy: 'pipeline-agendado',
  },
];

export const divergenceHistogram = [
  { label: '0–5', value: 84 },
  { label: '6–10', value: 41 },
  { label: '11–25', value: 17 },
  { label: '26–50', value: 5 },
  { label: '> 50', value: 1 },
];
