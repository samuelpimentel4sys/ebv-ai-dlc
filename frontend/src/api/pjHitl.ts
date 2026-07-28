/**
 * API client — EP-03 F04 HITL / alçada (Noah Java :8080).
 * GenAI (parecer/RAG/…) via `pjGenai.ts` no mesmo host :8080 (BFF Noah → Emilly).
 */
import { httpClient } from '@/lib/httpClient';

const BASE = '/api/v1/pj/opinions';
const SESSION_KEY = 'prisma.pj.hitl.opinionId';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function rememberHitlOpinionId(opinionId: string) {
  if (!isUuid(opinionId)) return;
  try {
    sessionStorage.setItem(SESSION_KEY, opinionId);
  } catch {
    /* ignore */
  }
}

export function lastHitlOpinionId(): string | null {
  try {
    const fromEnv = import.meta.env.VITE_PJ_OPINION_ID;
    if (typeof fromEnv === 'string' && isUuid(fromEnv)) return fromEnv;
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored && isUuid(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Mock usa ids tipo `op-5512`. Live exige UUID do parecer READY_FOR_REVIEW
 * (seed Emilly / smoke / VITE_PJ_OPINION_ID / última submissão).
 */
export function resolveHitlOpinionId(displayId: string): string {
  if (isUuid(displayId)) return displayId;
  const lab = lastHitlOpinionId();
  if (lab) return lab;
  throw new Error(
    'Parecer live precisa de UUID. Submeta um parecer READY_FOR_REVIEW ou defina VITE_PJ_OPINION_ID.',
  );
}

export type HitlDecision = 'APPROVE' | 'REJECT' | 'ESCALATE';

export async function submitOpinionLive(
  opinionId: string,
  input: { comment?: string; actorId?: string } = {},
): Promise<{ opinionId: string; status: string; requiredLevel: string; trailId: string }> {
  const id = resolveHitlOpinionId(opinionId);
  const res = await httpClient<{
    opinionId: string;
    status: string;
    requiredLevel: string;
    trailId: string;
  }>(`${BASE}/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
    body: {
      comment: input.comment ?? null,
      actorId: input.actorId ?? null,
    },
  });
  rememberHitlOpinionId(res.opinionId || id);
  return res;
}

export async function decideOpinionLive(
  opinionId: string,
  input: {
    decision: HitlDecision;
    comment: string;
    actorId?: string;
    actorMaxLevel?: string;
  },
): Promise<{
  opinionId: string;
  status: string;
  levelCode: string;
  approvedAt: string;
  trailEntryId: string;
}> {
  const id = resolveHitlOpinionId(opinionId);
  return httpClient(`${BASE}/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: {
      decision: input.decision,
      comment: input.comment,
      actorId: input.actorId ?? null,
      actorMaxLevel: input.actorMaxLevel ?? 'L2',
    },
  });
}

export type HitlTrailEntry = {
  id: string;
  action: string;
  actorId: string;
  levelCode: string | null;
  comment: string | null;
  at: string;
};

export async function fetchApprovalTrailLive(opinionId: string): Promise<{
  opinionId: string;
  trail: HitlTrailEntry[];
}> {
  const id = resolveHitlOpinionId(opinionId);
  return httpClient(`${BASE}/${encodeURIComponent(id)}/trail`);
}
