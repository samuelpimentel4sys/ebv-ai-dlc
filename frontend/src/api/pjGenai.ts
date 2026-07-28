/**
 * API client — EP-03 Copiloto GenAI PJ (Emilly Python :8090).
 * HITL (submit/approve/trail) permanece em `pjHitl.ts` → Noah :8080.
 */
import { httpClient } from '@/lib/httpClient';
import { toNumber } from '@/lib/number';
import { AURORA } from '@/app/story';
import { isUuid, lastHitlOpinionId, rememberHitlOpinionId } from '@/api/pjHitl';
import type {
  ApprovalItem,
  CostByAnalyst,
  CostByModel,
  ExtractionResult,
  ExtractedField,
  FinancialRatio,
  GroupResponse,
  GuardrailFinding,
  GuardrailReport,
  LibraryDocument,
  Opinion,
  OpinionSection,
  RagAnswer,
} from '@/epics/copiloto-pj/data';
import { costBudget, routingPolicy } from '@/epics/copiloto-pj/data';

function sumCalls(models: { calls?: number }[]): number {
  return models.reduce((sum, m) => sum + toNumber(m.calls), 0);
}

const BASE = '/api/v1/pj';
const DOC_KEY = 'prisma.pj.docId';
const CNPJ_KEY = 'prisma.pj.cnpj';

export function labPjCnpj(): string {
  try {
    const fromEnv = import.meta.env.VITE_PJ_CNPJ;
    if (typeof fromEnv === 'string' && fromEnv.replace(/\D/g, '').length >= 14) {
      return fromEnv.replace(/\D/g, '').slice(0, 14);
    }
    const stored = sessionStorage.getItem(CNPJ_KEY);
    if (stored && stored.replace(/\D/g, '').length >= 14) {
      return stored.replace(/\D/g, '').slice(0, 14);
    }
  } catch {
    /* ignore */
  }
  return AURORA.document;
}

export function rememberPjCnpj(cnpj: string) {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length < 14) return;
  try {
    sessionStorage.setItem(CNPJ_KEY, digits.slice(0, 14));
  } catch {
    /* ignore */
  }
}

export function labPjDocId(): string | null {
  try {
    const fromEnv = import.meta.env.VITE_PJ_DOC_ID;
    if (typeof fromEnv === 'string' && isUuid(fromEnv)) return fromEnv;
    const stored = sessionStorage.getItem(DOC_KEY);
    return stored && isUuid(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function rememberPjDocId(docId: string) {
  if (!isUuid(docId)) return;
  try {
    sessionStorage.setItem(DOC_KEY, docId);
  } catch {
    /* ignore */
  }
}

function mapOpinionStatus(raw: string): Opinion['status'] {
  const s = (raw || '').toUpperCase();
  if (s.includes('APPROV')) return 'aprovado';
  if (s.includes('REJECT') || s.includes('REPROV') || s.includes('BLOCK')) return 'reprovado';
  if (s.includes('SUBMIT') || s.includes('REVIEW') || s.includes('READY')) return 'em_aprovacao';
  return 'rascunho';
}

function mapSectionTitle(code: string): string {
  const map: Record<string, string> = {
    RESUMO: 'Sumário executivo',
    INDICES: 'Análise financeira',
    RISCOS: 'Riscos e condicionantes',
    RECOMENDACAO: 'Recomendação',
    GRUPO: 'Grupo econômico',
    SETOR: 'Contexto setorial',
  };
  return map[code.toUpperCase()] ?? code;
}

function mapOpinion(res: {
  opinionId: string;
  cnpj: string;
  status: string;
  modelRoute?: string | null;
  elapsedMs?: number | null;
  operationAmount?: number | null;
  sections?: { code: string; contentMd: string; status?: string; citationIds?: string[] }[];
}): Opinion {
  rememberHitlOpinionId(res.opinionId);
  rememberPjCnpj(res.cnpj);
  const sections: OpinionSection[] = (res.sections ?? []).map((s) => ({
    id: s.code.toLowerCase(),
    title: mapSectionTitle(s.code),
    body: s.contentMd || '',
    citations: s.citationIds ?? [],
    unverified: (s.status || '').toUpperCase() === 'UNVERIFIED',
  }));
  const amount = toNumber(res.operationAmount, 0);
  return {
    opinionId: res.opinionId,
    cnpj: res.cnpj,
    razaoSocial: AURORA.name,
    status: mapOpinionStatus(res.status),
    generatedAt: new Date().toISOString(),
    generationMs: toNumber(res.elapsedMs, 0),
    model: res.modelRoute || 'emilly-genai',
    analyst: 'lab',
    requestedLimit: amount || AURORA.exposure,
    suggestedLimit: amount ? amount * 0.7 : 5_500_000,
    sections,
  };
}

function fieldGroup(key: string): ExtractedField['group'] {
  const k = key.toLowerCase();
  if (k.includes('receita') || k.includes('ebitda') || k.includes('lucro')) return 'DRE';
  if (k.includes('caixa') || k.includes('fluxo')) return 'Fluxo de caixa';
  if (k.includes('cnpj') || k.includes('exerc') || k.includes('razao')) return 'Cabeçalho';
  return 'Balanço patrimonial';
}

/* -------------------------------------------------------------------------- */
/* F01 Extraction                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchExtractionLive(): Promise<ExtractionResult> {
  const docId = labPjDocId();
  if (!docId) {
    return {
      docId: '',
      cnpj: labPjCnpj(),
      razaoSocial: AURORA.name,
      fileName: '',
      pages: 0,
      uploadedAt: new Date().toISOString(),
      status: 'processando',
      ocrEngine: '—',
      fields: [],
    };
  }
  const res = await httpClient<{
    documentId: string;
    cnpj: string;
    status: string;
    engine?: string;
    extractionStatus?: string;
    completedAt?: string | null;
    fields: {
      fieldKey: string;
      valueNum: number | null;
      valueText: string | null;
      confidence: number;
      reviewStatus: string;
      correctedValueNum: number | null;
    }[];
  }>(`${BASE}/documents/${encodeURIComponent(docId)}/extraction?cnpj=${labPjCnpj()}`);

  const fields: ExtractedField[] = (res.fields ?? []).map((f) => {
    const num = f.correctedValueNum ?? f.valueNum;
    return {
      id: f.fieldKey,
      label: f.fieldKey.replace(/_/g, ' '),
      page: 1,
      value: f.valueText ?? (num != null ? String(num) : '—'),
      normalized: num,
      confidence: toNumber(f.confidence),
      corrected: f.correctedValueNum != null,
      group: fieldGroup(f.fieldKey),
    };
  });

  const st = (res.status || res.extractionStatus || '').toUpperCase();
  return {
    docId: res.documentId,
    cnpj: res.cnpj,
    razaoSocial: AURORA.name,
    fileName: `documento-${res.documentId.slice(0, 8)}.pdf`,
    pages: Math.max(1, fields.length),
    uploadedAt: res.completedAt ?? new Date().toISOString(),
    status: st.includes('EXTRACT') || st.includes('COMPLET') ? 'conferencia' : 'processando',
    ocrEngine: res.engine || 'emilly',
    fields,
  };
}

export async function correctExtractionFieldLive(
  docId: string,
  fieldKey: string,
  correctedValueNum: number,
): Promise<void> {
  await httpClient(`${BASE}/documents/${encodeURIComponent(docId)}/correct`, {
    method: 'PATCH',
    body: {
      fieldKey,
      correctedValueNum,
      cnpj: labPjCnpj(),
    },
  });
}

/* -------------------------------------------------------------------------- */
/* F02 RAG                                                                    */
/* -------------------------------------------------------------------------- */

export async function queryRagLive(question: string): Promise<RagAnswer> {
  const started = performance.now();
  const res = await httpClient<{
    answerId: string;
    cnpj: string;
    chunks: {
      chunkId: string;
      documentId: string;
      page: number;
      score: number;
      excerpt: string;
    }[];
  }>(`${BASE}/rag/query`, {
    method: 'POST',
    body: { cnpj: labPjCnpj(), query: question, topK: 8 },
  });
  const citations = (res.chunks ?? []).map((c, i) => ({
    citationId: `cit-${i + 1}`,
    docId: c.documentId,
    docName: c.documentId.slice(0, 8),
    page: c.page,
    chunkId: c.chunkId,
    similarity: toNumber(c.score),
    excerpt: c.excerpt,
  }));
  const answer =
    citations.length > 0
      ? citations.map((c) => c.excerpt).join('\n\n')
      : 'Nenhum trecho recuperado no índice RAG para esta pergunta (indexe documentos na biblioteca).';
  return {
    answerId: res.answerId,
    cnpj: res.cnpj,
    question,
    answer,
    citations,
    latencyMs: Math.round(performance.now() - started),
    model: 'emilly-rag',
  };
}

/* -------------------------------------------------------------------------- */
/* F03 Opinion                                                                */
/* -------------------------------------------------------------------------- */

export async function ensureOpinionLive(): Promise<Opinion> {
  const existing = lastHitlOpinionId();
  if (existing) {
    try {
      return await fetchOpinionLive(existing);
    } catch {
      /* recreate below */
    }
  }
  const created = await httpClient<{
    opinionId: string;
    status: string;
    modelRoute?: string;
    elapsedMs?: number;
    operationAmount?: number;
    cnpj?: string;
    sections?: { code: string; contentMd: string; status?: string; citationIds?: string[] }[];
  }>(`${BASE}/opinions`, {
    method: 'POST',
    body: {
      cnpj: labPjCnpj(),
      operationAmount: 8_000_000,
      currency: 'BRL',
      sections: ['RESUMO', 'INDICES', 'RISCOS', 'RECOMENDACAO'],
      sync: true,
    },
  });
  return mapOpinion({
    ...created,
    cnpj: created.cnpj ?? labPjCnpj(),
  });
}

export async function fetchOpinionLive(opinionId?: string): Promise<Opinion> {
  const id = opinionId && isUuid(opinionId) ? opinionId : lastHitlOpinionId();
  if (!id) return ensureOpinionLive();
  const res = await httpClient<{
    opinionId: string;
    cnpj: string;
    status: string;
    modelRoute?: string | null;
    elapsedMs?: number | null;
    operationAmount?: number | null;
    sections?: { code: string; contentMd: string; status?: string; citationIds?: string[] }[];
  }>(`${BASE}/opinions/${encodeURIComponent(id)}`);
  return mapOpinion(res);
}

export async function patchOpinionLive(
  opinionId: string,
  sections: { code: string; contentMd: string }[],
): Promise<Opinion> {
  const id = isUuid(opinionId) ? opinionId : resolveOpinionOrThrow(opinionId);
  const res = await httpClient<{
    opinionId: string;
    cnpj: string;
    status: string;
    modelRoute?: string | null;
    elapsedMs?: number | null;
    operationAmount?: number | null;
    sections?: { code: string; contentMd: string; status?: string; citationIds?: string[] }[];
  }>(`${BASE}/opinions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { sections },
  });
  return mapOpinion(res);
}

function resolveOpinionOrThrow(displayId: string): string {
  if (isUuid(displayId)) return displayId;
  const lab = lastHitlOpinionId();
  if (lab) return lab;
  throw new Error('Parecer live precisa de UUID (VITE_PJ_OPINION_ID ou ensureOpinionLive).');
}

/* -------------------------------------------------------------------------- */
/* F04 Approval queue (GenAI GET + HITL trail Noah)                           */
/* -------------------------------------------------------------------------- */

export async function fetchApprovalQueueLive(): Promise<ApprovalItem[]> {
  const opinion = await ensureOpinionLive();
  const st = opinion.status;
  return [
    {
      opinionId: opinion.opinionId,
      cnpj: opinion.cnpj,
      razaoSocial: opinion.razaoSocial,
      analyst: opinion.analyst,
      submittedAt: opinion.generatedAt,
      requestedLimit: opinion.requestedLimit,
      suggestedLimit: opinion.suggestedLimit,
      authorityLevel: opinion.suggestedLimit >= 5_000_000 ? 'superintendente' : 'gerente',
      status: st === 'aprovado' ? 'aprovado' : st === 'reprovado' ? 'reprovado' : 'aguardando',
      riskGrade: AURORA.rating,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* F05 Ratios                                                                 */
/* -------------------------------------------------------------------------- */

export async function fetchRatiosLive(): Promise<FinancialRatio[]> {
  const res = await httpClient<{
    cnpj: string;
    runs: {
      runId?: string;
      fiscalYear?: number;
      ratios?: {
        code: string;
        status: string;
        value?: number;
        formulaSnapshot?: string;
        inputs?: Record<string, number>;
        sectorMedian?: number;
        missingFields?: string[];
      }[];
      results?: {
        code: string;
        status: string;
        value?: number;
        formulaSnapshot?: string;
        inputs?: Record<string, number>;
        sectorMedian?: number;
      }[];
    }[];
  }>(`${BASE}/${labPjCnpj()}/ratios`);

  const latest = res.runs?.[0];
  const items = latest?.ratios ?? latest?.results ?? [];
  if (!items.length) {
    // Sem run: dispara calculate mínimo para popular lab (campos vazios → nao_calculavel)
    const calc = await httpClient<{
      ratios: {
        code: string;
        status: string;
        value?: number;
        formulaSnapshot?: string;
        inputs?: Record<string, number>;
        sectorMedian?: number;
        missingFields?: string[];
      }[];
    }>(`${BASE}/ratios/calculate`, {
      method: 'POST',
      body: {
        cnpj: labPjCnpj(),
        fiscalYear: 2025,
        chartVersion: 'CANON-2026.1',
        fields: {},
        forceEstimate: false,
      },
    });
    return (calc.ratios ?? []).map(mapRatioItem);
  }
  return items.map(mapRatioItem);
}

function mapRatioItem(r: {
  code: string;
  status: string;
  value?: number;
  formulaSnapshot?: string;
  inputs?: Record<string, number>;
  sectorMedian?: number;
  missingFields?: string[];
}): FinancialRatio {
  const st = (r.status || '').toUpperCase();
  let status: FinancialRatio['status'] = 'nao_calculavel';
  if (st === 'COMPUTED' && r.value != null) {
    status = 'bom';
  }
  const inputs = r.inputs
    ? Object.entries(r.inputs)
        .map(([k, v]) => `${k}=${v}`)
        .join(' · ')
    : (r.missingFields ?? []).join(', ') || '—';
  return {
    id: r.code,
    name: r.code.replace(/_/g, ' '),
    value: r.value ?? null,
    unit: '×',
    formula: r.formulaSnapshot || r.code,
    inputs,
    sectorMedian: toNumber(r.sectorMedian),
    interpretation:
      st === 'COMPUTED'
        ? 'Calculado pelo motor Emilly (CANON-2026.1).'
        : `Não calculável: ${(r.missingFields ?? []).join(', ') || st}`,
    status,
  };
}

/* -------------------------------------------------------------------------- */
/* F06 Guardrails                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchGuardrailReportLive(): Promise<GuardrailReport> {
  const opinion = await ensureOpinionLive();
  try {
    const res = await httpClient<{
      id?: string;
      opinionId?: string;
      status?: string;
      createdAt?: string;
      findings?: {
        sectionCode?: string;
        claim?: string;
        result?: string;
        reason?: string;
        citationId?: string | null;
      }[];
    }>(`${BASE}/guardrails/report/${encodeURIComponent(opinion.opinionId)}`);
    return mapGuardrailReport(opinion.opinionId, res);
  } catch {
    const verified = await httpClient<{
      reportId?: string;
      opinionId: string;
      status: string;
      findings: {
        sectionCode?: string;
        claim?: string;
        result?: string;
        reason?: string;
        citationId?: string | null;
      }[];
    }>(`${BASE}/guardrails/verify`, {
      method: 'POST',
      body: { opinionId: opinion.opinionId },
    });
    return mapGuardrailReport(opinion.opinionId, verified);
  }
}

function mapGuardrailReport(
  opinionId: string,
  res: {
    status?: string;
    createdAt?: string;
    findings?: {
      sectionCode?: string;
      claim?: string;
      result?: string;
      reason?: string;
      citationId?: string | null;
    }[];
  },
): GuardrailReport {
  const findings: GuardrailFinding[] = (res.findings ?? []).map((f, i) => {
    const rejected = (f.result || '').toUpperCase() === 'REJECTED';
    return {
      findingId: `gf-${i + 1}`,
      severity: rejected ? 'medio' : 'baixo',
      type: rejected ? 'afirmacao_sem_lastro' : 'citacao_invalida',
      section: f.sectionCode || '—',
      claim: f.claim || '—',
      detail: f.reason || f.result || '—',
      suggestion: rejected ? 'Corrigir ou citar trecho com lastro.' : 'Ok',
      status: rejected ? 'aberto' : 'aceito',
    };
  });
  const rejected = findings.filter((f) => f.status === 'aberto').length;
  return {
    opinionId,
    verifiedAt: res.createdAt ?? new Date().toISOString(),
    claimsTotal: findings.length,
    claimsGrounded: findings.length - rejected,
    numbersChecked: findings.length,
    numbersMatched: findings.length - rejected,
    findings,
  };
}

export async function verifyGuardrailsLive(opinionId?: string): Promise<GuardrailReport> {
  const id = opinionId && isUuid(opinionId) ? opinionId : (await ensureOpinionLive()).opinionId;
  const res = await httpClient<{
    opinionId: string;
    status: string;
    findings: {
      sectionCode?: string;
      claim?: string;
      result?: string;
      reason?: string;
      citationId?: string | null;
    }[];
  }>(`${BASE}/guardrails/verify`, {
    method: 'POST',
    body: { opinionId: id },
  });
  return mapGuardrailReport(id, res);
}

/* -------------------------------------------------------------------------- */
/* F07 Library                                                                */
/* -------------------------------------------------------------------------- */

export async function fetchLibraryLive(): Promise<LibraryDocument[]> {
  const res = await httpClient<{
    cnpj: string;
    documents: {
      id: string;
      docType: string;
      filename: string;
      storageUri: string;
      retentionUntil: string;
      legalHold: boolean;
      status: string;
    }[];
  }>(`${BASE}/library/${labPjCnpj()}`);

  return (res.documents ?? []).map((d) => {
    const st = (d.status || '').toUpperCase();
    let indexStatus: LibraryDocument['indexStatus'] = 'nao_indexado';
    if (st.includes('INDEX')) indexStatus = 'indexado';
    else if (st.includes('FAIL') || st.includes('ERR')) indexStatus = 'falha';
    else if (st.includes('PEND') || st.includes('INGEST')) indexStatus = 'indexando';
    const typeRaw = (d.docType || 'outros').toLowerCase();
    const type: LibraryDocument['type'] = (
      ['balanco', 'dre', 'contrato', 'certidao', 'ata'] as const
    ).includes(typeRaw as 'balanco')
      ? (typeRaw as LibraryDocument['type'])
      : 'outros';
    return {
      docId: d.id,
      name: d.filename,
      type,
      sizeKb: 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'lab',
      indexStatus,
      chunks: 0,
      legalHold: Boolean(d.legalHold),
      retentionUntil: d.retentionUntil,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* F08 Economic group                                                         */
/* -------------------------------------------------------------------------- */

export async function fetchEconomicGroupLive(): Promise<GroupResponse> {
  const cnpj = labPjCnpj();
  try {
    return await mapGroup(
      await httpClient<{
        rootCnpj: string;
        depth: number;
        truncated: boolean;
        totalExposure: number;
        refreshedAt: string;
        nodes: { cnpj: string; name: string; exposure: number }[];
      }>(`${BASE}/${cnpj}/group?depth=3`),
    );
  } catch {
    await httpClient(`${BASE}/group/refresh`, {
      method: 'POST',
      body: { cnpj, depth: 3 },
    });
    return mapGroup(
      await httpClient<{
        rootCnpj: string;
        depth: number;
        truncated: boolean;
        totalExposure: number;
        refreshedAt: string;
        nodes: { cnpj: string; name: string; exposure: number }[];
      }>(`${BASE}/${cnpj}/group?depth=3`),
    );
  }
}

function mapGroup(res: {
  rootCnpj: string;
  depth: number;
  truncated: boolean;
  totalExposure: number;
  refreshedAt: string;
  nodes: { cnpj: string; name: string; exposure: number }[];
}): GroupResponse {
  const members = (res.nodes ?? []).map((n, i) => ({
    cnpj: n.cnpj,
    name: n.name || n.cnpj,
    role: (i === 0 ? 'controladora' : 'controlada') as 'controladora' | 'controlada',
    participationPct: i === 0 ? 100 : 50,
    exposure: toNumber(n.exposure),
    overdue: 0,
    riskGrade: '—',
  }));
  const edges =
    members.length > 1
      ? members.slice(1).map((m) => ({
          from: members[0].cnpj,
          to: m.cnpj,
          label: `${m.participationPct}%`,
        }))
      : [];
  return {
    rootCnpj: res.rootCnpj,
    refreshedAt: res.refreshedAt,
    truncated: Boolean(res.truncated),
    depth: res.depth,
    totalExposure: toNumber(res.totalExposure),
    members,
    edges,
  };
}

/* -------------------------------------------------------------------------- */
/* F09 Cost / routing                                                         */
/* -------------------------------------------------------------------------- */

export async function fetchCostTelemetryLive(): Promise<{
  models: CostByModel[];
  analysts: CostByAnalyst[];
  budget: typeof costBudget;
  routingRule: string;
}> {
  const [telemetry, decisions] = await Promise.all([
    httpClient<{
      totalUsd: number;
      budgetUsdMonth: number | null;
      hardStopPct: number;
      budgetUsedPct: number | null;
      byModel: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        usd: number;
        calls: number;
      }[];
    }>(`${BASE}/telemetry/cost`),
    httpClient<{
      items: { modelChosen: string; taskType: string; reason: string }[];
    }>(`${BASE}/routing/decisions?limit=20`).catch(() => ({ items: [] })),
  ]);

  const models: CostByModel[] = (telemetry.byModel ?? []).map((m) => ({
    model: m.model,
    calls: toNumber(m.calls),
    inputTokens: toNumber(m.inputTokens),
    outputTokens: toNumber(m.outputTokens),
    cost: toNumber(m.usd),
    avgLatencyMs: 0,
  }));

  const consumed = toNumber(telemetry.totalUsd);
  const monthlyBudget = toNumber(telemetry.budgetUsdMonth, costBudget.monthlyBudget);
  const opinionsMonth = Math.max(1, sumCalls(telemetry.byModel ?? []));
  const budget = {
    ...costBudget,
    monthlyBudget,
    consumed,
    opinionsMonth,
    actualCostPerOpinion: consumed / opinionsMonth,
  };

  const rule =
    decisions.items?.[0]?.reason ||
    decisions.items?.[0]?.modelChosen ||
    routingPolicy.rule;

  return {
    models,
    analysts: [],
    budget,
    routingRule: rule,
  };
}
