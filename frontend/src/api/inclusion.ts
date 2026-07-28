/**
 * API client — Inclusão & Coach (consentimento, utilities, alt-data, thin-file, coach, missões, ofertas).
 */
import { httpClient } from '@/lib/httpClient';
import type {
  Achievement,
  ConsentEvent,
  ConsentPurpose,
  DriftFeature,
  IngestBatch,
  JourneyStage,
  Mission,
  ModelCard,
  MonitoringAlert,
  Offer,
  PartnerCoverage,
  QualityDimension,
  SimulationHistoryItem,
  SimulationResult,
  UtilityLink,
  VintagePerformance,
  WeeklyGoal,
  BandPerformance,
} from '@/epics/thinfile/data';
import { THINFILE_MODEL_VERSION, coachProgress } from '@/epics/thinfile/data';

export const LAB_DOCUMENTO = '12345678901';

const CONSENT_KEY = 'prisma.inclusion.consentIds';

function rememberConsentIds(ids: string[]) {
  sessionStorage.setItem(CONSENT_KEY, JSON.stringify(ids));
}

export function lastConsentId(): string | null {
  try {
    const raw = sessionStorage.getItem(CONSENT_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return ids[0] ?? null;
  } catch {
    return null;
  }
}

function mapUtilityCategory(type: string): UtilityLink['category'] {
  const t = (type || '').toLowerCase();
  if (t.includes('agua') || t.includes('water')) return 'agua';
  if (t.includes('telecom') || t.includes('mobile')) return 'telecom';
  if (t.includes('stream')) return 'streaming';
  return 'energia';
}

function mapPartnerCategory(type: string): PartnerCoverage['category'] {
  const t = (type || '').toLowerCase();
  if (t.includes('agua')) return 'agua';
  if (t.includes('telecom')) return 'telecom';
  if (t.includes('stream')) return 'streaming';
  if (t.includes('alug') || t.includes('rent')) return 'aluguel';
  return 'energia';
}

/* -------------------------------------------------------------------------- */
/* F04 Consent                                                                */
/* -------------------------------------------------------------------------- */

export async function fetchConsentsLive(
  documento = LAB_DOCUMENTO,
): Promise<{ purposes: ConsentPurpose[]; history: ConsentEvent[] }> {
  const res = await httpClient<{
    documento: string;
    consents: {
      consentId: string;
      purposeCode: string;
      sourceCode: string;
      status: string;
    }[];
  }>(`/api/v1/consents/${encodeURIComponent(documento)}`);

  const purposes: ConsentPurpose[] = (res.consents ?? []).map((c) => {
    const active = (c.status || '').toUpperCase().includes('ACTIVE') ||
      (c.status || '').toUpperCase().includes('GRANTED') ||
      (c.status || '').toUpperCase() === 'OK';
    return {
      consentId: c.consentId,
      purpose: c.purposeCode,
      description: `Fonte ${c.sourceCode} · status ${c.status}`,
      dataUsed: [c.sourceCode],
      granted: active,
      grantedAt: active ? new Date().toISOString() : undefined,
      required: (c.purposeCode || '').toUpperCase().includes('SCORE'),
    };
  });

  rememberConsentIds(purposes.map((p) => p.consentId));

  const history: ConsentEvent[] = purposes.map((p) => ({
    at: p.grantedAt ?? new Date().toISOString(),
    action: p.granted ? 'concedido' : 'revogado',
    purpose: p.purpose,
    channel: 'api',
    ip: 'lab',
  }));

  return { purposes, history };
}

export async function grantConsentsLive(input: {
  documento?: string;
  purposes: { purposeCode: string; sourceCode: string; accepted: boolean }[];
}): Promise<void> {
  const res = await httpClient<{
    documentoHash: string;
    items: { consentId: string; purposeCode: string; sourceCode: string; status: string }[];
  }>('/api/v1/consents', {
    method: 'POST',
    body: {
      documento: input.documento ?? LAB_DOCUMENTO,
      items: input.purposes.map((p) => ({
        purposeCode: p.purposeCode,
        sourceCode: p.sourceCode,
        accepted: p.accepted,
        validTo: new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10),
      })),
      channel: 'WEB',
      versionTermo: 'v1-lab',
    },
  });
  rememberConsentIds((res.items ?? []).map((i) => i.consentId));
}

export async function revokeConsentLive(consentId: string): Promise<void> {
  await httpClient(`/api/v1/consents/${encodeURIComponent(consentId)}`, {
    method: 'DELETE',
  });
}

/* -------------------------------------------------------------------------- */
/* F08 Utility links                                                          */
/* -------------------------------------------------------------------------- */

export async function fetchUtilityLinksLive(documento = LAB_DOCUMENTO): Promise<UtilityLink[]> {
  const res = await httpClient<{
    links: {
      linkId: string;
      partnerCode: string;
      accountRef: string;
      utilityType: string;
      status: string;
    }[];
  }>(`/api/v1/utilities/links?documento=${encodeURIComponent(documento)}`);

  return (res.links ?? []).map((l) => {
    const st = (l.status || '').toUpperCase();
    let status: UtilityLink['status'] = 'validando';
    if (st.includes('CONFIRM') || st.includes('ACTIVE') || st.includes('VALID')) status = 'validado';
    else if (st.includes('FAIL') || st.includes('REJECT')) status = 'falhou';
    else if (st.includes('REVOK') || st.includes('CANCEL')) status = 'revogado';
    return {
      linkId: l.linkId,
      partner: l.partnerCode,
      category: mapUtilityCategory(l.utilityType),
      accountRef: l.accountRef,
      linkedAt: new Date().toISOString(),
      status,
      monthsHistory: status === 'validado' ? 6 : 0,
      failReason: status === 'falhou' ? l.status : undefined,
    };
  });
}

export async function linkUtilityLive(input: {
  documento?: string;
  partnerCode: string;
  accountRef: string;
  utilityType: string;
  holderName: string;
}): Promise<UtilityLink> {
  const res = await httpClient<{
    linkId: string;
    status: string;
    sourceConfirmed: boolean;
    nameMatchScore: number;
  }>('/api/v1/utilities/link', {
    method: 'POST',
    body: {
      documento: input.documento ?? LAB_DOCUMENTO,
      partnerCode: input.partnerCode,
      accountRef: input.accountRef,
      utilityType: input.utilityType,
      holderName: input.holderName,
    },
  });
  return {
    linkId: res.linkId,
    partner: input.partnerCode,
    category: mapUtilityCategory(input.utilityType),
    accountRef: input.accountRef,
    linkedAt: new Date().toISOString(),
    status: res.sourceConfirmed ? 'validado' : 'validando',
    monthsHistory: res.sourceConfirmed ? 1 : 0,
  };
}

export async function unlinkUtilityLive(linkId: string): Promise<void> {
  await httpClient(`/api/v1/utilities/links/${encodeURIComponent(linkId)}`, {
    method: 'DELETE',
  });
}

/* -------------------------------------------------------------------------- */
/* F01 Alt data coverage                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchCoverageLive(): Promise<{
  partners: PartnerCoverage[];
  quality: QualityDimension[];
  batches: IngestBatch[];
}> {
  const [coverage, quality] = await Promise.all([
    httpClient<{
      coverage: { partnerCode: string; region: string; coveredTitulares: number }[];
    }>('/api/v1/alternative-data/coverage'),
    httpClient<{
      batches: { batchId: string; partnerCode: string; status: string; errorRate: number }[];
    }>('/api/v1/alternative-data/quality'),
  ]);

  const partners: PartnerCoverage[] = (coverage.coverage ?? []).map((c) => ({
    partnerId: c.partnerCode,
    name: c.partnerCode,
    category: mapPartnerCategory(c.partnerCode),
    region: c.region || 'Nacional',
    coveragePct: Math.min(99, Math.round((c.coveredTitulares / 10_000_000) * 1000) / 10 || 40),
    records: c.coveredTitulares,
    qualityScore: 85,
    status: 'ativo',
    lastIngestAt: new Date().toISOString(),
  }));

  const batches: IngestBatch[] = (quality.batches ?? []).map((b) => {
    const st = (b.status || '').toUpperCase();
    let status: IngestBatch['status'] = 'processado';
    if (st.includes('ERR') || b.errorRate > 0.05) status = 'com_erros';
    else if (st.includes('PROC') || st.includes('RUN')) status = 'processando';
    const records = 100_000;
    const rejected = Math.round(records * (b.errorRate || 0));
    return {
      batchId: b.batchId,
      partnerId: b.partnerCode,
      receivedAt: new Date().toISOString(),
      records,
      accepted: records - rejected,
      rejected,
      status,
      rejectReason: status === 'com_erros' ? `errorRate ${(b.errorRate * 100).toFixed(1)}%` : undefined,
    };
  });

  const avgError =
    batches.length === 0
      ? 0.05
      : batches.reduce((s, b) => s + b.rejected / Math.max(b.records, 1), 0) / batches.length;

  const qualityDims: QualityDimension[] = [
    {
      dimension: 'Completude',
      score: Math.round((1 - avgError) * 100),
      target: 90,
      description: 'Derivado da taxa de erro dos lotes (lab).',
    },
    {
      dimension: 'Pontualidade',
      score: 88,
      target: 95,
      description: 'Stub lab — sem SLA de janela D+1.',
    },
    {
      dimension: 'Consistência',
      score: 92,
      target: 90,
      description: 'Stub lab.',
    },
    {
      dimension: 'Identificabilidade',
      score: 84,
      target: 85,
      description: 'Stub lab.',
    },
  ];

  return { partners, quality: qualityDims, batches };
}

export async function ingestAltDataLive(input: {
  partnerCode: string;
  utilityType: string;
  recordCount: number;
  errorRate?: number;
}): Promise<{ batchId: string }> {
  const res = await httpClient<{ batchId: string; status: string }>(
    '/api/v1/alternative-data/ingest',
    {
      method: 'POST',
      body: {
        partnerCode: input.partnerCode,
        utilityType: input.utilityType,
        sourceUri: 'lab://ingest',
        recordCount: input.recordCount,
        errorRate: input.errorRate ?? 0.01,
      },
    },
  );
  return { batchId: res.batchId };
}

/* -------------------------------------------------------------------------- */
/* F02 Thin-file model card + score                                           */
/* -------------------------------------------------------------------------- */

export async function fetchModelCardLive(): Promise<{
  card: ModelCard;
  bands: BandPerformance[];
}> {
  const res = await httpClient<{
    modelVersion: string;
    populationDesc: string;
    auc: number;
    confidenceFloor: number;
    active: boolean;
  }>('/api/v1/thinfile/model-card');

  const card: ModelCard = {
    modelId: 'thinfile-pf',
    version: res.modelVersion || THINFILE_MODEL_VERSION,
    purpose: res.populationDesc || 'Score thin-file com dados alternativos (lab).',
    publishedAt: new Date().toISOString(),
    owner: 'Squad Risco Alternativo',
    trainingWindow: 'lab',
    populationSize: 0,
    features: [],
    metrics: [
      {
        name: 'AUC',
        value: res.auc,
        unit: '',
        hint: 'Área sob a curva ROC',
      },
      {
        name: 'Confidence floor',
        value: res.confidenceFloor,
        unit: '',
        hint: 'Piso de confiança',
      },
    ],
    limitations: ['Stub lab — sem ONNX real'],
    approvedUses: ['Crédito thin-file com consentimento'],
    prohibitedUses: ['Decisão sem consentimento'],
  };

  return {
    card,
    bands: [
      {
        band: 'A',
        thinFileApproval: 72,
        traditionalApproval: 80,
        badRateThin: 4.2,
        badRateTraditional: 3.1,
        volume: 0,
      },
    ],
  };
}

export async function scoreThinfileLive(documento = LAB_DOCUMENTO): Promise<{
  scoreValue: number;
  modelVersion: string;
  thinFileFlag: boolean;
}> {
  const res = await httpClient<{
    scoreId: string;
    scoreValue: number;
    confidenceBand: string;
    thinFileFlag: boolean;
    routedToTraditional: boolean;
    modelVersion: string;
  }>('/api/v1/thinfile/score', {
    method: 'POST',
    body: { documento, traditionalHistoryCount: 0 },
  });
  return {
    scoreValue: res.scoreValue,
    modelVersion: res.modelVersion,
    thinFileFlag: res.thinFileFlag,
  };
}

/* -------------------------------------------------------------------------- */
/* F03 Coach journey                                                          */
/* -------------------------------------------------------------------------- */

export async function fetchCoachJourneyLive(documento = LAB_DOCUMENTO): Promise<{
  stages: JourneyStage[];
  goals: WeeklyGoal[];
  achievements: Achievement[];
  progress: typeof coachProgress;
}> {
  const [journey, progress, achievementsRes] = await Promise.all([
    httpClient<{
      journeyId: string;
      status: string;
      goals: { goalId: string; goalType: string; title: string; estimateText: string; status: string }[];
    }>(`/api/v1/coach/journey?documento=${encodeURIComponent(documento)}`),
    httpClient<{
      journeyId: string;
      percentComplete: number;
      goalsDone: number;
      goalsTotal: number;
    }>(`/api/v1/coach/progress?documento=${encodeURIComponent(documento)}`),
    httpClient<{
      achievements: { achievementId: string; code: string; title: string }[];
    }>(`/api/v1/missions/achievements?documento=${encodeURIComponent(documento)}`).catch(() => ({
      achievements: [] as { achievementId: string; code: string; title: string }[],
    })),
  ]);

  const goals: WeeklyGoal[] = (journey.goals ?? []).map((g) => {
    const st = (g.status || '').toUpperCase();
    const done = st.includes('DONE') || st.includes('COMPLET');
    return {
      goalId: g.goalId,
      title: g.title,
      description: g.estimateText || g.goalType,
      progress: done ? 1 : 0,
      target: 1,
      unit: 'meta',
      points: 50,
      dueAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
      done,
    };
  });

  const stages: JourneyStage[] = [
    {
      id: 'st-1',
      title: 'Jornada iniciada',
      description: `Status ${journey.status}`,
      status: 'concluida',
      points: 50,
      scoreImpact: 'lab',
    },
    {
      id: journey.journeyId || 'st-2',
      title: 'Metas ativas',
      description: `${progress.goalsDone}/${progress.goalsTotal} · ${progress.percentComplete}%`,
      status: progress.percentComplete >= 100 ? 'concluida' : 'atual',
      points: 100,
      scoreImpact: 'lab',
    },
  ];

  const achievements: Achievement[] = (achievementsRes.achievements ?? []).map((a) => ({
    achievementId: a.achievementId,
    title: a.title,
    description: a.code,
    unlockedAt: new Date().toISOString(),
    rarity: 'comum' as const,
  }));

  const progressVm = {
    ...coachProgress,
    points: Math.round(progress.percentComplete * 15),
    level: Math.max(1, Math.ceil(progress.percentComplete / 25)),
  };

  return { stages, goals, achievements, progress: progressVm };
}

/* -------------------------------------------------------------------------- */
/* F05 Missions                                                               */
/* -------------------------------------------------------------------------- */

export async function fetchMissionsLive(documento = LAB_DOCUMENTO): Promise<{
  missions: Mission[];
  achievements: Achievement[];
}> {
  const [missionsRes, achievementsRes] = await Promise.all([
    httpClient<{
      missions: { missionId: string; code: string; title: string; status: string; progressPct: number }[];
    }>(`/api/v1/missions?documento=${encodeURIComponent(documento)}`),
    httpClient<{
      achievements: { achievementId: string; code: string; title: string }[];
    }>(`/api/v1/missions/achievements?documento=${encodeURIComponent(documento)}`),
  ]);

  const missions: Mission[] = (missionsRes.missions ?? []).map((m) => {
    const st = (m.status || '').toUpperCase();
    let status: Mission['status'] = 'disponivel';
    if (st.includes('DONE') || st.includes('COMPLET')) status = 'concluida';
    else if (st.includes('PROGRESS') || st.includes('ACTIVE')) status = 'em_andamento';
    else if (st.includes('BLOCK') || st.includes('LOCK')) status = 'bloqueada';
    const pct = Math.min(100, Math.max(0, m.progressPct || 0));
    return {
      missionId: m.missionId,
      title: m.title,
      description: m.code,
      category: 'habito',
      difficulty: 'media',
      points: 100,
      progress: pct,
      target: 100,
      unit: '%',
      status,
      estimatedImpact: 'lab',
    };
  });

  const achievements: Achievement[] = (achievementsRes.achievements ?? []).map((a) => ({
    achievementId: a.achievementId,
    title: a.title,
    description: a.code,
    unlockedAt: new Date().toISOString(),
    rarity: 'comum' as const,
  }));

  return { missions, achievements };
}

export async function progressMissionLive(input: {
  missionId: string;
  documento?: string;
  deltaPct: number;
}): Promise<void> {
  await httpClient(`/api/v1/missions/${encodeURIComponent(input.missionId)}/progress`, {
    method: 'POST',
    body: {
      documento: input.documento ?? LAB_DOCUMENTO,
      verifiedEventType: 'LAB',
      verifiedEventId: `evt-${Date.now()}`,
      deltaPct: input.deltaPct,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F06 Simulator                                                              */
/* -------------------------------------------------------------------------- */

export async function simulateCoachLive(input: {
  documento?: string;
  actionCode: string;
}): Promise<SimulationResult> {
  const res = await httpClient<{
    simulationId: string;
    estimable: boolean;
    scoreDeltaMin: number;
    scoreDeltaMax: number;
    effectDaysMin: number;
    effectDaysMax: number;
    message: string;
  }>('/api/v1/coach/simulate', {
    method: 'POST',
    body: {
      documento: input.documento ?? LAB_DOCUMENTO,
      actionCode: input.actionCode,
      snapshotScoreId: 'lab-snapshot',
    },
  });
  const base = coachProgress.scoreNow;
  return {
    scoreNow: base,
    estimateMin: Math.min(1000, base + (res.scoreDeltaMin || 0)),
    estimateMax: Math.min(1000, base + (res.scoreDeltaMax || 0)),
    confidence: res.estimable ? 'alta' : 'baixa',
    horizonDays: res.effectDaysMax || 90,
    drivers: [{ label: input.actionCode, contribution: 100 }],
    caveat: res.message || 'Estimativa lab stub.',
  };
}

export async function fetchSimulationHistoryLive(
  documento = LAB_DOCUMENTO,
): Promise<SimulationHistoryItem[]> {
  const res = await httpClient<{
    simulations: {
      simulationId: string;
      actionCode: string;
      estimable: boolean;
      message: string;
    }[];
  }>(`/api/v1/coach/simulations/history?documento=${encodeURIComponent(documento)}`);

  return (res.simulations ?? []).map((s) => ({
    simulationId: s.simulationId,
    at: new Date().toISOString(),
    action: s.actionCode,
    estimateMin: coachProgress.scoreNow,
    estimateMax: coachProgress.scoreNow + (s.estimable ? 40 : 0),
    applied: false,
  }));
}

/* -------------------------------------------------------------------------- */
/* F07 Marketplace                                                            */
/* -------------------------------------------------------------------------- */

export async function fetchOffersLive(documento = LAB_DOCUMENTO): Promise<{
  offers: Offer[];
  achievements: Achievement[];
}> {
  const [offersRes, eligibility, achievementsRes] = await Promise.all([
    httpClient<{
      offers: {
        offerId: string;
        partnerCode: string;
        title: string;
        productType: string;
        explanation: string;
      }[];
    }>(`/api/v1/marketplace/offers?documento=${encodeURIComponent(documento)}`),
    httpClient<{
      eligible: boolean;
      criteria: { code: string; met: boolean; detail: string }[];
    }>(`/api/v1/marketplace/eligibility?documento=${encodeURIComponent(documento)}`),
    httpClient<{
      achievements: { achievementId: string; code: string; title: string }[];
    }>(`/api/v1/missions/achievements?documento=${encodeURIComponent(documento)}`).catch(() => ({
      achievements: [] as { achievementId: string; code: string; title: string }[],
    })),
  ]);

  const offers: Offer[] = (offersRes.offers ?? []).map((o) => {
    const t = (o.productType || '').toLowerCase();
    let category: Offer['category'] = 'emprestimo';
    if (t.includes('card') || t.includes('cart')) category = 'cartao';
    else if (t.includes('conta') || t.includes('account')) category = 'conta';
    else if (t.includes('segur') || t.includes('insur')) category = 'seguro';
    return {
      offerId: o.offerId,
      partner: o.partnerCode,
      product: o.title,
      category,
      highlight: o.explanation,
      amountLabel: '—',
      rateLabel: '—',
      eligible: eligibility.eligible,
      eligibilityScore: eligibility.eligible ? 70 : 30,
      reasons: (eligibility.criteria ?? []).map((c) => ({
        label: c.detail || c.code,
        positive: c.met,
      })),
      requirements: [],
      ctaLabel: eligibility.eligible ? 'Solicitar' : 'Ver como me qualificar',
    };
  });

  const achievements: Achievement[] = (achievementsRes.achievements ?? []).map((a) => ({
    achievementId: a.achievementId,
    title: a.title,
    description: a.code,
    unlockedAt: new Date().toISOString(),
    rarity: 'comum' as const,
  }));

  return { offers, achievements };
}

export async function applyOfferLive(input: {
  offerId: string;
  documento?: string;
  consentId?: string;
}): Promise<{ referralId: string }> {
  const consentId = input.consentId || lastConsentId() || '00000000-0000-0000-0000-000000000001';
  const res = await httpClient<{ referralId: string; status: string }>(
    `/api/v1/marketplace/offers/${encodeURIComponent(input.offerId)}/apply`,
    {
      method: 'POST',
      body: {
        documento: input.documento ?? LAB_DOCUMENTO,
        consentId,
      },
    },
  );
  return { referralId: res.referralId };
}

/* -------------------------------------------------------------------------- */
/* F09 Drift / monitoring                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchDriftLive(): Promise<{
  features: DriftFeature[];
  vintages: VintagePerformance[];
  alerts: MonitoringAlert[];
  thresholds: {
    modelVersion: string;
    psiWarning: number;
    psiCritical: number;
    ksFloor: number;
    retrainTrigger: string;
    lastEvaluationAt: string;
  };
}> {
  const [drift, monitoring] = await Promise.all([
    httpClient<{
      metrics: {
        featureName: string;
        psi: number;
        severity: string;
        vulnerableSegment: string;
      }[];
    }>('/api/v1/thinfile/drift'),
    httpClient<{
      runs: {
        runId: string;
        modelVersion: string;
        status: string;
        aucCurrent: number;
        degradationPct: number;
      }[];
    }>('/api/v1/thinfile/monitoring'),
  ]);

  const features: DriftFeature[] = (drift.metrics ?? []).map((m) => {
    const sev = (m.severity || '').toUpperCase();
    let status: DriftFeature['status'] = 'estavel';
    if (sev.includes('CRIT') || sev.includes('HIGH') || m.psi >= 0.25) status = 'deriva';
    else if (sev.includes('WARN') || sev.includes('MED') || m.psi >= 0.1) status = 'atencao';
    return {
      feature: m.featureName,
      psi: m.psi,
      threshold: 0.1,
      status,
      note: m.vulnerableSegment || m.severity,
    };
  });

  const vintages: VintagePerformance[] = (monitoring.runs ?? []).map((r, i) => ({
    vintage: `run-${i + 1}`,
    ks: 40,
    auc: r.aucCurrent,
    badRate: Math.max(0, r.degradationPct),
    volume: 0,
  }));

  const alerts: MonitoringAlert[] = (monitoring.runs ?? [])
    .filter((r) => r.degradationPct > 5)
    .map((r) => ({
      alertId: r.runId,
      at: new Date().toISOString(),
      severity: r.degradationPct > 15 ? 'alta' : 'media',
      title: `Degradação ${r.degradationPct.toFixed(1)}% · ${r.modelVersion}`,
      detail: `Status ${r.status}`,
      status: 'aberto' as const,
    }));

  const last = monitoring.runs?.[0];
  return {
    features,
    vintages,
    alerts,
    thresholds: {
      modelVersion: last?.modelVersion || THINFILE_MODEL_VERSION,
      psiWarning: 0.1,
      psiCritical: 0.25,
      ksFloor: 35,
      retrainTrigger: 'PSI crítico ou degradação AUC',
      lastEvaluationAt: new Date().toISOString(),
    },
  };
}

export async function evaluateMonitoringLive(modelVersion?: string): Promise<void> {
  await httpClient('/api/v1/thinfile/monitoring/evaluate', {
    method: 'POST',
    body: {
      modelVersion: modelVersion || THINFILE_MODEL_VERSION,
      aucCurrent: 0.78,
    },
  });
}
