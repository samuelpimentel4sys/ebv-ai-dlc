/**
 * DTOs e mocks do EP-06 — Thin-file & Coach Financeiro B2C.
 * Tipos derivados da seção 8.1 das US-FE PRISMA-EP-06-F01..F09.
 */

import { MARIA } from '@/app/story';

/** Máscara de privacidade do portal do titular. */
const MARIA_DOC_MASKED = `${MARIA.document.slice(0, 3)}.***.**${MARIA.document.slice(-2)}`;

/**
 * A ficha do modelo (F02) e o monitoramento de deriva (F09) precisam citar a
 * mesma versão; no registry do EP-01 ela aparece sem o prefixo `v`.
 */
export const THINFILE_MODEL_VERSION = 'v2.4.0';

/* ------------------------------------- F01 · cobertura por parceiro */

export interface PartnerCoverage {
  partnerId: string;
  name: string;
  category: 'energia' | 'agua' | 'telecom' | 'streaming' | 'aluguel';
  region: string;
  coveragePct: number;
  records: number;
  qualityScore: number;
  status: 'ativo' | 'degradado' | 'suspenso';
  lastIngestAt: string;
}

export interface QualityDimension {
  dimension: string;
  score: number;
  target: number;
  description: string;
}

export interface IngestBatch {
  batchId: string;
  partnerId: string;
  receivedAt: string;
  records: number;
  accepted: number;
  rejected: number;
  status: 'processado' | 'processando' | 'com_erros';
  rejectReason?: string;
}

export const partnerCoverage: PartnerCoverage[] = [
  {
    partnerId: 'prt-energia-sul',
    name: 'Energia Sul Distribuidora',
    category: 'energia',
    region: 'Sul',
    coveragePct: 82.4,
    records: 4_120_000,
    qualityScore: 94,
    status: 'ativo',
    lastIngestAt: '2026-07-27T03:10:00Z',
  },
  {
    partnerId: 'prt-aguas-metro',
    name: 'Águas Metropolitanas',
    category: 'agua',
    region: 'Sudeste',
    coveragePct: 68.1,
    records: 6_880_000,
    qualityScore: 91,
    status: 'ativo',
    lastIngestAt: '2026-07-27T02:40:00Z',
  },
  {
    partnerId: 'prt-telecom-br',
    name: 'TelecomBR Móvel',
    category: 'telecom',
    region: 'Nacional',
    coveragePct: 74.9,
    records: 11_240_000,
    qualityScore: 86,
    status: 'degradado',
    lastIngestAt: '2026-07-26T04:05:00Z',
  },
  {
    partnerId: 'prt-stream-play',
    name: 'StreamPlay Assinaturas',
    category: 'streaming',
    region: 'Nacional',
    coveragePct: 41.2,
    records: 2_310_000,
    qualityScore: 79,
    status: 'ativo',
    lastIngestAt: '2026-07-27T01:20:00Z',
  },
  {
    partnerId: 'prt-locacao-imob',
    name: 'Rede Imobiliária Aluguel Fácil',
    category: 'aluguel',
    region: 'Nordeste',
    coveragePct: 22.7,
    records: 540_000,
    qualityScore: 68,
    status: 'suspenso',
    lastIngestAt: '2026-07-18T05:00:00Z',
  },
];

export const qualityDimensions: QualityDimension[] = [
  {
    dimension: 'Completude',
    score: 93,
    target: 90,
    description: 'Campos obrigatórios preenchidos no lote recebido.',
  },
  {
    dimension: 'Pontualidade',
    score: 88,
    target: 95,
    description: 'Lotes entregues dentro da janela contratada (D+1 até 06h).',
  },
  {
    dimension: 'Consistência',
    score: 96,
    target: 90,
    description: 'Valores dentro de faixas plausíveis e sem duplicidade de chave.',
  },
  {
    dimension: 'Identificabilidade',
    score: 84,
    target: 85,
    description: 'Registros com CPF válido e vínculo confirmado ao titular.',
  },
];

export const ingestBatches: IngestBatch[] = [
  {
    batchId: 'btc-20260727-01',
    partnerId: 'prt-energia-sul',
    receivedAt: '2026-07-27T03:10:00Z',
    records: 412_000,
    accepted: 409_880,
    rejected: 2_120,
    status: 'processado',
  },
  {
    batchId: 'btc-20260727-02',
    partnerId: 'prt-aguas-metro',
    receivedAt: '2026-07-27T02:40:00Z',
    records: 688_000,
    accepted: 671_500,
    rejected: 16_500,
    status: 'processado',
    rejectReason: 'CPF ausente em 2,4% dos registros',
  },
  {
    batchId: 'btc-20260727-03',
    partnerId: 'prt-stream-play',
    receivedAt: '2026-07-27T01:20:00Z',
    records: 231_000,
    accepted: 208_900,
    rejected: 22_100,
    status: 'com_erros',
    rejectReason: 'Divergência de layout na coluna de data de pagamento',
  },
  {
    batchId: 'btc-20260726-04',
    partnerId: 'prt-telecom-br',
    receivedAt: '2026-07-26T04:05:00Z',
    records: 1_124_000,
    accepted: 1_098_000,
    rejected: 26_000,
    status: 'processado',
    rejectReason: 'Registros fora da janela de 90 dias',
  },
];

/* ---------------------------------------- F02 · ficha do modelo */

export interface ModelCard {
  modelId: string;
  version: string;
  purpose: string;
  publishedAt: string;
  owner: string;
  trainingWindow: string;
  populationSize: number;
  features: { name: string; source: string; importance: number }[];
  metrics: { name: string; value: number; unit: string; hint: string }[];
  limitations: string[];
  approvedUses: string[];
  prohibitedUses: string[];
}

export interface BandPerformance {
  band: string;
  thinFileApproval: number;
  traditionalApproval: number;
  badRateThin: number;
  badRateTraditional: number;
  volume: number;
}

export const modelCard: ModelCard = {
  modelId: 'thinfile-pf',
  version: THINFILE_MODEL_VERSION,
  purpose:
    'Estimar risco de crédito de pessoas físicas sem histórico bancário relevante (thin-file), usando dados alternativos de consumo com consentimento explícito.',
  publishedAt: '2026-07-06T12:00:00Z',
  owner: 'Squad Risco Alternativo · Modelagem',
  trainingWindow: 'jan/2024 a mar/2026 (27 meses)',
  populationSize: 3_180_000,
  features: [
    {
      name: 'Regularidade de pagamento de energia',
      source: 'Parceria utilities',
      importance: 0.24,
    },
    {
      name: 'Tempo de vínculo com a conta de consumo',
      source: 'Parceria utilities',
      importance: 0.19,
    },
    {
      name: 'Estabilidade de endereço',
      source: 'Base cadastral',
      importance: 0.16,
    },
    {
      name: 'Regularidade de assinaturas recorrentes',
      source: 'Parceria streaming',
      importance: 0.13,
    },
    {
      name: 'Histórico de telecom pós-pago',
      source: 'Parceria telecom',
      importance: 0.12,
    },
    {
      name: 'Sinais de aluguel formal',
      source: 'Parceria imobiliária',
      importance: 0.09,
    },
    {
      name: 'Comportamento no coach financeiro',
      source: 'Produto Prisma',
      importance: 0.07,
    },
  ],
  metrics: [
    {
      name: 'KS',
      value: 41.8,
      unit: '',
      hint: 'separação entre bons e maus pagadores',
    },
    {
      name: 'AUC',
      value: 0.782,
      unit: '',
      hint: 'área sob a curva ROC na safra de validação',
    },
    { name: 'Gini', value: 56.4, unit: '', hint: 'poder discriminante global' },
    {
      name: 'Estabilidade (PSI)',
      value: 0.07,
      unit: '',
      hint: 'variação populacional vs. treino',
    },
  ],
  limitations: [
    'Não deve ser usado isoladamente para limites acima de R$ 15 mil.',
    'Cobertura reduzida nas regiões Norte e Centro-Oeste (parcerias em expansão).',
    'Requer consentimento ativo do titular; sem consentimento, o modelo não é executado.',
    'Performance ainda não estabilizada para jovens de 18 a 21 anos (safra curta).',
  ],
  approvedUses: [
    'Concessão inicial de crédito de baixo ticket',
    'Reavaliação de recusa por ausência de histórico',
    'Priorização de ofertas no marketplace com consentimento',
  ],
  prohibitedUses: [
    'Precificação de seguros',
    'Decisão isolada de emprego ou locação',
    'Uso sem base legal declarada',
  ],
};

export const bandPerformance: BandPerformance[] = [
  {
    band: 'Muito baixo',
    thinFileApproval: 8.2,
    traditionalApproval: 1.1,
    badRateThin: 2.1,
    badRateTraditional: 2.4,
    volume: 148_000,
  },
  {
    band: 'Baixo',
    thinFileApproval: 26.4,
    traditionalApproval: 4.8,
    badRateThin: 4.6,
    badRateTraditional: 5.1,
    volume: 342_000,
  },
  {
    band: 'Médio',
    thinFileApproval: 48.9,
    traditionalApproval: 11.2,
    badRateThin: 8.9,
    badRateTraditional: 9.4,
    volume: 511_000,
  },
  {
    band: 'Alto',
    thinFileApproval: 71.3,
    traditionalApproval: 18.6,
    badRateThin: 14.2,
    badRateTraditional: 16.8,
    volume: 288_000,
  },
  {
    band: 'Muito alto',
    thinFileApproval: 84.1,
    traditionalApproval: 24.0,
    badRateThin: 22.7,
    badRateTraditional: 27.9,
    volume: 96_000,
  },
];

/* ------------------------------------------------ F03 · jornada coach */

export interface JourneyStage {
  id: string;
  title: string;
  description: string;
  status: 'concluida' | 'atual' | 'bloqueada';
  points: number;
  scoreImpact: string;
}

export interface WeeklyGoal {
  goalId: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  points: number;
  dueAt: string;
  done: boolean;
}

export interface Achievement {
  achievementId: string;
  title: string;
  description: string;
  unlockedAt?: string;
  rarity: 'comum' | 'raro' | 'epico';
}

export const journeyStages: JourneyStage[] = [
  {
    id: 'stg-1',
    title: 'Conhecer meu score',
    description: 'Você consultou seu score e entendeu os fatores que mais pesam.',
    status: 'concluida',
    points: 50,
    scoreImpact: 'sem impacto direto',
  },
  {
    id: 'stg-2',
    title: 'Vincular conta de consumo',
    description: 'Uma conta de energia vinculada já ativa o modelo thin-file.',
    status: 'concluida',
    points: 120,
    scoreImpact: '+15 a +40 pontos',
  },
  {
    id: 'stg-3',
    title: 'Manter três pagamentos em dia',
    description: 'Pagamentos pontuais consecutivos consolidam o sinal positivo.',
    status: 'atual',
    points: 200,
    scoreImpact: '+20 a +55 pontos',
  },
  {
    id: 'stg-4',
    title: 'Reduzir uso do limite',
    description: 'Usar menos de 30% do limite disponível melhora o comportamento observado.',
    status: 'bloqueada',
    points: 180,
    scoreImpact: '+10 a +35 pontos',
  },
  {
    id: 'stg-5',
    title: 'Regularizar pendências',
    description: 'Negociar, quitar ou contestar apontamentos ativos remove o maior fator negativo.',
    status: 'bloqueada',
    points: 320,
    scoreImpact: '+44 a +62 pontos',
  },
];

export const weeklyGoals: WeeklyGoal[] = [
  {
    goalId: 'goal-1',
    title: 'Pagar a conta de energia até o vencimento',
    description: 'Vence em 30/07. Pagamento pontual conta para a jornada.',
    progress: 0,
    target: 1,
    unit: 'conta',
    points: 60,
    dueAt: '2026-07-30T23:59:00Z',
    done: false,
  },
  {
    goalId: 'goal-2',
    title: 'Revisar seus registros no portal',
    description: 'Conferir apontamentos e consultas ajuda a identificar erros.',
    progress: 1,
    target: 1,
    unit: 'visita',
    points: 30,
    dueAt: '2026-07-31T23:59:00Z',
    done: true,
  },
  {
    goalId: 'goal-3',
    title: 'Simular uma ação antes de decidir',
    description: 'Use o simulador para entender o efeito de quitar uma dívida.',
    progress: 2,
    target: 3,
    unit: 'simulações',
    points: 45,
    dueAt: '2026-08-02T23:59:00Z',
    done: false,
  },
];

export const achievements: Achievement[] = [
  {
    achievementId: 'ach-1',
    title: 'Primeiro passo',
    description: 'Consultou o score e concluiu o diagnóstico inicial.',
    unlockedAt: '2026-05-04T14:00:00Z',
    rarity: 'comum',
  },
  {
    achievementId: 'ach-2',
    title: 'Conta conectada',
    description: 'Vinculou a primeira conta de consumo com consentimento.',
    unlockedAt: '2026-05-14T10:20:00Z',
    rarity: 'comum',
  },
  {
    achievementId: 'ach-3',
    title: 'Sequência de três',
    description: 'Três pagamentos pontuais consecutivos registrados.',
    unlockedAt: '2026-07-05T09:00:00Z',
    rarity: 'raro',
  },
  {
    achievementId: 'ach-4',
    title: 'Zero pendências',
    description: 'Nenhum apontamento negativo ativo por 90 dias.',
    rarity: 'epico',
  },
];

/** `scoreStart` é o ponto da série do EP-01 em 04/05/2026, quando Maria entrou no coach. */
export const coachProgress = {
  documento: MARIA_DOC_MASKED,
  level: 4,
  levelName: 'Construtor de histórico',
  points: 1_180,
  pointsToNextLevel: 1_500,
  streakWeeks: 7,
  scoreStart: 448,
  scoreNow: MARIA.score,
  scoreGoal: 600,
};

/* ------------------------------------------- F04 · consentimentos */

export interface ConsentPurpose {
  consentId: string;
  purpose: string;
  description: string;
  dataUsed: string[];
  granted: boolean;
  grantedAt?: string;
  expiresAt?: string;
  required: boolean;
}

export interface ConsentEvent {
  at: string;
  action: 'concedido' | 'revogado' | 'renovado' | 'expirado';
  purpose: string;
  channel: string;
  ip: string;
}

export const consentPurposes: ConsentPurpose[] = [
  {
    consentId: 'cns-1',
    purpose: 'Uso de dados de consumo no cálculo do score',
    description:
      'Permite que contas de energia, água e telecom sejam usadas para calcular seu score thin-file.',
    dataUsed: ['Histórico de pagamento de utilities', 'Tempo de vínculo com a conta'],
    granted: true,
    grantedAt: '2026-05-14T10:20:00Z',
    expiresAt: '2027-05-14T10:20:00Z',
    required: true,
  },
  {
    consentId: 'cns-2',
    purpose: 'Ofertas personalizadas de crédito',
    description: 'Permite exibir ofertas de parceiros compatíveis com seu perfil de risco.',
    dataUsed: ['Faixa de score', 'Elegibilidade calculada'],
    granted: true,
    grantedAt: '2026-05-14T10:21:00Z',
    expiresAt: '2027-05-14T10:21:00Z',
    required: false,
  },
  {
    consentId: 'cns-3',
    purpose: 'Compartilhamento com parceiros de assinatura',
    description: 'Permite usar dados de assinaturas recorrentes como sinal positivo adicional.',
    dataUsed: ['Assinaturas ativas', 'Regularidade de pagamento'],
    granted: false,
    required: false,
  },
  {
    consentId: 'cns-4',
    purpose: 'Comunicações do coach financeiro',
    description: 'Permite enviar lembretes de metas e conquistas por e-mail e push.',
    dataUsed: ['E-mail', 'Progresso na jornada'],
    granted: true,
    grantedAt: '2026-05-14T10:22:00Z',
    required: false,
  },
];

export const consentHistory: ConsentEvent[] = [
  {
    at: '2026-07-12T19:30:00Z',
    action: 'revogado',
    purpose: 'Compartilhamento com parceiros de assinatura',
    channel: 'app',
    ip: '177.**.**.42',
  },
  {
    at: '2026-06-01T08:15:00Z',
    action: 'renovado',
    purpose: 'Ofertas personalizadas de crédito',
    channel: 'web',
    ip: '177.**.**.18',
  },
  {
    at: '2026-05-14T10:22:00Z',
    action: 'concedido',
    purpose: 'Comunicações do coach financeiro',
    channel: 'app',
    ip: '177.**.**.42',
  },
  {
    at: '2026-05-14T10:21:00Z',
    action: 'concedido',
    purpose: 'Ofertas personalizadas de crédito',
    channel: 'app',
    ip: '177.**.**.42',
  },
  {
    at: '2026-05-14T10:20:00Z',
    action: 'concedido',
    purpose: 'Uso de dados de consumo no cálculo do score',
    channel: 'app',
    ip: '177.**.**.42',
  },
];

/* ---------------------------------------------- F05 · missões */

export interface Mission {
  missionId: string;
  title: string;
  description: string;
  category: 'educacao' | 'habito' | 'dados' | 'regularizacao';
  difficulty: 'facil' | 'media' | 'dificil';
  points: number;
  progress: number;
  target: number;
  unit: string;
  status: 'disponivel' | 'em_andamento' | 'concluida' | 'bloqueada';
  requirement?: string;
  estimatedImpact: string;
}

export const missions: Mission[] = [
  {
    missionId: 'msn-1',
    title: 'Entenda seu score em 5 minutos',
    description: 'Assista ao guia rápido e responda a três perguntas sobre os fatores do score.',
    category: 'educacao',
    difficulty: 'facil',
    points: 40,
    progress: 3,
    target: 3,
    unit: 'perguntas',
    status: 'concluida',
    estimatedImpact: 'sem impacto direto no score',
  },
  {
    missionId: 'msn-2',
    title: 'Três meses de contas em dia',
    description: 'Pague suas contas de consumo até o vencimento por três meses seguidos.',
    category: 'habito',
    difficulty: 'media',
    points: 220,
    progress: 2,
    target: 3,
    unit: 'meses',
    status: 'em_andamento',
    estimatedImpact: '+20 a +55 pontos',
  },
  {
    missionId: 'msn-3',
    title: 'Conecte uma segunda conta',
    description: 'Vincule uma conta de água ou telecom para enriquecer seu histórico.',
    category: 'dados',
    difficulty: 'facil',
    points: 120,
    progress: 0,
    target: 1,
    unit: 'conta',
    status: 'disponivel',
    estimatedImpact: '+10 a +30 pontos',
  },
  {
    missionId: 'msn-4',
    title: 'Negocie uma pendência',
    description: `Use o canal de negociação e registre um acordo com o credor do ${MARIA.records[1].id}.`,
    category: 'regularizacao',
    difficulty: 'dificil',
    points: 400,
    progress: 0,
    target: 1,
    unit: 'acordo',
    status: 'disponivel',
    estimatedImpact: '+44 a +62 pontos',
  },
  {
    missionId: 'msn-5',
    title: 'Mantenha 90 dias sem novas pendências',
    description: 'Disponível após regularizar todas as pendências ativas.',
    category: 'habito',
    difficulty: 'dificil',
    points: 500,
    progress: 0,
    target: 90,
    unit: 'dias',
    status: 'bloqueada',
    requirement: 'Conclua a missão "Negocie uma pendência"',
    estimatedImpact: '+40 a +90 pontos',
  },
];

/* -------------------------------------------- F06 · simulador */

export interface SimulationAction {
  actionId: string;
  label: string;
  description: string;
  kind: 'quitar' | 'reduzir_uso' | 'vincular' | 'manter_pontualidade';
  amountLabel?: string;
}

export interface SimulationResult {
  scoreNow: number;
  estimateMin: number;
  estimateMax: number;
  confidence: 'alta' | 'media' | 'baixa';
  horizonDays: number;
  drivers: { label: string; contribution: number }[];
  caveat: string;
}

export interface SimulationHistoryItem {
  simulationId: string;
  at: string;
  action: string;
  estimateMin: number;
  estimateMax: number;
  applied: boolean;
}

export const simulationActions: SimulationAction[] = [
  {
    actionId: 'act-1',
    label: `Concluir a contestação ${MARIA.disputeProtocol}`,
    description: `Remove o apontamento ${MARIA.records[0].id} (${MARIA.records[0].creditor}) se a contestação for procedente.`,
    kind: 'quitar',
    amountLabel: 'R$ 1.284,90',
  },
  {
    actionId: 'act-2',
    label: 'Reduzir uso do limite para 25%',
    description: 'Baixar o comprometimento do limite rotativo.',
    kind: 'reduzir_uso',
  },
  {
    actionId: 'act-3',
    label: 'Vincular conta de água',
    description: 'Adiciona um novo sinal positivo de consumo.',
    kind: 'vincular',
  },
  {
    actionId: 'act-4',
    label: 'Manter 6 meses de pontualidade',
    description: 'Projeta o efeito de meio ano sem atrasos.',
    kind: 'manter_pontualidade',
  },
];

export function simulate(actionIds: string[]): SimulationResult {
  const base = coachProgress.scoreNow;
  const table: Record<string, { min: number; max: number; label: string }> = {
    // O teto de act-1 leva o score de 486 a 548 — o `scoreAfterDispute` da fixture.
    'act-1': {
      min: 44,
      max: MARIA.scoreAfterDispute - MARIA.score,
      label: 'Contestação procedente',
    },
    'act-2': { min: 12, max: 34, label: 'Redução do uso do limite' },
    'act-3': { min: 9, max: 28, label: 'Novo sinal de consumo' },
    'act-4': { min: 22, max: 51, label: 'Pontualidade sustentada' },
  };
  const chosen = actionIds.map((id) => table[id]).filter(Boolean);
  const min = chosen.reduce((sum, item) => sum + item.min, 0);
  const max = chosen.reduce((sum, item) => sum + item.max, 0);
  const total = max || 1;
  return {
    scoreNow: base,
    estimateMin: Math.min(base + min, 1000),
    estimateMax: Math.min(base + max, 1000),
    confidence: chosen.length === 0 ? 'baixa' : chosen.length > 2 ? 'media' : 'alta',
    horizonDays: 90,
    drivers: chosen.map((item) => ({
      label: item.label,
      contribution: (item.max / total) * 100,
    })),
    caveat:
      'A estimativa é uma projeção estatística com base em pessoas de perfil semelhante. O resultado real depende da atualização das fontes e do seu comportamento no período.',
  };
}

export const simulationHistory: SimulationHistoryItem[] = [
  {
    simulationId: 'sim-3',
    at: '2026-07-25T20:10:00Z',
    action: 'Concluir contestação + manter pontualidade',
    estimateMin: 552,
    estimateMax: 599,
    applied: false,
  },
  {
    simulationId: 'sim-2',
    at: '2026-07-14T18:32:00Z',
    action: 'Vincular conta de água',
    estimateMin: 495,
    estimateMax: 514,
    applied: true,
  },
  {
    simulationId: 'sim-1',
    at: '2026-06-30T09:05:00Z',
    action: 'Reduzir uso do limite para 25%',
    estimateMin: 498,
    estimateMax: 520,
    applied: false,
  },
];

/* -------------------------------------------- F07 · marketplace */

export interface Offer {
  offerId: string;
  partner: string;
  product: string;
  category: 'cartao' | 'emprestimo' | 'conta' | 'seguro';
  highlight: string;
  amountLabel: string;
  rateLabel: string;
  eligible: boolean;
  eligibilityScore: number;
  reasons: { label: string; positive: boolean }[];
  requirements: string[];
  ctaLabel: string;
}

export const offers: Offer[] = [
  {
    offerId: 'off-1',
    // Renomeado: "Banco Aurora" colidia com a Aurora Alimentos do EP-03/EP-04.
    partner: 'Banco Solar',
    product: 'Cartão sem anuidade',
    category: 'cartao',
    highlight: 'Aprovação com histórico alternativo',
    amountLabel: 'Limite inicial de R$ 800',
    rateLabel: 'Sem anuidade',
    eligible: true,
    eligibilityScore: 78,
    reasons: [
      {
        label: 'Conta de energia vinculada e em dia há 14 meses',
        positive: true,
      },
      {
        label: 'Nenhum atraso nos últimos 6 meses em contas de consumo',
        positive: true,
      },
      {
        label: 'Dois apontamentos ativos reduzem o limite inicial oferecido',
        positive: false,
      },
    ],
    requirements: ['Consentimento de dados de consumo ativo', 'Idade mínima de 18 anos'],
    ctaLabel: 'Solicitar cartão',
  },
  {
    offerId: 'off-2',
    partner: 'Fintech Ponte',
    product: 'Crédito para regularizar dívidas',
    category: 'emprestimo',
    highlight: 'Pagamento direto ao credor',
    amountLabel: 'Até R$ 5.000',
    rateLabel: '2,49% a.m.',
    eligible: true,
    eligibilityScore: 64,
    reasons: [
      {
        label: 'Valor da pendência compatível com a capacidade estimada',
        positive: true,
      },
      {
        label: `Sinais de consumo compensam o score na faixa ${MARIA.scoreBand.toLowerCase()}`,
        positive: true,
      },
      { label: 'Renda declarada ainda não comprovada', positive: false },
    ],
    requirements: ['Comprovação de renda na contratação', 'Consentimento de ofertas ativo'],
    ctaLabel: 'Simular proposta',
  },
  {
    offerId: 'off-3',
    partner: 'Cooperativa Raiz',
    product: 'Conta digital com limite progressivo',
    category: 'conta',
    highlight: 'Limite cresce com pontualidade',
    amountLabel: 'Limite de R$ 300 a R$ 2.000',
    rateLabel: 'Sem tarifa de manutenção',
    eligible: true,
    eligibilityScore: 82,
    reasons: [
      {
        label: 'Sequência de 7 semanas de metas cumpridas no coach',
        positive: true,
      },
      { label: 'Estabilidade de endereço superior a 3 anos', positive: true },
    ],
    requirements: ['Consentimento de dados de consumo ativo'],
    ctaLabel: 'Abrir conta',
  },
  {
    offerId: 'off-4',
    partner: 'Banco Meridiano',
    product: 'Empréstimo pessoal de R$ 15.000',
    category: 'emprestimo',
    highlight: 'Requer histórico bancário consolidado',
    amountLabel: 'Até R$ 15.000',
    rateLabel: '1,89% a.m.',
    eligible: false,
    eligibilityScore: 34,
    reasons: [
      {
        label: 'Ticket acima do limite recomendado para modelo thin-file',
        positive: false,
      },
      { label: 'Dois apontamentos negativos ativos', positive: false },
      {
        label: 'Tempo de relacionamento bancário insuficiente',
        positive: false,
      },
    ],
    requirements: ['Score tradicional acima de 600', 'Sem apontamentos ativos'],
    ctaLabel: 'Ver como me qualificar',
  },
];

/* ------------------------------------------ F08 · vínculo utilities */

export interface UtilityLink {
  linkId: string;
  partner: string;
  category: 'energia' | 'agua' | 'telecom' | 'streaming';
  accountRef: string;
  linkedAt: string;
  status: 'validado' | 'validando' | 'falhou' | 'revogado';
  monthsHistory: number;
  failReason?: string;
}

export const utilityLinks: UtilityLink[] = [
  {
    linkId: 'lnk-1',
    partner: 'Energia Sul Distribuidora',
    category: 'energia',
    accountRef: 'UC 88***412',
    linkedAt: '2026-05-14T10:20:00Z',
    status: 'validado',
    monthsHistory: 14,
  },
  {
    linkId: 'lnk-2',
    partner: 'TelecomBR Móvel',
    category: 'telecom',
    accountRef: '(11) *****-4477',
    linkedAt: '2026-07-20T16:40:00Z',
    status: 'validando',
    monthsHistory: 0,
  },
  {
    linkId: 'lnk-3',
    partner: 'Águas Metropolitanas',
    category: 'agua',
    accountRef: 'Matrícula 55***9',
    linkedAt: '2026-07-02T11:05:00Z',
    status: 'falhou',
    monthsHistory: 0,
    failReason: 'Titularidade da conta divergente do CPF informado',
  },
  {
    linkId: 'lnk-4',
    partner: 'StreamPlay Assinaturas',
    category: 'streaming',
    accountRef: 'assinatura ***882',
    linkedAt: '2026-06-08T09:15:00Z',
    status: 'revogado',
    monthsHistory: 5,
  },
];

export const linkablePartners = [
  { value: 'prt-energia-sul', label: 'Energia Sul Distribuidora (energia)' },
  { value: 'prt-aguas-metro', label: 'Águas Metropolitanas (água)' },
  { value: 'prt-telecom-br', label: 'TelecomBR Móvel (telecom)' },
  { value: 'prt-stream-play', label: 'StreamPlay Assinaturas (streaming)' },
];

/* --------------------------------------------- F09 · deriva do modelo */

export interface DriftFeature {
  feature: string;
  psi: number;
  threshold: number;
  status: 'estavel' | 'atencao' | 'deriva';
  note: string;
}

export interface VintagePerformance {
  vintage: string;
  ks: number;
  auc: number;
  badRate: number;
  volume: number;
}

export interface MonitoringAlert {
  alertId: string;
  at: string;
  severity: 'alta' | 'media' | 'baixa';
  title: string;
  detail: string;
  status: 'aberto' | 'em_analise' | 'resolvido';
}

export const driftFeatures: DriftFeature[] = [
  {
    feature: 'Regularidade de pagamento de energia',
    psi: 0.04,
    threshold: 0.1,
    status: 'estavel',
    note: 'Distribuição alinhada ao treino.',
  },
  {
    feature: 'Tempo de vínculo com a conta',
    psi: 0.09,
    threshold: 0.1,
    status: 'atencao',
    note: 'Entrada de novos vínculos recém-criados.',
  },
  {
    feature: 'Histórico de telecom pós-pago',
    psi: 0.18,
    threshold: 0.1,
    status: 'deriva',
    note: 'Parceiro com lote atrasado gerou lacuna de 48 h.',
  },
  {
    feature: 'Estabilidade de endereço',
    psi: 0.03,
    threshold: 0.1,
    status: 'estavel',
    note: 'Sem mudança material.',
  },
  {
    feature: 'Assinaturas recorrentes',
    psi: 0.12,
    threshold: 0.1,
    status: 'deriva',
    note: 'Mudança de mix de parceiros de streaming.',
  },
];

export const vintages: VintagePerformance[] = [
  { vintage: '2025-Q3', ks: 42.6, auc: 0.789, badRate: 8.4, volume: 218_000 },
  { vintage: '2025-Q4', ks: 42.1, auc: 0.786, badRate: 8.7, volume: 246_000 },
  { vintage: '2026-Q1', ks: 41.4, auc: 0.781, badRate: 9.2, volume: 271_000 },
  { vintage: '2026-Q2', ks: 39.8, auc: 0.772, badRate: 10.1, volume: 288_000 },
];

export const monitoringAlerts: MonitoringAlert[] = [
  {
    alertId: 'alr-1',
    at: '2026-07-27T06:10:00Z',
    severity: 'alta',
    title: 'PSI acima do limite em telecom pós-pago',
    detail: 'Lote atrasado do parceiro TelecomBR gerou lacuna de 48 h na feature.',
    status: 'em_analise',
  },
  {
    alertId: 'alr-2',
    at: '2026-07-24T06:10:00Z',
    severity: 'media',
    title: 'Queda de KS na safra 2026-Q2',
    detail: 'KS caiu 1,6 ponto contra a safra anterior; ainda acima do piso de 35.',
    status: 'aberto',
  },
  {
    alertId: 'alr-3',
    at: '2026-07-10T06:10:00Z',
    severity: 'baixa',
    title: 'Mix de parceiros de streaming alterado',
    detail: 'Novo parceiro elevou o volume da feature de assinaturas recorrentes.',
    status: 'resolvido',
  },
];

export const monitoringThresholds = {
  modelVersion: THINFILE_MODEL_VERSION,
  psiWarning: 0.1,
  psiCritical: 0.25,
  ksFloor: 35,
  retrainTrigger: 'PSI crítico em 2 features ou KS abaixo de 35 por duas safras',
  lastEvaluationAt: '2026-07-27T06:10:00Z',
};
