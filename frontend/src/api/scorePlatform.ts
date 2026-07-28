/**
 * API client — Score & Plataforma (features, score, decisões, ingest, modelos, SLO, replay).
 * Domínio produto: Plataforma · Dados · Risco · Integração · ML
 */
import { httpClient } from '@/lib/httpClient';
import type {
  FeatureCatalogItem,
  PitLookupResult,
  ScoreCurrentResponse,
  ScoreHistoryPoint,
  ModelVersion,
  ModelStage,
  IdentityCandidate,
  IngestSource,
  SourceStatus,
  StreamHealthResponse,
  DecisionMeta,
  AttributeDiff,
  PlaygroundResponse,
  SloResponse,
  ReplayJob,
} from '@/epics/score-vivo/data';

/* -------------------------------------------------------------------------- */
/* F02 Features                                                               */
/* -------------------------------------------------------------------------- */

interface BeFeatureCatalogItem {
  name: string;
  entity: string;
  valueType: string;
  maxAgeSeconds: number;
  owner: string;
  active: boolean;
}

interface BeFeaturePoint {
  value: unknown;
  eventTs: string | null;
  degraded: boolean;
}

interface BeFeaturesResponse {
  documento: string;
  asOf: string;
  liveRead: boolean;
  features: Record<string, BeFeaturePoint>;
}

function mapValueType(valueType: string): FeatureCatalogItem['dataType'] {
  const t = valueType.toLowerCase();
  if (t.includes('int') || t.includes('long')) return 'int';
  if (t.includes('bool')) return 'bool';
  if (t.includes('time') || t.includes('date')) return 'timestamp';
  if (t.includes('dec') || t.includes('double') || t.includes('float') || t.includes('num')) {
    return 'decimal';
  }
  return 'string';
}

function mapEntity(entity: string): FeatureCatalogItem['entity'] {
  return entity.toUpperCase().includes('CNPJ') ? 'CNPJ' : 'CPF';
}

export async function fetchFeatureCatalogLive(): Promise<FeatureCatalogItem[]> {
  const items = await httpClient<BeFeatureCatalogItem[]>('/api/v1/features/catalog');
  return items.map((item) => ({
    name: item.name,
    entity: mapEntity(item.entity),
    dataType: mapValueType(item.valueType),
    domain: item.active ? 'Feature Store' : 'Inativo',
    freshnessMinutes: Math.max(1, Math.ceil(item.maxAgeSeconds / 60)),
    pitSupported: item.active,
    owner: item.owner || '—',
    description: `${item.name} (${item.valueType})`,
    lineage: ['feature-store'],
    nullRate: 0,
  }));
}

export async function fetchPitLookupLive(documento: string, asOf: string): Promise<PitLookupResult> {
  const asOfIso = asOf.includes('Z') || asOf.includes('+') ? asOf : `${asOf}:00Z`;
  const qs = new URLSearchParams({ asOf: asOfIso });
  const res = await httpClient<BeFeaturesResponse>(
    `/api/v1/features/${encodeURIComponent(documento)}?${qs.toString()}`,
  );
  return {
    documento: res.documento,
    asOf: res.asOf,
    values: Object.entries(res.features).map(([name, point]) => ({
      name,
      value: point.value == null ? '—' : String(point.value),
      observedAt: point.eventTs ?? res.asOf,
      source: point.degraded ? 'degraded' : res.liveRead ? 'online' : 'pit',
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* F03 Score                                                                  */
/* -------------------------------------------------------------------------- */

interface BeCurrentScore {
  documento: string;
  score: number;
  modelVersion: string;
  updatedAt: string;
}

interface BeScoreHistory {
  items: { score: number; modelVersion: string; reason: string; at: string }[];
  page: number;
  size: number;
  total: number;
}

function scoreBand(score: number): string {
  if (score >= 800) return 'faixa A';
  if (score >= 700) return 'faixa B';
  if (score >= 600) return 'faixa C';
  if (score >= 400) return 'faixa D';
  return 'faixa E';
}

export async function fetchScoreTimelineLive(documento: string): Promise<{
  current: ScoreCurrentResponse;
  history: ScoreHistoryPoint[];
}> {
  const [current, history] = await Promise.all([
    httpClient<BeCurrentScore>(`/api/v1/score/${encodeURIComponent(documento)}`),
    httpClient<BeScoreHistory>(
      `/api/v1/score/${encodeURIComponent(documento)}/history?page=0&size=50`,
    ),
  ]);

  const points: ScoreHistoryPoint[] = history.items.map((item, index, arr) => {
    const prev = index > 0 ? arr[index - 1].score : item.score;
    return {
      observedAt: item.at,
      score: item.score,
      modelVersion: item.modelVersion,
      triggerEvent: item.reason || undefined,
      delta: item.score - prev,
    };
  });

  return {
    current: {
      documento: current.documento,
      score: current.score,
      band: scoreBand(current.score),
      modelVersion: current.modelVersion,
      updatedAt: current.updatedAt,
      pd12m: 0,
    },
    history: points,
  };
}

export async function recalculateScoreLive(documento: string): Promise<void> {
  await httpClient('/api/v1/score/recalculate', {
    method: 'POST',
    body: { documento, reason: 'manual-ui', critical: false },
  });
}

/* -------------------------------------------------------------------------- */
/* F09 Models                                                                 */
/* -------------------------------------------------------------------------- */

interface BeModelVersion {
  modelId: string;
  version: string;
  stage: string;
  artifactUri: string;
  metricsJson: string;
  immutable: boolean;
  createdAt: string;
}

function mapStage(stage: string): ModelStage {
  const s = stage.toLowerCase();
  if (s.includes('prod') || s === 'production') return 'producao';
  if (s.includes('shadow')) return 'shadow';
  if (s.includes('arch') || s.includes('retir')) return 'arquivado';
  return 'staging';
}

function parseMetrics(json: string): { ks: number; auc: number; psi: number } {
  try {
    const parsed = JSON.parse(json || '{}') as Record<string, number>;
    return {
      ks: Number(parsed.ks ?? parsed.KS ?? 0),
      auc: Number(parsed.auc ?? parsed.AUC ?? 0),
      psi: Number(parsed.psi ?? parsed.PSI ?? 0),
    };
  } catch {
    return { ks: 0, auc: 0, psi: 0 };
  }
}

export async function fetchModelsLive(): Promise<ModelVersion[]> {
  const items = await httpClient<BeModelVersion[]>('/api/v1/models');
  return items.map((item) => {
    const metrics = parseMetrics(item.metricsJson);
    const stage = mapStage(item.stage);
    return {
      modelId: item.modelId,
      version: item.version.replace(/^v/, ''),
      stage,
      ks: metrics.ks,
      auc: metrics.auc,
      psi: metrics.psi,
      trainedAt: item.createdAt,
      approvedBy: item.immutable ? 'registry' : '—',
      trafficPct: stage === 'producao' ? 90 : stage === 'shadow' ? 10 : 0,
    };
  });
}

export async function promoteModelLive(
  modelId: string,
  version: string,
  toStage = 'PRODUCTION',
): Promise<void> {
  await httpClient(`/api/v1/models/${encodeURIComponent(modelId)}/promote`, {
    method: 'POST',
    body: { version, toStage, canaryMetricsOk: true, emergency: false },
  });
}

export async function rollbackModelLive(modelId: string, toVersion: string): Promise<void> {
  await httpClient(`/api/v1/models/${encodeURIComponent(modelId)}/rollback`, {
    method: 'POST',
    body: { toVersion },
  });
}

/* -------------------------------------------------------------------------- */
/* F07 Identity                                                               */
/* -------------------------------------------------------------------------- */

interface BeCandidate {
  id: string;
  leftGrId: string;
  rightGrId: string;
  confidence: number;
  status: string;
}

function mapCandidateStatus(status: string): IdentityCandidate['status'] {
  const s = status.toUpperCase();
  if (s.includes('MERGE') || s.includes('RESOLVED')) return 'mesclado';
  if (s.includes('REJECT') || s.includes('DISCARD') || s.includes('IGNORE')) return 'descartado';
  return 'pendente';
}

export async function fetchIdentityCandidatesLive(): Promise<IdentityCandidate[]> {
  const items = await httpClient<BeCandidate[]>('/api/v1/identity/candidates');
  return items.map((item) => ({
    candidateId: item.id,
    documento: item.leftGrId.slice(0, 8),
    matchScore: Number(item.confidence),
    reason: `Similaridade ${(Number(item.confidence) * 100).toFixed(0)}% entre GRs`,
    createdAt: new Date().toISOString(),
    status: mapCandidateStatus(item.status),
    left: {
      grId: item.leftGrId,
      documento: item.leftGrId,
      origem: 'golden-record',
    },
    right: {
      grId: item.rightGrId,
      documento: item.rightGrId,
      origem: 'candidato',
    },
  }));
}

export async function mergeIdentityLive(
  survivorGrId: string,
  mergedGrId: string,
  confidence: number,
  reason: string,
): Promise<void> {
  await httpClient('/api/v1/identity/merge', {
    method: 'POST',
    body: { survivorGrId, mergedGrId, confidence, reason, actorId: 'sofia-ui' },
  });
}

/* -------------------------------------------------------------------------- */
/* F04 / F05 Decisions                                                        */
/* -------------------------------------------------------------------------- */

interface BeDecision {
  decisionId: string;
  documento: string;
  score: number;
  outcome: string;
  modelVersion: string;
  sha256: string;
  createdAt: string;
  latencyMs: number;
  productCode: string | null;
}

interface BeSnapshot {
  decisionId: string;
  documento: string;
  score: number;
  modelVersion: string;
  outcome: string;
  features: Record<string, { value: unknown; eventTs: string | null; degraded: boolean }>;
  createdAt: string;
}

interface BeCreateDecision {
  decisionId: string;
  score: number;
  outcome: string;
  modelVersion: string;
  latencyMs: number;
  partial: boolean;
  degradedFlags: string[];
  explanationRef: string | null;
}

interface BeBudget {
  defaultBudgetMs: number;
  slices: { score: number; features: number; worm: number; explanation: number };
}

function mapOutcome(outcome: string): DecisionMeta['outcome'] {
  const o = outcome.toUpperCase();
  if (o.includes('APPROVE') || o.includes('APROV')) return 'aprovado';
  if (o.includes('REVIEW') || o.includes('REVIS')) return 'revisao';
  return 'recusado';
}

function toDecisionMeta(d: BeDecision): DecisionMeta {
  return {
    decisionId: d.decisionId,
    documento: d.documento,
    decidedAt: d.createdAt,
    outcome: mapOutcome(d.outcome),
    score: d.score,
    modelVersion: d.modelVersion,
    policyVersion: d.productCode ?? 'threshold-stub',
    snapshotHash: d.sha256 ? `sha256:${d.sha256.slice(0, 12)}…` : '—',
    latencyMs: d.latencyMs,
  };
}

export async function fetchDecisionCompareLive(
  leftId: string,
  rightId: string,
): Promise<{ left: DecisionMeta; right: DecisionMeta; diff: AttributeDiff[] }> {
  const [leftDec, rightDec, leftSnap, rightSnap] = await Promise.all([
    httpClient<BeDecision>(`/api/v1/decisions/${encodeURIComponent(leftId)}`),
    httpClient<BeDecision>(`/api/v1/decisions/${encodeURIComponent(rightId)}`),
    httpClient<BeSnapshot>(`/api/v1/decisions/${encodeURIComponent(leftId)}/snapshot`),
    httpClient<BeSnapshot>(`/api/v1/decisions/${encodeURIComponent(rightId)}/snapshot`),
  ]);

  const keys = new Set([
    ...Object.keys(leftSnap.features ?? {}),
    ...Object.keys(rightSnap.features ?? {}),
  ]);
  const diff: AttributeDiff[] = [...keys].map((attribute) => {
    const lv = leftSnap.features?.[attribute]?.value;
    const rv = rightSnap.features?.[attribute]?.value;
    const left = lv == null ? '—' : String(lv);
    const right = rv == null ? '—' : String(rv);
    return {
      attribute,
      left,
      right,
      changed: left !== right,
      contribution: 0,
    };
  });

  return {
    left: toDecisionMeta(leftDec),
    right: toDecisionMeta(rightDec),
    diff,
  };
}

export async function verifyDecisionLive(decisionId: string): Promise<boolean> {
  const res = await httpClient<{ integrity: boolean; chainValid: boolean }>(
    `/api/v1/decisions/${encodeURIComponent(decisionId)}/verify`,
    { method: 'POST', body: { checkChain: true } },
  );
  return res.integrity && res.chainValid;
}

export async function createDecisionLive(payload: {
  documento: string;
  productCode?: string;
}): Promise<PlaygroundResponse> {
  const [created, budget] = await Promise.all([
    httpClient<BeCreateDecision>('/api/v1/decisions', {
      method: 'POST',
      body: {
        documento: payload.documento,
        productCode: payload.productCode,
        includeExplanation: true,
      },
      headers: { 'X-Budget-Ms': '250' },
    }),
    httpClient<BeBudget>('/api/v1/decisions/budget').catch(() => ({
      defaultBudgetMs: 250,
      slices: { score: 100, features: 50, worm: 50, explanation: 50 },
    })),
  ]);

  return {
    decisionId: created.decisionId,
    score: created.score,
    outcome: mapOutcome(created.outcome),
    modelVersion: created.modelVersion,
    latency: {
      total: created.latencyMs,
      featureStore: budget.slices.features,
      model: budget.slices.score,
      policy: budget.slices.explanation,
      audit: budget.slices.worm,
    },
    reasons: created.degradedFlags.map((flag, index) => ({
      code: `D${String(index + 1).padStart(3, '0')}`,
      label: flag,
      weight: Math.round(100 / Math.max(created.degradedFlags.length, 1)),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* F06 Ingest                                                                 */
/* -------------------------------------------------------------------------- */

interface BeIngestSources {
  sources: {
    sourceId: string;
    sourceName: string;
    health: string;
    lastSuccessAt: string;
    volumeToday: number;
    expectedVolumeToday: number;
    deviationPct: number;
    pendingReplayQueue: number;
  }[];
  refreshedAt: string;
}

function mapHealth(health: string): SourceStatus {
  const h = health.toUpperCase();
  if (h.includes('DOWN') || h.includes('OFF') || h.includes('CRIT')) return 'offline';
  if (h.includes('DEGRAD') || h.includes('WARN')) return 'degradado';
  return 'online';
}

export async function fetchIngestSourcesLive(): Promise<IngestSource[]> {
  const res = await httpClient<BeIngestSources>('/api/v1/ingest/sources');
  return res.sources.map((src) => ({
    id: src.sourceId,
    name: src.sourceName,
    type: 'api' as const,
    status: mapHealth(src.health),
    lastSyncAt: src.lastSuccessAt,
    recordsToday: src.volumeToday,
    errorRatePct: Math.abs(src.deviationPct),
    slaMinutes: 30,
    owner: 'ingest',
  }));
}

export async function replayIngestLive(
  sourceId: string,
  windowStart: string,
  windowEnd: string,
  justification: string,
): Promise<void> {
  await httpClient('/api/v1/ingest/replay', {
    method: 'POST',
    body: {
      sourceId,
      windowStart: new Date(windowStart).toISOString(),
      windowEnd: new Date(windowEnd).toISOString(),
      justification,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F01 Streams                                                                */
/* -------------------------------------------------------------------------- */

interface BeStreamsHealth {
  status: string;
  mode: string;
  topic: string;
  bootstrapConfigured: boolean;
}

export async function fetchStreamHealthLive(): Promise<StreamHealthResponse> {
  const health = await httpClient<BeStreamsHealth>('/api/v1/streams/health');
  const status =
    health.status === 'UP' && health.bootstrapConfigured
      ? 'healthy'
      : health.mode === 'LOCAL_STUB'
        ? 'warning'
        : 'critical';

  return {
    updatedAt: new Date().toISOString(),
    lagThresholdSeconds: 30,
    topics: [
      {
        topic: health.topic,
        consumerGroup: 'prisma-backend',
        partitions: 1,
        lagMessages: 0,
        lagSeconds: 0,
        throughputPerMin: 0,
        status,
        schemaVersion: health.mode,
      },
    ],
    quarantine: [],
    throughputSeries: [{ label: 'now', value: health.status === 'UP' ? 1 : 0 }],
  };
}

/* -------------------------------------------------------------------------- */
/* F08 Observability                                                          */
/* -------------------------------------------------------------------------- */

interface BeSlo {
  window: string;
  clientId: string | null;
  targetP95Ms: number;
  p95Ms: number;
  p99Ms: number;
  compliance: boolean;
  errorBudgetRemainingPct: number;
}

interface BeBudgetObs {
  errorBudgetRemainingPct: number;
  burnAlert: boolean;
}

export async function fetchSloLive(): Promise<SloResponse> {
  const [slo, budget] = await Promise.all([
    httpClient<BeSlo>('/api/v1/observability/slo?window=1h'),
    httpClient<BeBudgetObs>('/api/v1/observability/budget'),
  ]);

  return {
    window: slo.window,
    latency: {
      p50: Math.round(slo.p95Ms * 0.6),
      p95: slo.p95Ms,
      p99: slo.p99Ms,
      target: slo.targetP95Ms,
    },
    availabilityPct: slo.compliance ? 99.9 : 98.5,
    errorBudget: {
      consumedPct: Math.max(0, 100 - budget.errorBudgetRemainingPct),
      remainingMinutes: Math.round(budget.errorBudgetRemainingPct),
      windowDays: 30,
    },
    series: [
      { label: 'p95', value: slo.p95Ms },
      { label: 'p99', value: slo.p99Ms },
      { label: 'meta', value: slo.targetP95Ms },
    ],
    traces: [],
  };
}

/* -------------------------------------------------------------------------- */
/* F10 Replay jobs                                                            */
/* -------------------------------------------------------------------------- */

interface BeReplayJob {
  jobId: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  targetEnv: string;
  outputUri: string | null;
  justification: string | null;
  createdAt: string;
  finishedAt: string | null;
}

function mapReplayStatus(status: string): ReplayJob['status'] {
  const s = status.toUpperCase();
  if (s.includes('ABORT')) return 'abortado';
  if (s.includes('FAIL') || s.includes('ERROR')) return 'falha';
  if (s.includes('DONE') || s.includes('COMPLET') || s.includes('SUCCESS')) return 'concluido';
  return 'executando';
}

function mapReplayJob(job: BeReplayJob): ReplayJob {
  const status = mapReplayStatus(job.status);
  return {
    jobId: job.jobId,
    window: `${job.windowStart.slice(0, 10)} → ${job.windowEnd.slice(0, 10)}`,
    status,
    progressPct: status === 'concluido' ? 100 : status === 'executando' ? 10 : 0,
    eventsProcessed: 0,
    eventsTotal: 0,
    divergences: 0,
    startedAt: job.createdAt,
    requestedBy: job.justification ?? job.targetEnv,
  };
}

/** Lab não lista jobs — mantém lista local após create; GET por id. */
export async function fetchReplayJobLive(jobId: string): Promise<ReplayJob> {
  const job = await httpClient<BeReplayJob>(`/api/v1/replay/jobs/${encodeURIComponent(jobId)}`);
  return mapReplayJob(job);
}

export async function createReplayJobLive(
  windowStart: string,
  windowEnd: string,
): Promise<ReplayJob> {
  const created = await httpClient<{ jobId: string; status: string; targetEnv: string }>(
    '/api/v1/replay/jobs',
    {
      method: 'POST',
      body: {
        windowStart: new Date(windowStart).toISOString(),
        windowEnd: new Date(windowEnd).toISOString(),
        targetEnv: 'LAB',
        justification: 'sofia-ui',
      },
    },
  );
  return fetchReplayJobLive(created.jobId);
}

export async function abortReplayJobLive(jobId: string): Promise<void> {
  await httpClient(`/api/v1/replay/jobs/${encodeURIComponent(jobId)}/abort`, {
    method: 'POST',
    body: {},
  });
}
