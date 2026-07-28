/**
 * DTOs e mocks do EP-02 — Motor de Decisão Explicável & Trilha Regulatória.
 * Tipos espelham a seção 8.1 das US-FE PRISMA-EP-02-F01..F10.
 */

import { DEMO_TIMESTAMP, MARIA } from '@/app/story';

/** Máscara de privacidade das telas de auditoria: prefixo e dois últimos dígitos. */
const MARIA_DOC_MASKED = `${MARIA.document.slice(0, 3)}.***.**${MARIA.document.slice(-2)}`;

/* ------------------------------------------- F01 · fatores da decisão */

export interface DecisionFactor {
  attribute: string;
  label: string;
  contribution: number;
  value: string;
  direction: 'positivo' | 'negativo';
  populationAverage: string;
  explanation: string;
}

export interface ExplainResponse {
  decisionId: string;
  documento: string;
  outcome: 'aprovado' | 'recusado' | 'revisao';
  score: number;
  modelVersion: string;
  policyVersion: string;
  decidedAt: string;
  baseValue: number;
  factors: DecisionFactor[];
}

/**
 * A soma das contribuições sobre o `baseValue` fecha exatamente no score
 * canónico de Maria (620 − 134 = 486); mexer numa contribuição exige recalibrar
 * as outras, senão o waterfall da tela não fecha com o score exibido.
 */
export function explain(decisionId: string): ExplainResponse {
  return {
    decisionId,
    documento: MARIA_DOC_MASKED,
    outcome: 'recusado',
    score: MARIA.score,
    modelVersion: MARIA.modelVersion,
    policyVersion: 'policy-pf-17',
    decidedAt: DEMO_TIMESTAMP,
    baseValue: 620,
    factors: [
      {
        attribute: 'negative_active_count',
        label: 'Apontamentos negativos ativos',
        contribution: -84,
        value: `${MARIA.records.length} apontamentos`,
        direction: 'negativo',
        populationAverage: '0,4 apontamento',
        explanation: `Dois registros negativos ativos (${MARIA.records[0].id} · ${MARIA.records[0].creditor} e ${MARIA.records[1].id} · ${MARIA.records[1].creditor}) reduzem fortemente a probabilidade de adimplência estimada.`,
      },
      {
        attribute: 'pay_delay_avg_90d',
        label: 'Atraso médio de pagamento (90 dias)',
        contribution: -47,
        value: '18,4 dias',
        direction: 'negativo',
        populationAverage: '4,1 dias',
        explanation: 'O atraso médio está 4,5× acima da média da população comparável.',
      },
      {
        attribute: 'contract_utilization_pct',
        label: 'Utilização de limites',
        contribution: -31,
        value: '92,7%',
        direction: 'negativo',
        populationAverage: '48,0%',
        explanation: 'Utilização acima de 90% indica dependência de crédito rotativo.',
      },
      {
        attribute: 'relationship_months',
        label: 'Tempo de relacionamento',
        contribution: 18,
        value: '74 meses',
        direction: 'positivo',
        populationAverage: '38 meses',
        explanation: 'Relacionamento longo com o mercado de crédito contribui positivamente.',
      },
      {
        attribute: 'income_estimated_of',
        label: 'Renda estimada (Open Finance)',
        contribution: 12,
        value: 'R$ 5.180,00',
        direction: 'positivo',
        populationAverage: 'R$ 4.240,00',
        explanation: 'Renda consentida acima da média do segmento compensa parte do risco.',
      },
      {
        attribute: 'device_risk_score',
        label: 'Risco do dispositivo',
        contribution: -2,
        value: '134',
        direction: 'negativo',
        populationAverage: '110',
        explanation: 'Leve elevação de risco de dispositivo, sem impacto material.',
      },
    ],
  };
}

/* ------------------------------------------------ F02 · contrafactuais */

export interface CounterfactualAction {
  id: string;
  action: string;
  attribute: string;
  currentValue: string;
  targetValue: string;
  scoreGainMin: number;
  scoreGainMax: number;
  effortDays: number;
  feasibility: 'alta' | 'media' | 'baixa';
  guidance: string;
}

export const counterfactualActions: CounterfactualAction[] = [
  {
    id: 'cf-01',
    action: `Concluir a contestação do apontamento ${MARIA.records[0].id}`,
    attribute: 'negative_active_count',
    currentValue: `${MARIA.records.length} apontamentos`,
    targetValue: '1 apontamento',
    scoreGainMin: 44,
    // O teto reproduz o score projetado pelo simulador do coach (486 → 548).
    scoreGainMax: MARIA.scoreAfterDispute - MARIA.score,
    effortDays: 5,
    feasibility: 'alta',
    guidance: `A baixa do apontamento contestado sob o protocolo ${MARIA.disputeProtocol} é processada em até 5 dias úteis após a confirmação do credor e dispara recálculo automático.`,
  },
  {
    id: 'cf-02',
    action: 'Reduzir a utilização do limite para abaixo de 70%',
    attribute: 'contract_utilization_pct',
    currentValue: '92,7%',
    targetValue: '≤ 70%',
    scoreGainMin: 18,
    scoreGainMax: 34,
    effortDays: 30,
    feasibility: 'media',
    guidance: 'Efeito observado após o fechamento da próxima fatura consolidada.',
  },
  {
    id: 'cf-03',
    action: 'Manter 3 pagamentos consecutivos em dia',
    attribute: 'pay_delay_avg_90d',
    currentValue: '18,4 dias',
    targetValue: '≤ 8 dias',
    scoreGainMin: 24,
    scoreGainMax: 46,
    effortDays: 90,
    feasibility: 'alta',
    guidance: 'Cada pagamento pontual reduz gradualmente a média de atraso da janela de 90 dias.',
  },
  {
    id: 'cf-04',
    action: 'Conceder consentimento de Open Finance por 12 meses',
    attribute: 'income_estimated_of',
    currentValue: 'consentimento de 3 meses',
    targetValue: 'consentimento de 12 meses',
    scoreGainMin: 6,
    scoreGainMax: 15,
    effortDays: 1,
    feasibility: 'alta',
    guidance: 'Amplia a série de renda disponível e reduz a incerteza do modelo.',
  },
];

/* -------------------------------------------------- F03 · dossiê LGPD */

export interface DossierRecord {
  dossierId: string;
  documento: string;
  decisionId: string;
  requestedAt: string;
  status: 'gerando' | 'disponivel' | 'expirado';
  format: 'PDF' | 'JSON';
  sizeKb: number;
  requestedBy: string;
  expiresAt: string;
}

export const dossierHistory: DossierRecord[] = [
  {
    dossierId: 'dos-2026-0714',
    documento: MARIA_DOC_MASKED,
    decisionId: MARIA.decisionId,
    requestedAt: '2026-07-27T11:20:00Z',
    status: 'disponivel',
    format: 'PDF',
    sizeKb: 842,
    requestedBy: 'encarregado.dpo',
    expiresAt: '2026-08-26T11:20:00Z',
  },
  {
    dossierId: 'dos-2026-0709',
    documento: '987.***.**55',
    decisionId: 'dec-2026-07-24-0912',
    requestedAt: '2026-07-24T09:44:00Z',
    status: 'disponivel',
    format: 'JSON',
    sizeKb: 316,
    requestedBy: 'atendimento.sac',
    expiresAt: '2026-08-23T09:44:00Z',
  },
  {
    dossierId: 'dos-2026-0688',
    documento: '456.***.**23',
    decisionId: 'dec-2026-06-18-1741',
    requestedAt: '2026-06-18T17:52:00Z',
    status: 'expirado',
    format: 'PDF',
    sizeKb: 774,
    requestedBy: 'encarregado.dpo',
    expiresAt: '2026-07-18T17:52:00Z',
  },
];

export const dossierSections = [
  'Identificação do titular e do solicitante',
  'Decisão automatizada: resultado, score e data',
  'Modelo e versão de política aplicados',
  'Fatores determinantes com contribuição individual',
  'Ações recomendadas (contrafactuais viáveis)',
  'Dados pessoais utilizados e respectivas fontes',
  'Base legal do tratamento e prazo de retenção',
  'Canais de contestação e revisão humana',
];

/* ------------------------------------------- F04 · trilha de auditoria */

export interface AuditEvent {
  eventId: string;
  occurredAt: string;
  actor: string;
  actorType: 'sistema' | 'humano' | 'cliente-b2b';
  action: string;
  entity: string;
  documento?: string;
  hash: string;
  ip?: string;
}

export const auditTrail: AuditEvent[] = [
  {
    // A política tem de estar ativa ANTES da decisão que a aplica.
    eventId: 'aud-87960',
    occurredAt: '2026-07-20T09:00:12Z',
    actor: 'policy-engine',
    actorType: 'sistema',
    action: 'POLICY_VERSION_ACTIVATED',
    entity: 'policy-pf-17',
    hash: 'sha256:be07…1d29',
  },
  {
    eventId: 'aud-88214',
    occurredAt: '2026-07-27T11:04:22Z',
    actor: 'decision-engine',
    actorType: 'sistema',
    action: 'DECISION_EMITTED',
    entity: MARIA.decisionId,
    documento: MARIA_DOC_MASKED,
    hash: 'sha256:c41f…9a02',
  },
  {
    eventId: 'aud-88215',
    occurredAt: '2026-07-27T11:04:23Z',
    actor: 'audit-writer',
    actorType: 'sistema',
    action: 'SNAPSHOT_SEALED',
    entity: MARIA.decisionId,
    documento: MARIA_DOC_MASKED,
    hash: 'sha256:118d…44b1',
  },
  {
    eventId: 'aud-88240',
    occurredAt: '2026-07-27T11:19:02Z',
    actor: 'banco.parceiro.api',
    actorType: 'cliente-b2b',
    action: 'EXPLAIN_READ',
    entity: MARIA.decisionId,
    documento: MARIA_DOC_MASKED,
    hash: 'sha256:7fa1…2c58',
    ip: '191.32.44.10',
  },
  {
    eventId: 'aud-88251',
    occurredAt: '2026-07-27T11:20:44Z',
    actor: 'encarregado.dpo',
    actorType: 'humano',
    action: 'DOSSIER_ISSUED',
    entity: 'dos-2026-0714',
    documento: MARIA_DOC_MASKED,
    hash: 'sha256:9021…ffa7',
    ip: '10.4.12.88',
  },
  {
    eventId: 'aud-88262',
    occurredAt: '2026-07-27T11:41:10Z',
    actor: 'analista.risco.mfonseca',
    actorType: 'humano',
    action: 'REVIEW_ASSIGNED',
    entity: 'rev-4412',
    documento: MARIA_DOC_MASKED,
    hash: 'sha256:5cd4…78e3',
    ip: '10.4.12.91',
  },
];

/* --------------------------------------------- F05 · motivos de recusa */

export interface ReasonCode {
  code: string;
  technicalLabel: string;
  titularLabel: string;
  category: string;
  status: 'publicado' | 'rascunho' | 'aprovacao';
  readability: number;
  lastUpdatedAt: string;
  owner: string;
}

export const reasonCodes: ReasonCode[] = [
  {
    code: 'R004',
    technicalLabel: 'negative_active_count > 0',
    titularLabel: 'Existem registros de dívidas em aberto no seu CPF.',
    category: 'Restrições',
    status: 'publicado',
    readability: 68,
    lastUpdatedAt: '2026-06-12T00:00:00Z',
    owner: 'compliance',
  },
  {
    code: 'R012',
    technicalLabel: 'pay_delay_avg_90d > 10',
    titularLabel: 'Nos últimos 90 dias houve atrasos frequentes nos pagamentos.',
    category: 'Comportamento de pagamento',
    status: 'publicado',
    readability: 72,
    lastUpdatedAt: '2026-06-12T00:00:00Z',
    owner: 'compliance',
  },
  {
    code: 'R021',
    technicalLabel: 'contract_utilization_pct > 0.9',
    titularLabel: 'Seus limites de crédito estão praticamente todos utilizados.',
    category: 'Endividamento',
    status: 'aprovacao',
    readability: 64,
    lastUpdatedAt: '2026-07-25T00:00:00Z',
    owner: 'ux-writing',
  },
  {
    code: 'R033',
    technicalLabel: 'income_confidence < 0.4',
    titularLabel: 'Não conseguimos confirmar sua renda com as informações disponíveis.',
    category: 'Renda',
    status: 'rascunho',
    readability: 58,
    lastUpdatedAt: '2026-07-26T00:00:00Z',
    owner: 'ux-writing',
  },
  {
    code: 'R047',
    technicalLabel: 'thinfile = true AND alt_signals < 2',
    titularLabel: 'Ainda temos pouco histórico de crédito sobre você.',
    category: 'Thin-file',
    status: 'publicado',
    readability: 76,
    lastUpdatedAt: '2026-05-30T00:00:00Z',
    owner: 'compliance',
  },
];

/* ------------------------------------------------ F06 · revisão humana */

export interface ReviewItem {
  reviewId: string;
  decisionId: string;
  documento: string;
  requestedAt: string;
  slaDueAt: string;
  channel: 'portal' | 'sac' | 'b2b';
  priority: 'alta' | 'media' | 'baixa';
  status: 'pendente' | 'em_analise' | 'decidido';
  score: number;
  reasonCodes: string[];
  claim: string;
}

export const reviewQueue: ReviewItem[] = [
  {
    reviewId: 'rev-4412',
    decisionId: MARIA.decisionId,
    documento: MARIA_DOC_MASKED,
    requestedAt: '2026-07-27T11:35:00Z',
    slaDueAt: '2026-07-29T11:35:00Z',
    channel: 'portal',
    priority: 'alta',
    status: 'pendente',
    score: MARIA.score,
    reasonCodes: ['R004', 'R012', 'R021'],
    claim: `Titular alega que o apontamento ${MARIA.records[0].id} (${MARIA.records[0].creditor}, R$ 1.284,90) foi quitado e apresenta comprovante do credor; caso já contestado sob o protocolo ${MARIA.disputeProtocol}.`,
  },
  {
    reviewId: 'rev-4409',
    decisionId: 'dec-2026-07-26-0841',
    documento: '987.***.**55',
    requestedAt: '2026-07-26T14:12:00Z',
    slaDueAt: '2026-07-28T14:12:00Z',
    channel: 'sac',
    priority: 'media',
    status: 'em_analise',
    score: 527,
    reasonCodes: ['R033'],
    claim: 'Titular envia contracheque para comprovar renda não capturada pelo Open Finance.',
  },
  {
    reviewId: 'rev-4404',
    decisionId: 'dec-2026-07-25-1922',
    documento: '456.***.**23',
    requestedAt: '2026-07-25T19:40:00Z',
    slaDueAt: '2026-07-27T19:40:00Z',
    channel: 'b2b',
    priority: 'alta',
    status: 'pendente',
    score: 442,
    reasonCodes: ['R004', 'R047'],
    claim:
      'Cliente B2B contesta recusa alegando que o CPF foi confundido com homônimo em base de terceiros.',
  },
  {
    reviewId: 'rev-4398',
    decisionId: 'dec-2026-07-24-1015',
    documento: '321.***.**77',
    requestedAt: '2026-07-24T10:30:00Z',
    slaDueAt: '2026-07-26T10:30:00Z',
    channel: 'portal',
    priority: 'baixa',
    status: 'decidido',
    score: 604,
    reasonCodes: ['R021'],
    claim: 'Titular solicitou revisão após reduzir utilização de limite.',
  },
];

/* ---------------------------------------------------- F07 · equidade */

export interface FairnessMetric {
  group: string;
  approvalRatePct: number;
  disparateImpact: number;
  equalOpportunityGap: number;
  volume: number;
}

export interface FairnessAlert {
  alertId: string;
  metric: string;
  group: string;
  detectedAt: string;
  severity: 'critica' | 'alta' | 'media';
  detail: string;
  status: 'aberto' | 'em_analise';
}

export const fairnessMetrics: FairnessMetric[] = [
  { group: 'Referência (maior volume)', approvalRatePct: 62.4, disparateImpact: 1, equalOpportunityGap: 0, volume: 412_000 },
  { group: 'Região Norte', approvalRatePct: 48.9, disparateImpact: 0.78, equalOpportunityGap: 6.2, volume: 88_400 },
  { group: 'Região Nordeste', approvalRatePct: 51.3, disparateImpact: 0.82, equalOpportunityGap: 5.1, volume: 164_200 },
  { group: 'Faixa 18–24 anos', approvalRatePct: 44.1, disparateImpact: 0.71, equalOpportunityGap: 8.4, volume: 96_800 },
  { group: 'Faixa 60+ anos', approvalRatePct: 58.7, disparateImpact: 0.94, equalOpportunityGap: 2.1, volume: 74_100 },
  { group: 'Thin-file', approvalRatePct: 39.6, disparateImpact: 0.63, equalOpportunityGap: 11.7, volume: 121_500 },
];

export const fairnessAlerts: FairnessAlert[] = [
  {
    alertId: 'fair-2026-118',
    metric: 'Disparate impact',
    group: 'Thin-file',
    detectedAt: '2026-07-26T03:00:00Z',
    severity: 'critica',
    detail:
      'Razão de aprovação de 0,63 está abaixo do piso regulatório de 0,80 adotado pela política interna.',
    status: 'aberto',
  },
  {
    alertId: 'fair-2026-117',
    metric: 'Disparate impact',
    group: 'Faixa 18–24 anos',
    detectedAt: '2026-07-25T03:00:00Z',
    severity: 'alta',
    detail: 'Queda de 0,79 para 0,71 após a ativação da política policy-pf-17.',
    status: 'em_analise',
  },
  {
    alertId: 'fair-2026-114',
    metric: 'Equal opportunity gap',
    group: 'Região Norte',
    detectedAt: '2026-07-22T03:00:00Z',
    severity: 'media',
    detail: 'Gap de 6,2 p.p. acima da tolerância de 5,0 p.p. definida pelo comitê de modelos.',
    status: 'em_analise',
  },
];

export const fairnessSeries = [
  { label: 'Fev', value: 0.86 },
  { label: 'Mar', value: 0.84 },
  { label: 'Abr', value: 0.82 },
  { label: 'Mai', value: 0.79 },
  { label: 'Jun', value: 0.71 },
  { label: 'Jul', value: 0.63 },
];

/* --------------------------------------- F08 · direitos do titular */

export interface SubjectRequest {
  requestId: string;
  documento: string;
  type: 'acesso' | 'correcao' | 'revisao' | 'portabilidade' | 'eliminacao';
  openedAt: string;
  dueAt: string;
  status: 'aguardando_identidade' | 'em_tratativa' | 'concluida' | 'recusada';
  channel: 'portal' | 'email' | 'sac';
  identityVerified: boolean;
  history: { at: string; actor: string; note: string }[];
}

export const subjectRequests: SubjectRequest[] = [
  {
    requestId: 'sr-2026-3341',
    documento: MARIA_DOC_MASKED,
    type: 'revisao',
    openedAt: '2026-07-27T11:30:00Z',
    dueAt: '2026-08-11T11:30:00Z',
    status: 'em_tratativa',
    channel: 'portal',
    identityVerified: true,
    history: [
      { at: '2026-07-27T11:30:00Z', actor: 'titular', note: 'Solicitação aberta com comprovante anexado.' },
      { at: '2026-07-27T11:32:00Z', actor: 'sistema', note: 'Identidade verificada por biometria facial.' },
      { at: '2026-07-27T11:41:00Z', actor: 'encarregado.dpo', note: 'Encaminhada para revisão humana rev-4412.' },
    ],
  },
  {
    requestId: 'sr-2026-3338',
    documento: '987.***.**55',
    type: 'acesso',
    openedAt: '2026-07-26T09:12:00Z',
    dueAt: '2026-08-10T09:12:00Z',
    status: 'aguardando_identidade',
    channel: 'email',
    identityVerified: false,
    history: [
      { at: '2026-07-26T09:12:00Z', actor: 'titular', note: 'Pedido de acesso aos dados recebido por e-mail.' },
      { at: '2026-07-26T09:15:00Z', actor: 'sistema', note: 'Link de verificação de identidade enviado.' },
    ],
  },
  {
    requestId: 'sr-2026-3325',
    documento: '456.***.**23',
    type: 'correcao',
    openedAt: '2026-07-22T16:04:00Z',
    dueAt: '2026-08-06T16:04:00Z',
    status: 'em_tratativa',
    channel: 'sac',
    identityVerified: true,
    history: [
      { at: '2026-07-22T16:04:00Z', actor: 'titular', note: 'Endereço divergente reportado.' },
      { at: '2026-07-23T10:20:00Z', actor: 'encarregado.dpo', note: 'Solicitada evidência de comprovante de residência.' },
    ],
  },
  {
    requestId: 'sr-2026-3301',
    documento: '321.***.**77',
    type: 'portabilidade',
    openedAt: '2026-07-14T08:40:00Z',
    dueAt: '2026-07-29T08:40:00Z',
    status: 'concluida',
    channel: 'portal',
    identityVerified: true,
    history: [
      { at: '2026-07-14T08:40:00Z', actor: 'titular', note: 'Solicitação de portabilidade em JSON.' },
      { at: '2026-07-16T14:02:00Z', actor: 'encarregado.dpo', note: 'Arquivo disponibilizado com validade de 30 dias.' },
    ],
  },
];

/* -------------------------------------------- F09 · ensaio de política */

export interface PolicySimulation {
  simulationId: string;
  rule: string;
  baseline: { approvalRatePct: number; expectedLossPct: number; volume: number; revenue: number };
  candidate: { approvalRatePct: number; expectedLossPct: number; volume: number; revenue: number };
  affectedSegments: { segment: string; deltaApprovalPp: number }[];
}

export const policyBaselineRule = `when score < 500
  then RECUSAR
when score >= 500 and score < 620
  then REVISAO_HUMANA
when score >= 620
  then APROVAR limite = renda * 0.30`;

export function simulatePolicy(rule: string): PolicySimulation {
  const stricter = rule.includes('540') || rule.includes('0.25');
  return {
    simulationId: `sim-${Date.now().toString().slice(-6)}`,
    rule,
    baseline: { approvalRatePct: 62.4, expectedLossPct: 3.8, volume: 412_000, revenue: 18.4 },
    candidate: {
      approvalRatePct: stricter ? 56.1 : 66.9,
      expectedLossPct: stricter ? 3.1 : 4.6,
      volume: 412_000,
      revenue: stricter ? 17.2 : 19.1,
    },
    affectedSegments: [
      { segment: 'Thin-file', deltaApprovalPp: stricter ? -8.4 : 6.2 },
      { segment: 'Faixa 18–24', deltaApprovalPp: stricter ? -6.1 : 4.8 },
      { segment: 'Região Norte', deltaApprovalPp: stricter ? -4.2 : 3.1 },
      { segment: 'Renda alta', deltaApprovalPp: stricter ? -0.4 : 0.6 },
    ],
  };
}

/* ----------------------------------------- F10 · versões de política */

export interface PolicyVersion {
  id: string;
  version: string;
  status: 'ativa' | 'aprovada' | 'rascunho' | 'arquivada';
  createdAt: string;
  author: string;
  approvalRatePct: number;
  changes: number;
}

export const policyVersions: PolicyVersion[] = [
  {
    id: 'policy-pf-17',
    version: '17',
    // Ativada antes da decisão de Maria (27/07 11:04), que declara esta versão.
    status: 'ativa',
    createdAt: '2026-07-20T09:00:00Z',
    author: 'comitê de crédito',
    approvalRatePct: 62.4,
    changes: 4,
  },
  {
    id: 'policy-pf-18',
    version: '18',
    status: 'rascunho',
    createdAt: '2026-07-27T13:10:00Z',
    author: 'ana.martins',
    approvalRatePct: 56.1,
    changes: 3,
  },
  {
    id: 'policy-pf-16',
    version: '16',
    status: 'arquivada',
    createdAt: '2026-06-18T09:00:00Z',
    author: 'comitê de crédito',
    approvalRatePct: 64.8,
    changes: 6,
  },
  {
    id: 'policy-pf-15',
    version: '15',
    status: 'arquivada',
    createdAt: '2026-05-06T09:00:00Z',
    author: 'comitê de crédito',
    approvalRatePct: 65.2,
    changes: 2,
  },
];

export interface PolicyDiffLine {
  kind: 'added' | 'removed' | 'context';
  text: string;
  businessMeaning?: string;
}

export const policyDiff: PolicyDiffLine[] = [
  { kind: 'context', text: 'when score < 500' },
  {
    kind: 'removed',
    text: '  then RECUSAR',
    businessMeaning: 'Antes, recusa direta abaixo de 500 pontos.',
  },
  {
    kind: 'added',
    text: '  then RECUSAR com oferta de coach thin-file',
    businessMeaning: 'Agora a recusa encaminha o titular para a jornada de coaching.',
  },
  { kind: 'context', text: 'when score >= 500 and score < 620' },
  {
    kind: 'removed',
    text: '  then REVISAO_HUMANA',
    businessMeaning: 'Faixa intermediária ia inteira para revisão humana.',
  },
  {
    kind: 'added',
    text: '  then REVISAO_HUMANA if utilization > 0.8 else APROVAR limite = renda * 0.20',
    businessMeaning:
      'Reduz fila de revisão: aprova com limite conservador quando a utilização de limites é baixa.',
  },
  { kind: 'context', text: 'when score >= 620' },
  {
    kind: 'removed',
    text: '  then APROVAR limite = renda * 0.30',
    businessMeaning: 'Limite anterior de 30% da renda.',
  },
  {
    kind: 'added',
    text: '  then APROVAR limite = renda * 0.28',
    businessMeaning: 'Limite reduzido para 28% da renda, diminuindo perda esperada.',
  },
];
