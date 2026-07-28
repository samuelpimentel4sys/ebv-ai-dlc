/**
 * API client — Explicabilidade & Compliance
 * (explain, contrafactual, dossiê, auditoria, motivos, revisão, fairness, direitos, política).
 */
import { httpClient, HttpError } from '@/lib/httpClient';
import type {
  AuditEvent,
  CounterfactualAction,
  DecisionFactor,
  DossierRecord,
  ExplainResponse,
  FairnessAlert,
  FairnessMetric,
  PolicyDiffLine,
  PolicySimulation,
  PolicyVersion,
  ReasonCode,
  ReviewItem,
  SubjectRequest,
} from '@/epics/explicabilidade/data';

const DECISION_IDS_KEY = 'prisma.decisionIds';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function lastDecisionId(): string | null {
  try {
    const raw = sessionStorage.getItem(DECISION_IDS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return ids.find((id) => isUuid(id)) ?? null;
  } catch {
    return null;
  }
}

/** Em live, usa UUID da rota ou o último decisionId do Playground. */
export function resolveLiveDecisionId(param?: string): string {
  if (param && isUuid(param)) return param;
  const last = lastDecisionId();
  if (last) return last;
  throw new HttpError({
    status: 404,
    error: 'DecisionNotFound',
    message:
      'Sem decisionId UUID. Emita uma decisão no Playground (API live) e abra fatores/ações com esse id.',
    path: '/api/v1/explain',
    correlationId: 'local',
  });
}

function maskDocumento(doc: string | null | undefined): string {
  if (!doc) return '—';
  const digits = doc.replace(/\D/g, '');
  if (digits.length < 5) return doc;
  return `${digits.slice(0, 3)}.***.**${digits.slice(-2)}`;
}

interface PageBody<T> {
  items: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/* -------------------------------------------------------------------------- */
/* F05 Reasons                                                                */
/* -------------------------------------------------------------------------- */

interface BeReasonItem {
  reason_version_id: string;
  code: string;
  version: number;
  status: string;
  consumer_text: string;
  analyst_text: string;
  channels: string[];
  legal_approval: boolean;
  created_at: string;
}

function mapReasonStatus(status: string): ReasonCode['status'] {
  const s = status.toUpperCase();
  if (s.includes('APPROV') || s === 'PUBLISHED') return 'publicado';
  if (s.includes('LEGAL') || s.includes('PENDING') || s.includes('REVIEW')) return 'aprovacao';
  return 'rascunho';
}

function mapReason(item: BeReasonItem): ReasonCode {
  return {
    code: item.code,
    technicalLabel: item.analyst_text || item.code,
    titularLabel: item.consumer_text,
    category: (item.channels ?? []).join(', ') || 'Geral',
    status: mapReasonStatus(item.status),
    readability: item.legal_approval ? 72 : 58,
    lastUpdatedAt: item.created_at,
    owner: 'compliance',
  };
}

export async function fetchReasonsLive(): Promise<ReasonCode[]> {
  const res = await httpClient<PageBody<BeReasonItem>>('/api/v1/reasons?size=50');
  return (res.items ?? []).map(mapReason);
}

export async function createReasonLive(input: {
  code: string;
  consumerText: string;
  analystText: string;
}): Promise<void> {
  await httpClient('/api/v1/reasons', {
    method: 'POST',
    body: {
      code: input.code,
      consumer_text: input.consumerText,
      analyst_text: input.analystText,
      channels: ['PORTAL', 'API'],
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F10 Policy versions                                                        */
/* -------------------------------------------------------------------------- */

interface BePolicyVersion {
  policy_version_id: string;
  version: string;
  status: string;
  artifact_hash: string;
  author: string;
  approval_id: string | null;
  effective_at: string | null;
  created_at: string;
  published_at: string | null;
  immutable: boolean;
}

interface BePolicyDiff {
  from_version_id: string;
  to_version_id: string;
  from_version: string;
  to_version: string;
  changes: {
    path: string;
    from_value: unknown;
    to_value: unknown;
    change_type: string;
    business_effect: string;
  }[];
  business_effects: string[];
}

function mapPolicyStatus(status: string, publishedAt: string | null): PolicyVersion['status'] {
  const s = status.toUpperCase();
  if (s === 'PUBLISHED' || s === 'ACTIVE') return publishedAt ? 'ativa' : 'aprovada';
  if (s === 'DRAFT') return 'rascunho';
  return 'arquivada';
}

function mapPolicy(item: BePolicyVersion): PolicyVersion & { artifactHash: string; approvalId: string | null } {
  return {
    id: item.policy_version_id,
    version: String(item.version),
    status: mapPolicyStatus(item.status, item.published_at),
    createdAt: item.created_at,
    author: item.author || '—',
    approvalRatePct: 0,
    changes: 0,
    artifactHash: item.artifact_hash,
    approvalId: item.approval_id,
  };
}

export async function fetchPolicyVersionsLive(): Promise<
  (PolicyVersion & { artifactHash: string; approvalId: string | null })[]
> {
  const res = await httpClient<PageBody<BePolicyVersion>>('/api/v1/policy/versions?size=50');
  const mapped = (res.items ?? []).map(mapPolicy);
  // Garante um único "ativa": o PUBLISHED mais recente.
  const published = mapped
    .filter((v) => v.status === 'ativa' || v.status === 'aprovada')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return mapped.map((v) => {
    if (published[0] && v.id === published[0].id) return { ...v, status: 'ativa' as const };
    if (v.status === 'ativa' && published[0] && v.id !== published[0].id) {
      return { ...v, status: 'arquivada' as const };
    }
    return v;
  });
}

export async function fetchPolicyDiffLive(a: string, b: string): Promise<PolicyDiffLine[]> {
  const res = await httpClient<BePolicyDiff>(
    `/api/v1/policy/versions/${encodeURIComponent(a)}/diff/${encodeURIComponent(b)}`,
  );
  const lines: PolicyDiffLine[] = [];
  for (const change of res.changes ?? []) {
    if (change.from_value != null) {
      lines.push({
        kind: 'removed',
        text: `${change.path}: ${String(change.from_value)}`,
        businessMeaning: change.business_effect,
      });
    }
    if (change.to_value != null) {
      lines.push({
        kind: 'added',
        text: `${change.path}: ${String(change.to_value)}`,
        businessMeaning: change.business_effect,
      });
    }
    if (change.from_value == null && change.to_value == null) {
      lines.push({ kind: 'context', text: change.path, businessMeaning: change.business_effect });
    }
  }
  return lines.length ? lines : [{ kind: 'context', text: 'Sem diferenças no recorte lab.' }];
}

export async function publishPolicyLive(input: {
  id: string;
  artifactHash: string;
  approvalId?: string | null;
}): Promise<void> {
  await httpClient(`/api/v1/policy/versions/${encodeURIComponent(input.id)}/publish`, {
    method: 'POST',
    body: {
      approval_id: input.approvalId || `lab-approval-${Date.now()}`,
      effective_at: new Date().toISOString(),
      release_note: 'Promoção via Prisma Equifax (lab)',
      expected_draft_hash: input.artifactHash,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F01 Explain                                                                */
/* -------------------------------------------------------------------------- */

interface BeFactor {
  attribute_code: string;
  business_label?: string;
  value: unknown;
  shap_value: number;
  direction: string;
}

interface BeExplain {
  decision_id: string;
  model_version: string;
  policy_version: string;
  base_value: number;
  score: number;
  snapshot_hash: string;
  factors: BeFactor[];
  generated_at: string;
}

function mapFactor(f: BeFactor): DecisionFactor {
  const shap = Number(f.shap_value) || 0;
  const dir = (f.direction || '').toUpperCase();
  const positive = dir.includes('POS') || (!dir.includes('NEG') && shap > 0);
  return {
    attribute: f.attribute_code,
    label: f.business_label || f.attribute_code,
    contribution: Math.round(shap),
    value: f.value == null ? '—' : String(f.value),
    direction: positive ? 'positivo' : 'negativo',
    populationAverage: '—',
    explanation: `Contribuição SHAP ${shap >= 0 ? '+' : ''}${shap} (${f.direction}).`,
  };
}

function mapOutcomeFromScore(score: number): ExplainResponse['outcome'] {
  if (score >= 620) return 'aprovado';
  if (score >= 500) return 'revisao';
  return 'recusado';
}

export async function fetchExplainLive(decisionId: string): Promise<ExplainResponse> {
  const id = resolveLiveDecisionId(decisionId);
  const res = await httpClient<BeExplain>(
    `/api/v1/explain/${encodeURIComponent(id)}?includeLabels=true`,
  );
  return {
    decisionId: res.decision_id,
    documento: '—',
    outcome: mapOutcomeFromScore(res.score),
    score: res.score,
    modelVersion: res.model_version,
    policyVersion: res.policy_version,
    decidedAt: res.generated_at,
    baseValue: res.base_value,
    factors: (res.factors ?? []).map(mapFactor),
  };
}

/* -------------------------------------------------------------------------- */
/* F02 Counterfactual                                                         */
/* -------------------------------------------------------------------------- */

interface BeCounterfactual {
  decision_id: string;
  viable: boolean;
  estimated_score_range: number[] | { min?: number; max?: number } | null;
  actions: {
    attribute_code: string;
    from_value: unknown;
    to_value: unknown;
    effort: string;
    reason_code: string;
    action_text: string;
    effort_rank?: string;
    typical_effect_days: number;
  }[];
  disclaimer_version: string;
  failure_reason?: string;
}

function mapFeasibility(effort: string): CounterfactualAction['feasibility'] {
  const e = (effort || '').toUpperCase();
  if (e.includes('HIGH') || e.includes('HARD') || e.includes('DIFIC')) return 'baixa';
  if (e.includes('LOW') || e.includes('FACIL') || e.includes('BAIX') || e === '1') return 'alta';
  return 'media';
}

export async function fetchCounterfactualLive(
  decisionId: string,
): Promise<{ decision: ExplainResponse; actions: CounterfactualAction[] }> {
  const id = resolveLiveDecisionId(decisionId);
  const [decision, cf] = await Promise.all([
    fetchExplainLive(id),
    httpClient<BeCounterfactual>(`/api/v1/counterfactual/${encodeURIComponent(id)}?max_actions=5`),
  ]);
  const range = cf.estimated_score_range;
  let gainMin = 10;
  let gainMax = 40;
  if (Array.isArray(range) && range.length >= 2) {
    gainMin = Math.max(0, Math.round(range[0] - decision.score));
    gainMax = Math.max(gainMin, Math.round(range[1] - decision.score));
  } else if (range && typeof range === 'object') {
    const min = Number((range as { min?: number }).min ?? decision.score);
    const max = Number((range as { max?: number }).max ?? decision.score + 40);
    gainMin = Math.max(0, Math.round(min - decision.score));
    gainMax = Math.max(gainMin, Math.round(max - decision.score));
  }

  const actions: CounterfactualAction[] = (cf.actions ?? []).map((a, index) => ({
    id: `cf-${a.attribute_code}-${index}`,
    action: a.action_text || `Ajustar ${a.attribute_code}`,
    attribute: a.attribute_code,
    currentValue: a.from_value == null ? '—' : String(a.from_value),
    targetValue: a.to_value == null ? '—' : String(a.to_value),
    scoreGainMin: Math.max(1, Math.round(gainMin / Math.max(cf.actions.length, 1))),
    scoreGainMax: Math.max(2, Math.round(gainMax / Math.max(cf.actions.length, 1))),
    effortDays: a.typical_effect_days || 30,
    feasibility: mapFeasibility(a.effort || a.effort_rank || 'MEDIUM'),
    guidance: a.reason_code ? `Motivo associado: ${a.reason_code}.` : cf.disclaimer_version,
  }));

  return { decision, actions };
}

export async function simulateCounterfactualLive(
  decisionId: string,
  changes: { attribute_code: string; proposed_value: string }[],
): Promise<{ estimatedScore: number; wouldApprove: boolean }> {
  const id = resolveLiveDecisionId(decisionId);
  const res = await httpClient<{
    estimated_score: number;
    would_approve: boolean;
  }>('/api/v1/counterfactual/simulate', {
    method: 'POST',
    body: { decision_id: id, changes, target_band: 'A' },
  });
  return { estimatedScore: res.estimated_score, wouldApprove: res.would_approve };
}

/* -------------------------------------------------------------------------- */
/* F06 Reviews                                                                */
/* -------------------------------------------------------------------------- */

interface BeReviewItem {
  review_id: string;
  decision_id: string;
  subject_token: string;
  reason: string;
  channel: string;
  status: string;
  assignee: string | null;
  due_at: string;
  created_at: string;
}

function mapReviewStatus(status: string): ReviewItem['status'] {
  const s = status.toUpperCase();
  if (s.includes('DECID') || s === 'CLOSED') return 'decidido';
  if (s.includes('REVIEW') || s.includes('IN_')) return 'em_analise';
  return 'pendente';
}

function mapChannel(channel: string): ReviewItem['channel'] {
  const c = (channel || '').toLowerCase();
  if (c.includes('sac')) return 'sac';
  if (c.includes('b2b') || c.includes('api')) return 'b2b';
  return 'portal';
}

function mapReview(item: BeReviewItem): ReviewItem {
  const due = new Date(item.due_at).getTime();
  const created = new Date(item.created_at).getTime();
  const urgent = due - Date.now() < 2 * 24 * 3600_000;
  return {
    reviewId: item.review_id,
    decisionId: item.decision_id,
    documento: maskDocumento(item.subject_token),
    requestedAt: item.created_at,
    slaDueAt: item.due_at,
    channel: mapChannel(item.channel),
    priority: urgent ? 'alta' : due - created < 10 * 24 * 3600_000 ? 'media' : 'baixa',
    status: mapReviewStatus(item.status),
    score: 0,
    reasonCodes: [],
    claim: item.reason || 'Sem alegação registrada.',
  };
}

export async function fetchReviewQueueLive(): Promise<ReviewItem[]> {
  const res = await httpClient<PageBody<BeReviewItem>>('/api/v1/reviews/queue?size=50');
  return (res.items ?? []).map(mapReview);
}

export async function decideReviewLive(input: {
  reviewId: string;
  outcome: 'manter' | 'reverter';
  rationale: string;
}): Promise<void> {
  await httpClient(`/api/v1/reviews/${encodeURIComponent(input.reviewId)}/decide`, {
    method: 'PATCH',
    body: {
      outcome: input.outcome === 'reverter' ? 'REFORM' : 'MAINTAIN',
      rationale: input.rationale,
      reviewed_factors: [],
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F08 Subject requests                                                       */
/* -------------------------------------------------------------------------- */

interface BeSubjectRequest {
  request_id: string;
  right_type: string;
  subject_token: string;
  channel: string;
  description: string;
  status: string;
  due_at: string;
  response_summary: string | null;
  created_at: string;
  updated_at: string;
}

function mapRightType(type: string): SubjectRequest['type'] {
  const t = type.toUpperCase();
  if (t.includes('DELET') || t.includes('ERASURE') || t.includes('ELIM')) return 'eliminacao';
  if (t.includes('PORT')) return 'portabilidade';
  if (t.includes('RECTIF') || t.includes('CORREC')) return 'correcao';
  if (t.includes('REVIEW') || t.includes('REVIS')) return 'revisao';
  return 'acesso';
}

function mapSubjectStatus(status: string): SubjectRequest['status'] {
  const s = status.toUpperCase();
  if (s.includes('DONE') || s.includes('CLOSED') || s.includes('COMPLET')) return 'concluida';
  if (s.includes('REJECT') || s.includes('DENY')) return 'recusada';
  if (s.includes('IDENT') || s.includes('PENDING')) return 'aguardando_identidade';
  return 'em_tratativa';
}

function mapSubjectChannel(channel: string): SubjectRequest['channel'] {
  const c = (channel || '').toLowerCase();
  if (c.includes('mail') || c.includes('email')) return 'email';
  if (c.includes('sac')) return 'sac';
  return 'portal';
}

function mapSubject(item: BeSubjectRequest): SubjectRequest {
  return {
    requestId: item.request_id,
    documento: maskDocumento(item.subject_token),
    type: mapRightType(item.right_type),
    openedAt: item.created_at,
    dueAt: item.due_at,
    status: mapSubjectStatus(item.status),
    channel: mapSubjectChannel(item.channel),
    identityVerified: !mapSubjectStatus(item.status).includes('identidade'),
    history: [
      {
        at: item.created_at,
        actor: 'sistema',
        note: item.description || `Solicitação ${item.right_type}`,
      },
      ...(item.response_summary
        ? [{ at: item.updated_at, actor: 'operador', note: item.response_summary }]
        : []),
    ],
  };
}

export async function fetchSubjectRequestsLive(): Promise<SubjectRequest[]> {
  const res = await httpClient<PageBody<BeSubjectRequest>>('/api/v1/subject-requests?size=50');
  return (res.items ?? []).map(mapSubject);
}

export async function patchSubjectRequestLive(input: {
  requestId: string;
  action: string;
  responseSummary: string;
}): Promise<void> {
  await httpClient(`/api/v1/subject-requests/${encodeURIComponent(input.requestId)}`, {
    method: 'PATCH',
    body: {
      action: input.action,
      response_summary: input.responseSummary,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F04 Audit                                                                  */
/* -------------------------------------------------------------------------- */

interface BeAuditEvent {
  event_id: string;
  documento: string | null;
  actor_id: string;
  event_type: string;
  sha256: string;
  prev_sha256: string | null;
  created_at: string;
}

function mapActorType(actorId: string): AuditEvent['actorType'] {
  const a = (actorId || '').toLowerCase();
  if (a.includes('api') || a.includes('b2b') || a.includes('partner')) return 'cliente-b2b';
  if (a.includes('system') || a.includes('engine') || a.includes('writer') || a.includes('policy')) {
    return 'sistema';
  }
  return 'humano';
}

export async function fetchAuditTrailLive(documento?: string): Promise<AuditEvent[]> {
  const qs = new URLSearchParams({ size: '50' });
  if (documento?.trim()) qs.set('documento', documento.trim());
  const res = await httpClient<PageBody<BeAuditEvent>>(`/api/v1/audit/trail?${qs.toString()}`);
  return (res.items ?? []).map((item) => ({
    eventId: item.event_id,
    occurredAt: item.created_at,
    actor: item.actor_id || 'sistema',
    actorType: mapActorType(item.actor_id),
    action: item.event_type,
    entity: item.event_id,
    documento: item.documento ? maskDocumento(item.documento) : undefined,
    hash: item.sha256?.startsWith('sha256:') ? item.sha256 : `sha256:${item.sha256?.slice(0, 12) ?? '…'}`,
  }));
}

export async function exportAuditLive(purpose: string): Promise<{ exportId: string }> {
  const res = await httpClient<{ export_id: string }>('/api/v1/audit/export', {
    method: 'POST',
    body: { filters: {}, format: 'JSON', purpose },
  });
  return { exportId: res.export_id };
}

/* -------------------------------------------------------------------------- */
/* F03 Dossier                                                                */
/* -------------------------------------------------------------------------- */

interface BeDossier {
  dossier_id: string;
  decision_id: string;
  status: string;
  purpose?: string;
  legal_basis?: string;
  snapshot_hash: string;
  document_hash: string;
  formats: string[];
  issued_at: string;
  duration_ms?: number;
}

function mapDossierStatus(status: string): DossierRecord['status'] {
  const s = status.toUpperCase();
  if (s.includes('READY') || s.includes('DONE') || s.includes('ISSUED') || s === 'AVAILABLE') {
    return 'disponivel';
  }
  if (s.includes('EXPIR')) return 'expirado';
  return 'gerando';
}

export async function issueDossierLive(input: {
  decisionId: string;
  format: 'PDF' | 'JSON';
}): Promise<DossierRecord> {
  const decisionId = resolveLiveDecisionId(input.decisionId);
  const res = await httpClient<BeDossier>('/api/v1/dossier', {
    method: 'POST',
    body: {
      decision_id: decisionId,
      purpose: 'LGPD_ART20',
      legal_basis: 'LGPD_Art_20',
      formats: [input.format],
    },
  });
  const expires = new Date(res.issued_at);
  expires.setDate(expires.getDate() + 30);
  return {
    dossierId: res.dossier_id,
    documento: '—',
    decisionId: res.decision_id,
    requestedAt: res.issued_at,
    status: mapDossierStatus(res.status),
    format: (res.formats?.[0]?.toUpperCase() === 'JSON' ? 'JSON' : 'PDF') as 'PDF' | 'JSON',
    sizeKb: Math.max(1, Math.round((res.duration_ms ?? 800) / 10)),
    requestedBy: 'operador.lab',
    expiresAt: expires.toISOString(),
  };
}

export async function downloadDossierLive(dossierId: string, format: string): Promise<Blob> {
  const path = `/api/v1/dossier/${encodeURIComponent(dossierId)}/download?format=${encodeURIComponent(format)}`;
  const correlationId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `prisma-${Math.random().toString(16).slice(2)}`;
  const response = await fetch(path, {
    headers: { 'X-Correlation-ID': correlationId },
  });
  if (!response.ok) {
    throw new HttpError({
      status: response.status,
      error: 'DownloadFailed',
      message: `Falha no download do dossiê (${response.status})`,
      path,
      correlationId,
    });
  }
  return response.blob();
}

/* -------------------------------------------------------------------------- */
/* F09 Policy simulate                                                        */
/* -------------------------------------------------------------------------- */

interface BeBaseline {
  baseline_version: string;
  status: string;
  portfolio: string | null;
  as_of_date: string;
  artifact_hash: string;
  stub: boolean;
}

interface BeSimulation {
  simulation_id: string;
  status: string;
  sample_ref: string;
  baseline_version: string;
  candidate_policy: unknown;
  metrics: unknown;
  result: {
    approve_rate?: number;
    baseline_approve_rate?: number;
    expected_loss?: number;
    baseline_expected_loss?: number;
    revenue?: number;
    baseline_revenue?: number;
    segments?: { segment: string; delta_approval_pp?: number; deltaApprovalPp?: number }[];
  } | null;
  created_at: string;
  finished_at: string | null;
}

export async function fetchPolicyBaselineLive(): Promise<string> {
  const res = await httpClient<BeBaseline>('/api/v1/policy/baseline');
  return res.baseline_version || 'POL-LAB-BASELINE';
}

export async function simulatePolicyLive(rule: string): Promise<PolicySimulation> {
  const created = await httpClient<{ simulation_id: string }>('/api/v1/policy/simulate', {
    method: 'POST',
    body: {
      candidate_policy: { rules_text: rule },
      sample_ref: 'lab-sample-30d',
      metrics: ['approve_rate', 'expected_loss', 'revenue'],
    },
  });
  const res = await httpClient<BeSimulation>(
    `/api/v1/policy/simulations/${encodeURIComponent(created.simulation_id)}`,
  );
  const result = res.result ?? {};
  const baselineRate = Number(result.baseline_approve_rate ?? 0.624) * (result.baseline_approve_rate && result.baseline_approve_rate <= 1 ? 100 : 1);
  const candidateRate = Number(result.approve_rate ?? 0.561) * (result.approve_rate && result.approve_rate <= 1 ? 100 : 1);
  const baselineLoss = Number(result.baseline_expected_loss ?? 3.8);
  const candidateLoss = Number(result.expected_loss ?? 3.1);
  const baselineRevenue = Number(result.baseline_revenue ?? 18.4);
  const candidateRevenue = Number(result.revenue ?? 17.2);
  const segments = (result.segments ?? []).map((s) => ({
    segment: s.segment,
    deltaApprovalPp: Number(s.delta_approval_pp ?? s.deltaApprovalPp ?? 0),
  }));

  return {
    simulationId: res.simulation_id,
    rule,
    baseline: {
      approvalRatePct: baselineRate <= 1 ? baselineRate * 100 : baselineRate,
      expectedLossPct: baselineLoss <= 1 ? baselineLoss * 100 : baselineLoss,
      volume: 412_000,
      revenue: baselineRevenue,
    },
    candidate: {
      approvalRatePct: candidateRate <= 1 ? candidateRate * 100 : candidateRate,
      expectedLossPct: candidateLoss <= 1 ? candidateLoss * 100 : candidateLoss,
      volume: 412_000,
      revenue: candidateRevenue,
    },
    affectedSegments: segments.length
      ? segments
      : [
          { segment: 'Thin-file', deltaApprovalPp: -4.2 },
          { segment: 'Faixa 18–24', deltaApprovalPp: -2.1 },
        ],
  };
}

/* -------------------------------------------------------------------------- */
/* F07 Fairness                                                               */
/* -------------------------------------------------------------------------- */

interface BeFairnessMetric {
  metric_id: string;
  run_id: string | null;
  model_version: string;
  metric_name: string;
  segment_name: string;
  group_code: string;
  metric_value: number;
  approved_limit: number;
  exceeded: boolean;
  created_at: string;
}

interface BeFairnessAlert {
  alert_id: string;
  metric_id: string | null;
  model_version: string;
  severity: string;
  status: string;
  message: string;
  opened_at: string;
}

function mapSeverity(severity: string): FairnessAlert['severity'] {
  const s = severity.toUpperCase();
  if (s.includes('CRIT')) return 'critica';
  if (s.includes('HIGH') || s.includes('ALTA')) return 'alta';
  return 'media';
}

export async function fetchFairnessLive(): Promise<{
  metrics: FairnessMetric[];
  alerts: FairnessAlert[];
  series: { label: string; value: number }[];
}> {
  const [metricsPage, alertsPage] = await Promise.all([
    httpClient<PageBody<BeFairnessMetric>>('/api/v1/fairness/metrics?size=50'),
    httpClient<PageBody<BeFairnessAlert>>('/api/v1/fairness/alerts?size=50'),
  ]);

  const byGroup = new Map<string, FairnessMetric>();
  for (const item of metricsPage.items ?? []) {
    const group = item.segment_name || item.group_code || item.model_version;
    const current = byGroup.get(group) ?? {
      group,
      approvalRatePct: 50,
      disparateImpact: 1,
      equalOpportunityGap: 0,
      volume: 0,
    };
    const name = (item.metric_name || '').toLowerCase();
    const value = Number(item.metric_value) || 0;
    if (name.includes('disparate') || name.includes('di')) {
      current.disparateImpact = value;
    } else if (name.includes('equal') || name.includes('eop') || name.includes('gap')) {
      current.equalOpportunityGap = value <= 1 ? value * 100 : value;
    } else if (name.includes('approv') || name.includes('rate')) {
      current.approvalRatePct = value <= 1 ? value * 100 : value;
    } else {
      current.disparateImpact = value;
    }
    byGroup.set(group, current);
  }

  const metrics = [...byGroup.values()];
  const alerts: FairnessAlert[] = (alertsPage.items ?? []).map((a) => ({
    alertId: a.alert_id,
    metric: 'Disparate impact',
    group: a.model_version || 'modelo',
    detectedAt: a.opened_at,
    severity: mapSeverity(a.severity),
    detail: a.message,
    status: a.status.toUpperCase().includes('OPEN') ? 'aberto' : 'em_analise',
  }));

  const series = metrics.slice(0, 6).map((m, i) => ({
    label: m.group.slice(0, 8) || `G${i + 1}`,
    value: m.disparateImpact,
  }));

  return { metrics, alerts, series };
}

export async function analyzeFairnessLive(modelVersion = 'model-lab'): Promise<void> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  await httpClient('/api/v1/fairness/analyze', {
    method: 'POST',
    body: {
      model_version: modelVersion,
      window: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      segments: ['region', 'age_band', 'thinfile'],
      metrics: ['disparate_impact', 'equal_opportunity'],
      threshold_profile: 'lab-default',
    },
  });
}
