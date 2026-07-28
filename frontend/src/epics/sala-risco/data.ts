/**
 * DTOs e mocks do EP-04 — Sala de Risco (cockpit de carteira).
 * Tipos derivados da seção 8.1 das US-FE PRISMA-EP-04-F01..F09.
 */

import { AURORA } from '@/app/story';

/** Mesma exposição consolidada do grupo apurada no EP-03 (GET /pj/{cnpj}/group). */
const AURORA_GROUP_EXPOSURE = 54_840_000;

/* ---------------------------------------------- F01/F09 · grafo carteira */

export interface PortfolioNode {
  id: string;
  label: string;
  type: 'setor' | 'grupo' | 'cliente';
  x: number;
  y: number;
  exposure: number;
  pd: number;
  community: string;
  sector: string;
  rating: string;
  overduePct: number;
}

export interface PortfolioEdge {
  from: string;
  to: string;
  weight: number;
  kind: 'societario' | 'cadeia' | 'garantia';
}

/**
 * A Aurora é o epicentro do EP-04: entre os nós do tipo `cliente` ela é a de
 * maior exposição, e é dela que parte a simulação de contágio. Os demais
 * clientes ficam abaixo de {@link AURORA.exposure} de propósito.
 */
export const portfolioNodes: PortfolioNode[] = [
  { id: 'set-alimentos', label: 'Alimentos e bebidas', type: 'setor', x: 120, y: 70, exposure: 412_000_000, pd: 3.1, community: 'Alimentos', sector: AURORA.sector, rating: 'BB', overduePct: 2.4 },
  { id: 'grp-aurora', label: AURORA.economicGroup, type: 'grupo', x: 96, y: 168, exposure: AURORA_GROUP_EXPOSURE, pd: 4.2, community: 'Alimentos', sector: AURORA.sector, rating: AURORA.rating, overduePct: 3.8 },
  { id: AURORA.graphNodeId, label: AURORA.shortName, type: 'cliente', x: 42, y: 250, exposure: AURORA.exposure, pd: 6.4, community: 'Alimentos', sector: AURORA.sector, rating: AURORA.rating, overduePct: 0 },
  { id: 'cli-aurora-log', label: 'Aurora Logística', type: 'cliente', x: 150, y: 252, exposure: 3_400_000, pd: 7.8, community: 'Logística', sector: 'Transporte', rating: 'B-', overduePct: 12.4 },
  { id: 'set-agro', label: 'Agronegócio', type: 'setor', x: 300, y: 62, exposure: 688_000_000, pd: 2.4, community: 'Agro', sector: 'Agro', rating: 'A-', overduePct: 1.1 },
  { id: 'grp-serra', label: 'Grupo Serra', type: 'grupo', x: 286, y: 158, exposure: 214_000_000, pd: 2.1, community: 'Agro', sector: 'Agro', rating: 'A', overduePct: 0.4 },
  { id: 'cli-serra-graos', label: 'Serra Grãos', type: 'cliente', x: 240, y: 248, exposure: 44_600_000, pd: 1.8, community: 'Agro', sector: 'Agro', rating: 'A', overduePct: 0 },
  { id: 'set-varejo', label: 'Varejo', type: 'setor', x: 420, y: 78, exposure: 356_000_000, pd: 5.6, community: 'Consumo', sector: 'Varejo', rating: 'BB-', overduePct: 4.9 },
  { id: 'grp-valeverde', label: 'Vale Verde', type: 'grupo', x: 404, y: 172, exposure: 88_000_000, pd: 6.4, community: 'Consumo', sector: 'Varejo', rating: 'B+', overduePct: 6.2 },
  { id: 'cli-transporte-ipe', label: 'Transportes Ipê', type: 'cliente', x: 336, y: 258, exposure: 42_000_000, pd: 9.1, community: 'Logística', sector: 'Transporte', rating: 'B', overduePct: 15.8 },
];

export const portfolioEdges: PortfolioEdge[] = [
  { from: 'set-alimentos', to: 'grp-aurora', weight: 3, kind: 'societario' },
  { from: 'grp-aurora', to: AURORA.graphNodeId, weight: 3, kind: 'societario' },
  { from: 'grp-aurora', to: 'cli-aurora-log', weight: 2, kind: 'societario' },
  { from: 'set-agro', to: 'grp-serra', weight: 3, kind: 'societario' },
  { from: 'grp-serra', to: 'cli-serra-graos', weight: 3, kind: 'societario' },
  { from: 'set-varejo', to: 'grp-valeverde', weight: 3, kind: 'societario' },
  { from: 'cli-aurora-log', to: 'grp-valeverde', weight: 2, kind: 'cadeia' },
  { from: 'cli-transporte-ipe', to: 'grp-valeverde', weight: 2, kind: 'cadeia' },
  { from: 'cli-serra-graos', to: 'cli-transporte-ipe', weight: 1, kind: 'cadeia' },
  { from: AURORA.graphNodeId, to: 'cli-serra-graos', weight: 1, kind: 'garantia' },
  { from: AURORA.graphNodeId, to: 'cli-transporte-ipe', weight: 2, kind: 'cadeia' },
];

export const lodLevels = [
  { id: 'setor', label: 'Setores', nodes: 3, description: 'Agregação máxima: 3 nós de setor.' },
  { id: 'grupo', label: 'Grupos econômicos', nodes: 6, description: 'Setores e grupos.' },
  { id: 'cliente', label: 'Clientes', nodes: 10, description: 'Todos os nós, incluindo clientes.' },
];

/* ------------------------------------------------ F02 · efeito dominó */

export interface ContagionWave {
  wave: number;
  affectedNodes: string[];
  lossAmount: number;
  cumulativeLoss: number;
}

export interface ContagionResult {
  runId: string;
  originNode: string;
  shockSeverityPct: number;
  waves: ContagionWave[];
  criticalNodes: { id: string; label: string; betweenness: number; exposure: number; systemicScore: number }[];
  premises: string[];
}

/**
 * A onda 1 sempre parte da Aurora: é ela que concentra exposição e
 * intermediação na carteira, e é o caso que a trilha do EP-04 conta.
 */
export function simulateContagion(originNode: string, severity: number): ContagionResult {
  const factor = severity / 100;
  const wave1 = AURORA.exposure * factor;
  const wave2 = 58_240_000 * factor * 0.62;
  const wave3 = 130_000_000 * factor * 0.34;
  const wave4 = 44_600_000 * factor * 0.12;
  return {
    runId: `ctg-${Date.now().toString().slice(-6)}`,
    originNode,
    shockSeverityPct: severity,
    waves: [
      {
        wave: 1,
        affectedNodes: [AURORA.shortName],
        lossAmount: wave1,
        cumulativeLoss: wave1,
      },
      {
        wave: 2,
        affectedNodes: [AURORA.economicGroup, 'Aurora Logística'],
        lossAmount: wave2,
        cumulativeLoss: wave1 + wave2,
      },
      {
        wave: 3,
        affectedNodes: ['Vale Verde', 'Transportes Ipê'],
        lossAmount: wave3,
        cumulativeLoss: wave1 + wave2 + wave3,
      },
      {
        wave: 4,
        affectedNodes: ['Serra Grãos'],
        lossAmount: wave4,
        cumulativeLoss: wave1 + wave2 + wave3 + wave4,
      },
    ],
    criticalNodes: [
      { id: AURORA.graphNodeId, label: AURORA.shortName, betweenness: 0.54, exposure: AURORA.exposure, systemicScore: 94 },
      { id: 'grp-valeverde', label: 'Vale Verde', betweenness: 0.42, exposure: 88_000_000, systemicScore: 88 },
      { id: 'cli-transporte-ipe', label: 'Transportes Ipê', betweenness: 0.27, exposure: 42_000_000, systemicScore: 74 },
      { id: 'cli-serra-graos', label: 'Serra Grãos', betweenness: 0.19, exposure: 44_600_000, systemicScore: 61 },
    ],
    premises: [
      'Propagação limitada a 4 ondas e a arestas com peso ≥ 1.',
      'Perda por contágio decai 38% a cada onda (calibração histórica 2019–2025).',
      'Garantias reais não são executadas dentro do horizonte simulado.',
      'Cenário determinístico: não há reação de política de crédito durante a propagação.',
    ],
  };
}

/* ------------------------------------------------ F03 · estresse macro */

export interface StressScenario {
  id: string;
  name: string;
  selicPp: number;
  gdpPct: number;
  unemploymentPp: number;
  fxPct: number;
  description: string;
  official: boolean;
}

export interface StressResult {
  runId: string;
  scenarioName: string;
  status: 'enfileirado' | 'executando' | 'concluido';
  expectedLossPct: number;
  expectedLossAmount: number;
  capitalImpactPp: number;
  ratingMigration: { from: string; to: string; volume: number }[];
  bySector: { sector: string; lossPct: number }[];
}

export const stressScenarios: StressScenario[] = [
  {
    id: 'base',
    name: 'Cenário base (Copom)',
    selicPp: 0,
    gdpPct: 1.8,
    unemploymentPp: 0,
    fxPct: 0,
    description: 'Projeção de mercado do boletim Focus mais recente.',
    official: true,
  },
  {
    id: 'adverso',
    name: 'Adverso regulatório',
    selicPp: 3,
    gdpPct: -1.2,
    unemploymentPp: 2.4,
    fxPct: 18,
    description: 'Cenário adverso padronizado usado no teste de estresse anual.',
    official: true,
  },
  {
    id: 'severo',
    name: 'Severamente adverso',
    selicPp: 6,
    gdpPct: -3.5,
    unemploymentPp: 4.8,
    fxPct: 35,
    description: 'Choque combinado de juros, atividade e câmbio.',
    official: true,
  },
  {
    id: 'custom',
    name: 'Cenário do comitê',
    selicPp: 2,
    gdpPct: -0.5,
    unemploymentPp: 1.2,
    fxPct: 10,
    description: 'Parametrizado ao vivo na reunião de risco.',
    official: false,
  },
];

export function runStress(scenario: StressScenario): StressResult {
  const intensity =
    scenario.selicPp * 0.6 + Math.abs(Math.min(scenario.gdpPct, 0)) * 1.4 + scenario.unemploymentPp * 0.8;
  const lossPct = 3.4 + intensity * 0.42;
  return {
    runId: `str-${Date.now().toString().slice(-6)}`,
    scenarioName: scenario.name,
    status: 'concluido',
    expectedLossPct: Number(lossPct.toFixed(2)),
    expectedLossAmount: (lossPct / 100) * 1_456_000_000,
    capitalImpactPp: Number((intensity * 0.14).toFixed(2)),
    ratingMigration: [
      { from: 'A', to: 'BBB', volume: Math.round(intensity * 1_800) },
      { from: 'BBB', to: 'BB', volume: Math.round(intensity * 2_400) },
      { from: 'BB', to: 'B', volume: Math.round(intensity * 1_600) },
      { from: 'B', to: 'default', volume: Math.round(intensity * 420) },
    ],
    bySector: [
      { sector: 'Varejo', lossPct: Number((lossPct * 1.42).toFixed(2)) },
      { sector: 'Transporte', lossPct: Number((lossPct * 1.28).toFixed(2)) },
      { sector: AURORA.sector, lossPct: Number((lossPct * 1.05).toFixed(2)) },
      { sector: 'Agro', lossPct: Number((lossPct * 0.72).toFixed(2)) },
      { sector: 'Serviços', lossPct: Number((lossPct * 0.94).toFixed(2)) },
    ],
  };
}

/* ------------------------------------------------ F04 · concentração */

export interface ConcentrationLimit {
  dimension: string;
  bucket: string;
  exposure: number;
  sharePct: number;
  limitPct: number;
  status: 'ok' | 'alerta' | 'estouro';
}

/**
 * O limite por grupo econômico é calibrado pelo rating: grupos grau de
 * investimento (Grupo Serra, A) toleram 12% da carteira, grupos especulativos
 * (Grupo Aurora, BB−) apenas 2%. É por isso que a Aurora estoura com uma
 * exposição muito menor que a do Grupo Serra.
 */
export const concentration: ConcentrationLimit[] = [
  { dimension: 'Setor', bucket: 'Agronegócio', exposure: 688_000_000, sharePct: 32.4, limitPct: 30, status: 'estouro' },
  { dimension: 'Setor', bucket: AURORA.sector, exposure: 412_000_000, sharePct: 19.4, limitPct: 25, status: 'ok' },
  { dimension: 'Setor', bucket: 'Varejo', exposure: 356_000_000, sharePct: 16.8, limitPct: 20, status: 'alerta' },
  { dimension: 'Região', bucket: 'Sudeste', exposure: 912_000_000, sharePct: 43.0, limitPct: 45, status: 'alerta' },
  { dimension: 'Região', bucket: 'Centro-Oeste', exposure: 486_000_000, sharePct: 22.9, limitPct: 25, status: 'ok' },
  { dimension: 'Grupo econômico', bucket: 'Grupo Serra', exposure: 214_000_000, sharePct: 10.1, limitPct: 12, status: 'alerta' },
  { dimension: 'Grupo econômico', bucket: AURORA.economicGroup, exposure: AURORA_GROUP_EXPOSURE, sharePct: 2.6, limitPct: 2, status: 'estouro' },
  { dimension: 'Produto', bucket: 'Capital de giro', exposure: 745_000_000, sharePct: 35.1, limitPct: 40, status: 'ok' },
];

export interface ConcentrationAlert {
  alertId: string;
  bucket: string;
  detectedAt: string;
  sharePct: number;
  limitPct: number;
  severity: 'alta' | 'media';
  note?: string;
}

export const concentrationAlerts: ConcentrationAlert[] = [
  {
    alertId: 'cc-2026-042',
    bucket: `Grupo econômico · ${AURORA.economicGroup}`,
    detectedAt: '2026-07-27T06:00:00Z',
    sharePct: 2.6,
    limitPct: 2,
    severity: 'alta',
    note: `${AURORA.shortName} (${AURORA.rating}) responde por R$ 48,2 mi dos R$ 54,84 mi do grupo; limite revisado vence antes da renovação.`,
  },
  {
    alertId: 'cc-2026-041',
    bucket: 'Setor · Agronegócio',
    detectedAt: '2026-07-26T06:00:00Z',
    sharePct: 32.4,
    limitPct: 30,
    severity: 'alta',
  },
  {
    alertId: 'cc-2026-039',
    bucket: 'Grupo econômico · Grupo Serra',
    detectedAt: '2026-07-24T06:00:00Z',
    sharePct: 10.1,
    limitPct: 12,
    severity: 'media',
    note: 'Aprovada exceção temporária pelo comitê até 30/09/2026.',
  },
  {
    alertId: 'cc-2026-036',
    bucket: 'Região · Sudeste',
    detectedAt: '2026-07-20T06:00:00Z',
    sharePct: 43.0,
    limitPct: 45,
    severity: 'media',
  },
];

/* -------------------------------------------------- F05 · frescor cubos */

export interface CubeFreshness {
  cube: string;
  domain: string;
  lastRefreshAt: string;
  ageMinutes: number;
  slaMinutes: number;
  rows: number;
  status: 'ok' | 'atrasado' | 'falha';
  owner: string;
}

/** `ageMinutes` é medido contra 27/07/2026 11:04 (DEMO_TIMESTAMP), não contra o relógio. */
export const cubes: CubeFreshness[] = [
  { cube: 'agg_exposure_sector_d', domain: 'Carteira', lastRefreshAt: '2026-07-27T13:26:00Z', ageMinutes: 38, slaMinutes: 60, rows: 18_400, status: 'ok', owner: 'plataforma-dados' },
  { cube: 'agg_exposure_group_d', domain: 'Carteira', lastRefreshAt: '2026-07-27T13:21:00Z', ageMinutes: 43, slaMinutes: 60, rows: 92_100, status: 'ok', owner: 'plataforma-dados' },
  { cube: 'agg_pd_migration_m', domain: 'Risco', lastRefreshAt: '2026-07-27T09:56:00Z', ageMinutes: 248, slaMinutes: 180, rows: 412_000, status: 'atrasado', owner: 'risco-modelos' },
  { cube: 'graph_edges_snapshot', domain: 'Grafo', lastRefreshAt: '2026-07-27T11:48:00Z', ageMinutes: 136, slaMinutes: 240, rows: 1_240_000, status: 'ok', owner: 'plataforma-dados' },
  { cube: 'agg_collateral_coverage_d', domain: 'Garantias', lastRefreshAt: '2026-07-26T14:00:00Z', ageMinutes: 1_424, slaMinutes: 1_440, rows: 64_800, status: 'ok', owner: 'formalizacao' },
  { cube: 'agg_stress_baseline', domain: 'Estresse', lastRefreshAt: '2026-07-24T18:24:00Z', ageMinutes: 4_060, slaMinutes: 1_440, rows: 8_200, status: 'falha', owner: 'risco-modelos' },
];

/* ---------------------------------------------- F06 · comunidades */

export interface RiskCommunity {
  id: string;
  name: string;
  members: number;
  exposure: number;
  avgPd: number;
  overduePct: number;
  cohesion: number;
  dominantSector: string;
  drivers: string[];
}

export const communities: RiskCommunity[] = [
  {
    id: 'com-aurora',
    name: `Cadeia produtiva ${AURORA.shortName}`,
    members: 34,
    exposure: 224_000_000,
    avgPd: 8.9,
    overduePct: 14.2,
    cohesion: 0.79,
    dominantSector: AURORA.sector,
    drivers: [
      `${AURORA.shortName} é o nó de maior intermediação da comunidade`,
      'Fornecimento cruzado entre integrantes e garantias recíprocas',
      'Dois clientes finais respondem por 54% da receita do bolsão',
    ],
  },
  {
    id: 'com-log',
    name: 'Bolsão logístico Sudeste',
    members: 42,
    exposure: 186_000_000,
    avgPd: 8.4,
    overduePct: 13.1,
    cohesion: 0.71,
    dominantSector: 'Transporte',
    drivers: [
      'Dependência de 3 embarcadores comuns',
      'Elevação de 22% no custo de diesel em 6 meses',
      'Frota média com 11 anos de uso',
    ],
  },
  {
    id: 'com-agro-mt',
    name: 'Cadeia de grãos Mato Grosso',
    members: 68,
    exposure: 412_000_000,
    avgPd: 2.2,
    overduePct: 0.8,
    cohesion: 0.64,
    dominantSector: 'Agro',
    drivers: ['Concentração de tradings compradoras', 'Exposição comum a preço da soja'],
  },
  {
    id: 'com-varejo-nordeste',
    name: 'Varejo regional Nordeste',
    members: 96,
    exposure: 148_000_000,
    avgPd: 6.9,
    overduePct: 7.4,
    cohesion: 0.52,
    dominantSector: 'Varejo',
    drivers: ['Mesmo distribuidor atacadista', 'Sazonalidade concentrada no 4º trimestre'],
  },
  {
    id: 'com-metal-industrial',
    name: 'Cluster metalmecânico',
    members: 31,
    exposure: 148_000_000,
    avgPd: 3.8,
    overduePct: 2.9,
    cohesion: 0.58,
    dominantSector: 'Metalurgia',
    drivers: ['Fornecimento cruzado entre integrantes', 'Dois clientes finais respondem por 54% da receita'],
  },
];

/* ------------------------------------------- F07 · retrospectiva */

export interface PortfolioSnapshot {
  asOf: string;
  totalExposure: number;
  expectedLossPct: number;
  avgPd: number;
  clients: number;
  concentrationTop5Pct: number;
}

export const snapshots: PortfolioSnapshot[] = [
  { asOf: '2026-07-27', totalExposure: 2_124_000_000, expectedLossPct: 3.8, avgPd: 4.1, clients: 18_420, concentrationTop5Pct: 28.4 },
  { asOf: '2026-06-30', totalExposure: 2_046_000_000, expectedLossPct: 3.5, avgPd: 3.9, clients: 18_104, concentrationTop5Pct: 26.9 },
  { asOf: '2026-03-31', totalExposure: 1_912_000_000, expectedLossPct: 3.2, avgPd: 3.6, clients: 17_640, concentrationTop5Pct: 25.1 },
  { asOf: '2025-12-31', totalExposure: 1_820_000_000, expectedLossPct: 2.9, avgPd: 3.4, clients: 17_012, concentrationTop5Pct: 24.4 },
];

export interface TimelineEvent {
  at: string;
  title: string;
  kind: 'politica' | 'modelo' | 'limite' | 'mercado';
  detail: string;
}

export const portfolioTimeline: TimelineEvent[] = [
  { at: '2026-07-27', title: `Limite do ${AURORA.economicGroup} em estouro`, kind: 'limite', detail: `Exposição de R$ 54,84 mi (2,6%) contra teto de 2,0% para rating ${AURORA.rating}.` },
  { at: '2026-07-20', title: 'Política policy-pf-17 ativada', kind: 'politica', detail: 'Corte de aprovação e limite por renda revisados.' },
  { at: '2026-07-10', title: 'Limite de agro elevado para 30%', kind: 'limite', detail: 'Comitê aprovou exceção temporária até setembro.' },
  { at: '2026-06-18', title: 'Modelo score-pj v1.6.0 promovido', kind: 'modelo', detail: 'Ganho de 2,1 pontos de KS na safra de validação.' },
  { at: '2026-05-04', title: 'Choque de diesel', kind: 'mercado', detail: 'Elevação de 12% no trimestre pressiona bolsão logístico.' },
];

/* ------------------------------------------------ F08 · dossiê comitê */

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  pages: number;
  required?: boolean;
}

export const reportSections: ReportSection[] = [
  { id: 'sumario', title: 'Sumário executivo', description: 'Posição da carteira e principais riscos.', pages: 2, required: true },
  { id: 'exposicao', title: 'Exposição e concentração', description: 'Quebras por setor, região, grupo e produto.', pages: 4, required: true },
  { id: 'estresse', title: 'Resultados de estresse', description: 'Cenários oficiais e cenário do comitê.', pages: 3 },
  { id: 'contagio', title: 'Simulação de contágio', description: 'Ondas de propagação e nós críticos.', pages: 3 },
  { id: 'comunidades', title: 'Bolsões de risco', description: 'Comunidades detectadas e drivers.', pages: 2 },
  { id: 'frescor', title: 'Qualidade e frescor dos dados', description: 'Cubos, SLA e pendências.', pages: 1, required: true },
  { id: 'decisoes', title: 'Decisões e encaminhamentos', description: 'Propostas de limite e exceções.', pages: 2, required: true },
];

/* ------------------------------------------------ resumo do cockpit */

export const portfolioSummary = {
  totalExposure: 2_124_000_000,
  clients: 18_420,
  expectedLossPct: 3.8,
  avgPd: 4.1,
  communities: communities.length,
  breachedLimits: concentration.filter((item) => item.status === 'estouro').length,
};
