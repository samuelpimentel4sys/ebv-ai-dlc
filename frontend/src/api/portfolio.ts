/**
 * API client — Sala de Risco / Portfólio (grafo, contágio, stress, limites,
 * cubos, comunidades, histórico, dossiê, projeção 2D).
 *
 * Prefixo: `/api/v1/portfolio/*` · handoff Noah EP-04 lab 9/9 (`9aa6fcf`).
 * Ressalva: stubs Neptune/Trino — shapes lab ≠ mock rico; mappers com defaults.
 */
import { httpClient } from '@/lib/httpClient';
import type {
  ConcentrationAlert,
  ConcentrationLimit,
  ContagionResult,
  CubeFreshness,
  PortfolioEdge,
  PortfolioNode,
  PortfolioSnapshot,
  ReportSection,
  RiskCommunity,
  StressResult,
  StressScenario,
  TimelineEvent,
} from '@/epics/sala-risco/data';
import { portfolioSummary as mockSummary } from '@/epics/sala-risco/data';

/** UUID lab — BE aceita qualquer UUID (stubs não validam seed). */
export const LAB_PORTFOLIO_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

const BASE = '/api/v1/portfolio';

function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length ? value : fallback;
}

function mapEdgeKind(relationType: string): PortfolioEdge['kind'] {
  const t = (relationType || '').toUpperCase();
  if (t.includes('GARANT')) return 'garantia';
  if (t.includes('SOCI') || t.includes('GRUPO')) return 'societario';
  return 'cadeia';
}

function mapNodeType(lod: number): PortfolioNode['type'] {
  if (lod <= 1) return 'setor';
  if (lod === 2) return 'grupo';
  return 'cliente';
}

function mapConcStatus(status: string, share: number, limit: number, warn: number): ConcentrationLimit['status'] {
  const s = (status || '').toUpperCase();
  if (s.includes('BREACH') || s.includes('ESTOURO') || share > limit) return 'estouro';
  if (s.includes('WARN') || s.includes('ALERT') || share >= warn) return 'alerta';
  return 'ok';
}

function mapFreshStatus(status: string, withinSla?: boolean): CubeFreshness['status'] {
  const s = (status || '').toUpperCase();
  if (withinSla === false || s.includes('STALE') || s.includes('ATRAS')) return 'atrasado';
  if (s.includes('FAIL') || s.includes('ERROR') || s.includes('DOWN')) return 'falha';
  if (s.includes('REFRESH')) return 'atrasado';
  return 'ok';
}

function mapTimelineKind(eventType: string): TimelineEvent['kind'] {
  const t = (eventType || '').toUpperCase();
  if (t.includes('POLICY') || t.includes('POLIT')) return 'politica';
  if (t.includes('MODEL') || t.includes('MODELO')) return 'modelo';
  if (t.includes('LIMIT') || t.includes('LIMITE')) return 'limite';
  return 'mercado';
}

function mapDimLabel(dimension: string): string {
  const d = (dimension || '').toUpperCase();
  if (d.includes('SETOR') || d === 'SECTOR') return 'Setor';
  if (d.includes('REGIAO') || d.includes('REGION')) return 'Região';
  if (d.includes('GRUPO') || d.includes('GROUP')) return 'Grupo econômico';
  if (d.includes('PROD')) return 'Produto';
  return dimension || 'Dimensão';
}

/* -------------------------------------------------------------------------- */
/* F01 · Grafo / cockpit                                                      */
/* -------------------------------------------------------------------------- */

export type CockpitPayload = {
  nodes: PortfolioNode[];
  edges: PortfolioEdge[];
  summary: typeof mockSummary;
};

export async function fetchCockpitLive(portfolioId = LAB_PORTFOLIO_ID): Promise<CockpitPayload> {
  const res = await httpClient<{
    lod?: number;
    nodeCount?: number;
    edgeCount?: number;
    nodes?: {
      id: string;
      exposure: number;
      riskBand: string;
      score: number;
      x: number;
      y: number;
      z?: number;
    }[];
    edges?: {
      source: string;
      target: string;
      weight: number;
      relationType: string;
    }[];
  }>(`${BASE}/graph?portfolioId=${encodeURIComponent(portfolioId)}&lod=3&maxNodes=50000`);

  const lod = res.lod ?? 3;
  const nodes: PortfolioNode[] = (res.nodes ?? []).map((n, index) => ({
    id: n.id,
    label: n.id,
    type: mapNodeType(lod),
    x: num(n.x, 40 + index * 80) * 400,
    y: num(n.y, 0.2 + (index % 3) * 0.25) * 320,
    exposure: num(n.exposure),
    pd: Math.max(0, Math.min(100, (850 - num(n.score, 600)) / 20)),
    community: 'lab',
    sector: str(n.riskBand, '—'),
    rating: str(n.riskBand, '—'),
    overduePct: 0,
  }));

  const edges: PortfolioEdge[] = (res.edges ?? []).map((e) => ({
    from: e.source,
    to: e.target,
    weight: Math.max(1, Math.round(num(e.weight, 1) * 3)),
    kind: mapEdgeKind(e.relationType),
  }));

  const totalExposure = nodes.reduce((sum, n) => sum + n.exposure, 0);
  return {
    nodes,
    edges,
    summary: {
      ...mockSummary,
      totalExposure: totalExposure || mockSummary.totalExposure,
      clients: res.nodeCount ?? nodes.length,
      avgPd:
        nodes.length > 0
          ? Number((nodes.reduce((s, n) => s + n.pd, 0) / nodes.length).toFixed(1))
          : mockSummary.avgPd,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* F02 · Contágio                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchOriginNodesLive(portfolioId = LAB_PORTFOLIO_ID): Promise<PortfolioNode[]> {
  const { nodes } = await fetchCockpitLive(portfolioId);
  return nodes.length ? nodes : [];
}

export async function runContagionLive(
  originNodeId: string,
  severityPct: number,
  portfolioId = LAB_PORTFOLIO_ID,
): Promise<ContagionResult> {
  const transmissionFactor = Math.min(1, Math.max(0.05, severityPct / 100));
  const accepted = await httpClient<{ simId: string; status: string }>(`${BASE}/contagion/simulate`, {
    method: 'POST',
    body: {
      portfolioId,
      originNodeId,
      transmissionFactor,
      maxWaves: 4,
      relationTypes: ['FORNECEDOR', 'SOCIETARIO', 'GARANTIA'],
    },
  });

  const detail = await httpClient<{
    simId: string;
    status: string;
    originNodeId: string;
    waves?: { wave: number; expectedLoss: number | string; nodesDefaulted: number }[];
    totalExpectedLoss?: number | string;
  }>(`${BASE}/contagion/${encodeURIComponent(accepted.simId)}`);

  const critical = await httpClient<{
    nodes?: {
      nodeId: string;
      systemicScore: number;
      exposure: number | string;
      outDegree: number;
    }[];
  }>(`${BASE}/contagion/critical?portfolioId=${encodeURIComponent(portfolioId)}&limit=10`);

  let cumulative = 0;
  const waves = (detail.waves ?? []).map((w) => {
    const loss = num(w.expectedLoss);
    cumulative += loss;
    return {
      wave: w.wave,
      affectedNodes: Array.from({ length: Math.max(1, w.nodesDefaulted) }, (_, i) => `nó-${w.wave}.${i + 1}`),
      lossAmount: loss,
      cumulativeLoss: cumulative,
    };
  });

  return {
    runId: detail.simId,
    originNode: detail.originNodeId || originNodeId,
    shockSeverityPct: severityPct,
    waves,
    criticalNodes: (critical.nodes ?? []).map((n) => ({
      id: n.nodeId,
      label: n.nodeId,
      betweenness: Math.min(1, num(n.systemicScore) / (num(n.systemicScore) > 1 ? 100 : 1)),
      exposure: num(n.exposure),
      systemicScore: Math.round(
        num(n.systemicScore) <= 1 ? num(n.systemicScore) * 100 : num(n.systemicScore),
      ),
    })),
    premises: [
      `Fator de transmissão ${transmissionFactor} (lab stub Neptune).`,
      `Status simulação: ${detail.status}.`,
      'Garantias reais não são executadas dentro do horizonte simulado.',
      'Cenário determinístico lab — sem reação de política de crédito.',
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* F03 · Stress                                                               */
/* -------------------------------------------------------------------------- */

export async function fetchStressScenariosLive(): Promise<StressScenario[]> {
  const res = await httpClient<{
    scenarios?: {
      code: string;
      kind: string;
      label: string;
      variables?: Record<string, unknown>;
    }[];
  }>(`${BASE}/stress/scenarios`);

  const list = (res.scenarios ?? []).map((s) => {
    const v = s.variables ?? {};
    return {
      id: s.code.toLowerCase(),
      name: s.label || s.code,
      selicPp: num(v.selic ?? v.selicPp),
      gdpPct: num(v.gdp ?? v.gdpPct ?? v.pib),
      unemploymentPp: num(v.unemployment ?? v.unemploymentPp),
      fxPct: num(v.fx ?? v.fxPct ?? v.cambio),
      description: `${s.kind} · ${s.code}`,
      official: (s.kind || '').toUpperCase() === 'PRESET',
    } satisfies StressScenario;
  });

  if (!list.some((s) => s.id === 'custom')) {
    list.push({
      id: 'custom',
      name: 'Cenário do comitê',
      selicPp: 2,
      gdpPct: -0.5,
      unemploymentPp: 1.2,
      fxPct: 10,
      description: 'Parametrizado ao vivo na reunião de risco.',
      official: false,
    });
  }
  return list;
}

export async function runStressLive(
  scenario: StressScenario,
  portfolioId = LAB_PORTFOLIO_ID,
): Promise<StressResult> {
  const res = await httpClient<{
    runId: string;
    status: string;
    baselineNpl?: number | string;
    stressedNpl?: number | string;
    expectedLossDelta?: number | string;
    queued?: boolean;
  }>(`${BASE}/stress/run`, {
    method: 'POST',
    body: {
      portfolioId,
      compareBaseline: true,
      variables: {
        selic: scenario.selicPp,
        gdp: scenario.gdpPct,
        unemployment: scenario.unemploymentPp,
        fx: scenario.fxPct,
        scenarioCode: scenario.id,
      },
    },
  });

  const baseline = num(res.baselineNpl, 4.2);
  const stressed = num(res.stressedNpl, baseline + 1.5);
  const delta = num(res.expectedLossDelta, 13_200_000);
  const statusRaw = (res.status || '').toUpperCase();
  const status: StressResult['status'] = statusRaw.includes('QUEUE') || res.queued
    ? 'enfileirado'
    : statusRaw.includes('RUN') || statusRaw.includes('PEND')
      ? 'executando'
      : 'concluido';

  return {
    runId: res.runId,
    scenarioName: scenario.name,
    status,
    expectedLossPct: stressed,
    expectedLossAmount: delta,
    capitalImpactPp: Number((stressed - baseline).toFixed(2)),
    ratingMigration: [
      { from: 'A', to: 'BBB', volume: Math.round(stressed * 180) },
      { from: 'BBB', to: 'BB', volume: Math.round(stressed * 240) },
      { from: 'BB', to: 'B', volume: Math.round(stressed * 160) },
      { from: 'B', to: 'default', volume: Math.round(stressed * 40) },
    ],
    bySector: [
      { sector: 'Varejo', lossPct: Number((stressed * 1.2).toFixed(2)) },
      { sector: 'Transporte', lossPct: Number((stressed * 1.1).toFixed(2)) },
      { sector: 'Agro', lossPct: Number((stressed * 0.8).toFixed(2)) },
      { sector: 'Serviços', lossPct: Number((stressed * 0.95).toFixed(2)) },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* F04 · Concentração / limites                                               */
/* -------------------------------------------------------------------------- */

export async function fetchConcentrationLive(portfolioId = LAB_PORTFOLIO_ID): Promise<{
  limits: ConcentrationLimit[];
  alerts: ConcentrationAlert[];
}> {
  const [conc, alertsRes] = await Promise.all([
    httpClient<{
      dimensions?: {
        dimension: string;
        key: string;
        currentPct: number | string;
        thresholdPct: number | string;
        warnPct: number | string;
        status: string;
      }[];
    }>(`${BASE}/concentration?portfolioId=${encodeURIComponent(portfolioId)}`),
    httpClient<{
      alerts?: {
        alertId: string;
        dimension: string;
        key: string;
        severity: string;
        status: string;
        message: string;
      }[];
    }>(`${BASE}/alerts?portfolioId=${encodeURIComponent(portfolioId)}`),
  ]);

  const portfolioExposure = mockSummary.totalExposure;
  const limits: ConcentrationLimit[] = (conc.dimensions ?? []).map((d) => {
    const sharePct = num(d.currentPct);
    const limitPct = num(d.thresholdPct, 30);
    const warnPct = num(d.warnPct, limitPct * 0.9);
    return {
      dimension: mapDimLabel(d.dimension),
      bucket: str(d.key, d.dimension),
      exposure: (sharePct / 100) * portfolioExposure,
      sharePct,
      limitPct,
      status: mapConcStatus(d.status, sharePct, limitPct, warnPct),
    };
  });

  const alerts: ConcentrationAlert[] = (alertsRes.alerts ?? []).map((a) => {
    const match = limits.find(
      (l) =>
        l.dimension.toLowerCase().includes(mapDimLabel(a.dimension).toLowerCase()) &&
        l.bucket.toLowerCase() === str(a.key).toLowerCase(),
    );
    const sev = (a.severity || '').toUpperCase();
    return {
      alertId: a.alertId,
      bucket: `${mapDimLabel(a.dimension)} · ${str(a.key)}`,
      detectedAt: new Date().toISOString(),
      sharePct: match?.sharePct ?? 0,
      limitPct: match?.limitPct ?? 0,
      severity: sev.includes('CRIT') || sev.includes('HIGH') || sev.includes('BREACH') ? 'alta' : 'media',
      note: a.message || undefined,
    };
  });

  return { limits, alerts };
}

export async function upsertLimitLive(input: {
  dimension: string;
  thresholdPct: number;
  warnPct?: number;
  portfolioId?: string;
}): Promise<void> {
  const dimension = input.dimension
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, '_');
  await httpClient(`${BASE}/limits`, {
    method: 'POST',
    body: {
      portfolioId: input.portfolioId ?? LAB_PORTFOLIO_ID,
      dimension,
      thresholdPct: input.thresholdPct,
      warnPct: input.warnPct ?? Math.max(0, input.thresholdPct - 3),
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F05 · Cubos / frescor                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchFreshnessLive(): Promise<CubeFreshness[]> {
  const res = await httpClient<{
    cubes?: {
      cubeName: string;
      ageMinutes: number;
      slaMinutes: number;
      withinSla: boolean;
      status: string;
    }[];
  }>(`${BASE}/aggregates/freshness`);

  return (res.cubes ?? []).map((c) => ({
    cube: c.cubeName,
    domain: 'Carteira',
    lastRefreshAt: new Date(Date.now() - num(c.ageMinutes) * 60_000).toISOString(),
    ageMinutes: num(c.ageMinutes),
    slaMinutes: num(c.slaMinutes, 60),
    rows: 0,
    status: mapFreshStatus(c.status, c.withinSla),
    owner: 'plataforma-dados',
  }));
}

export async function refreshAggregateLive(cubeName: string, mode: 'INCREMENTAL' | 'FULL' = 'INCREMENTAL') {
  return httpClient<{ jobId: string; status: string; mode: string }>(`${BASE}/aggregates/refresh`, {
    method: 'POST',
    body: { cubeName, mode, partitions: [] },
  });
}

/* -------------------------------------------------------------------------- */
/* F06 · Comunidades                                                          */
/* -------------------------------------------------------------------------- */

export async function fetchCommunitiesLive(portfolioId = LAB_PORTFOLIO_ID): Promise<RiskCommunity[]> {
  const res = await httpClient<{
    communities?: {
      communityId: string;
      label: string;
      totalExposure: number | string;
      memberCount: number;
    }[];
  }>(`${BASE}/communities?portfolioId=${encodeURIComponent(portfolioId)}`);

  return (res.communities ?? []).map((c) => ({
    id: c.communityId,
    name: c.label,
    members: c.memberCount,
    exposure: num(c.totalExposure),
    avgPd: 5.0,
    overduePct: 4.0,
    cohesion: 0.65,
    dominantSector: 'lab',
    drivers: ['Cluster gerado pelo Louvain lab (stub Neptune).'],
  }));
}

export async function detectCommunitiesLive(portfolioId = LAB_PORTFOLIO_ID) {
  return httpClient<{ runId: string; status: string }>(`${BASE}/communities/detect`, {
    method: 'POST',
    body: { portfolioId, minCommunitySize: 5, algorithm: 'LOUVAIN' },
  });
}

/* -------------------------------------------------------------------------- */
/* F07 · Histórico / retrospectiva                                            */
/* -------------------------------------------------------------------------- */

const SNAPSHOT_DATES = ['2026-07-27', '2026-06-30', '2026-03-31', '2025-12-31'];

export async function fetchRetrospectiveLive(portfolioId = LAB_PORTFOLIO_ID): Promise<{
  snapshots: PortfolioSnapshot[];
  timeline: TimelineEvent[];
}> {
  const [snaps, timelineRes] = await Promise.all([
    Promise.all(
      SNAPSHOT_DATES.map(async (date) => {
        const s = await httpClient<{
          asOfDate: string;
          nodeCount?: number;
          summary?: Record<string, unknown>;
        }>(
          `${BASE}/snapshot?portfolioId=${encodeURIComponent(portfolioId)}&date=${encodeURIComponent(date)}`,
        );
        const summary = s.summary ?? {};
        return {
          asOf: s.asOfDate || date,
          totalExposure: num(summary.totalExposure, 1_200_000_000),
          expectedLossPct: num(summary.npl ?? summary.expectedLossPct, 3.9),
          avgPd: num(summary.avgPd, 3.9),
          clients: num(s.nodeCount, 15_000),
          concentrationTop5Pct: num(summary.concentrationTop5Pct, 26),
        } satisfies PortfolioSnapshot;
      }),
    ),
    httpClient<{
      events?: { eventId: string; eventAt: string; eventType: string; label: string }[];
    }>(`${BASE}/timeline?portfolioId=${encodeURIComponent(portfolioId)}`),
  ]);

  const timeline: TimelineEvent[] = (timelineRes.events ?? []).map((e) => ({
    at: (e.eventAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    title: e.label,
    kind: mapTimelineKind(e.eventType),
    detail: `${e.eventType} · ${e.eventId}`,
  }));

  return { snapshots: snaps, timeline };
}

export async function compareSnapshotsLive(
  dateA: string,
  dateB: string,
  portfolioId = LAB_PORTFOLIO_ID,
) {
  return httpClient<{
    dateA: string;
    dateB: string;
    exposureDelta: number | string;
    nplDelta: number | string;
    details?: Record<string, unknown>;
  }>(`${BASE}/compare`, {
    method: 'POST',
    body: { portfolioId, dateA, dateB },
  });
}

/* -------------------------------------------------------------------------- */
/* F08 · Reports                                                              */
/* -------------------------------------------------------------------------- */

const SECTION_ANALYSIS: Record<string, { analysisType: string; needsRef?: boolean }> = {
  sumario: { analysisType: 'SUMMARY' },
  exposicao: { analysisType: 'CONCENTRATION' },
  estresse: { analysisType: 'STRESS', needsRef: true },
  contagio: { analysisType: 'CONTAGION', needsRef: true },
  comunidades: { analysisType: 'COMMUNITIES' },
  frescor: { analysisType: 'FRESHNESS' },
  decisoes: { analysisType: 'DECISIONS' },
};

export async function createCommitteeReportLive(input: {
  title: string;
  watermarkTo: string;
  sections: ReportSection[];
  analysisRef?: string;
  portfolioId?: string;
}): Promise<{ reportId: string; status: string }> {
  const ref = input.analysisRef ?? 'lab-ref';
  return httpClient(`${BASE}/reports`, {
    method: 'POST',
    body: {
      portfolioId: input.portfolioId ?? LAB_PORTFOLIO_ID,
      title: input.title,
      watermarkTo: input.watermarkTo,
      sections: input.sections.map((s, index) => {
        const meta = SECTION_ANALYSIS[s.id] ?? { analysisType: s.id.toUpperCase() };
        return {
          analysisType: meta.analysisType,
          analysisRef: meta.needsRef ? ref : '',
          sortOrder: index,
        };
      }),
    },
  });
}

export async function downloadReportLive(reportId: string) {
  return httpClient<{ reportId: string; downloadUrl: string; expiresAt: string }>(
    `${BASE}/reports/${encodeURIComponent(reportId)}/download`,
  );
}

/* -------------------------------------------------------------------------- */
/* F09 · Grafo 2D / tabular                                                   */
/* -------------------------------------------------------------------------- */

export async function fetchGraph2dLive(portfolioId = LAB_PORTFOLIO_ID): Promise<{
  nodes: PortfolioNode[];
  edges: PortfolioEdge[];
}> {
  const [proj, tabular] = await Promise.all([
    httpClient<{
      nodes?: {
        id: string;
        x: number;
        y: number;
        exposure: number;
        riskBand: string;
        score: number;
        label: string;
      }[];
      edges?: { source: string; target: string; weight: number }[];
    }>(`${BASE}/graph/2d?portfolioId=${encodeURIComponent(portfolioId)}`),
    httpClient<{
      rows?: {
        id: string;
        label: string;
        exposure: number;
        riskBand: string;
        score: number;
        degree: number;
      }[];
    }>(`${BASE}/graph/tabular?portfolioId=${encodeURIComponent(portfolioId)}`),
  ]);

  const byId = new Map((tabular.rows ?? []).map((r) => [r.id, r]));
  const nodes: PortfolioNode[] = (proj.nodes ?? []).map((n, index) => {
    const row = byId.get(n.id);
    return {
      id: n.id,
      label: n.label || row?.label || n.id,
      type: 'cliente',
      x: num(n.x, index * 0.2) * 480,
      y: num(n.y, 0.5) * 280,
      exposure: num(n.exposure ?? row?.exposure),
      pd: Math.max(0, (850 - num(n.score ?? row?.score, 700)) / 20),
      community: 'lab',
      sector: str(n.riskBand ?? row?.riskBand, '—'),
      rating: str(n.riskBand ?? row?.riskBand, '—'),
      overduePct: 0,
    };
  });

  const edges: PortfolioEdge[] = (proj.edges ?? []).map((e) => ({
    from: e.source,
    to: e.target,
    weight: Math.max(1, Math.round(num(e.weight, 1) * 3)),
    kind: 'cadeia' as const,
  }));

  return { nodes, edges };
}
