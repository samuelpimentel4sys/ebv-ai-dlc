/**
 * API client — Contestações & autoatendimento do titular
 * (self-service, fila, tracking, anexos, SLA).
 */
import { httpClient } from '@/lib/httpClient';
import type {
  Attachment,
  DisputeQueueItem,
  DisputeStage,
  DisputeTracking,
  DisputeTimelineEvent,
  Escalation,
  SlaCase,
  TitularRecord,
} from '@/epics/contestacao/data';

function maskDocumento(doc: string | null | undefined): string {
  if (!doc) return '—';
  const digits = doc.replace(/\D/g, '');
  if (digits.length < 5) return doc;
  return `${digits.slice(0, 3)}.***.**${digits.slice(-2)}`;
}

function mapStage(statusOrStage: string): DisputeStage {
  const s = (statusOrStage || '').toUpperCase();
  if (s.includes('RESOLV') || s.includes('CANCEL') || s.includes('CONCLU') || s.includes('DONE')) {
    return 'concluida';
  }
  if (s.includes('TITULAR') || s.includes('WAITING') || s.includes('AGUARD')) {
    return 'aguardando_titular';
  }
  if (s.includes('SOURCE') || s.includes('FONTE') || s.includes('DILIGEN')) {
    return 'consulta_fonte';
  }
  if (s.includes('ANAL') || s.includes('IN_') || s.includes('REVIEW')) {
    return 'em_analise';
  }
  if (s.includes('OPEN') || s.includes('RECEB') || s.includes('CREATED')) {
    return 'recebida';
  }
  return 'recebida';
}

function mapPriority(dueAt: string): DisputeQueueItem['priority'] {
  const hours = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (hours < 12) return 'critica';
  if (hours < 48) return 'alta';
  return 'media';
}

/* -------------------------------------------------------------------------- */
/* Self-service                                                               */
/* -------------------------------------------------------------------------- */

const SESSION_KEY = 'prisma.selfService.sessionToken';

export function getSelfServiceSession(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSelfServiceSession(token: string) {
  sessionStorage.setItem(SESSION_KEY, token);
}

export async function identifyTitularLive(input: {
  documento: string;
  birthDate?: string;
  lastDigits?: string;
}): Promise<{ sessionToken: string; expiresAt: string }> {
  const res = await httpClient<{
    sessionToken: string;
    verified: boolean;
    expiresAt: string;
  }>('/api/v1/self-service/identify', {
    method: 'POST',
    body: {
      documento: input.documento,
      birthDate: input.birthDate,
      lastDigits: input.lastDigits,
    },
  });
  setSelfServiceSession(res.sessionToken);
  return { sessionToken: res.sessionToken, expiresAt: res.expiresAt };
}

export async function fetchTitularRecordsLive(sessionToken?: string): Promise<TitularRecord[]> {
  let token = sessionToken || getSelfServiceSession();
  if (!token) {
    const id = await identifyTitularLive({ documento: '12345678901', lastDigits: '01' });
    token = id.sessionToken;
  }
  const res = await httpClient<{
    items: {
      recordRef: string;
      type: string;
      creditor: string;
      amount: number;
      status: string;
    }[];
  }>(`/api/v1/self-service/records?sessionToken=${encodeURIComponent(token)}`);

  return (res.items ?? []).map((item) => {
    const t = (item.type || '').toLowerCase();
    let type: TitularRecord['type'] = 'apontamento';
    if (t.includes('consult')) type = 'consulta';
    else if (t.includes('cadast') || t.includes('address')) type = 'cadastro';
    else if (t.includes('score')) type = 'score';
    const open = (item.status || '').toUpperCase().includes('OPEN') ||
      (item.status || '').toUpperCase().includes('ACTIVE');
    return {
      recordId: item.recordRef,
      type,
      title: `${item.type || 'Registro'} · ${item.creditor || '—'}`,
      detail: `Ref ${item.recordRef} · status ${item.status}`,
      amount: item.amount,
      source: item.creditor || '—',
      occurredAt: new Date().toISOString(),
      disputable: open,
    };
  });
}

export async function openSelfServiceDisputeLive(input: {
  reasonCode: string;
  description: string;
  recordRef?: string;
}): Promise<{ protocol: string; id: string }> {
  let token = getSelfServiceSession();
  if (!token) {
    const id = await identifyTitularLive({ documento: '12345678901', lastDigits: '01' });
    token = id.sessionToken;
  }
  const res = await httpClient<{
    id: string;
    protocol: string;
    status: string;
    dueAt: string;
    trackingUrl: string;
  }>('/api/v1/self-service/disputes', {
    method: 'POST',
    body: {
      sessionToken: token,
      reason_code: input.reasonCode,
      description: input.description,
      record_ref: input.recordRef,
    },
  });
  return { protocol: res.protocol, id: res.id };
}

/* -------------------------------------------------------------------------- */
/* Dispute queue / resolve                                                    */
/* -------------------------------------------------------------------------- */

export async function fetchDisputeQueueLive(): Promise<DisputeQueueItem[]> {
  const res = await httpClient<{
    items: {
      id: string;
      protocol: string;
      documento: string;
      status: string;
      dueAt: string;
      createdAt: string;
    }[];
  }>('/api/v1/disputes/queue?size=50');

  return (res.items ?? []).map((item) => ({
    id: item.id,
    protocol: item.protocol,
    documento: maskDocumento(item.documento),
    subject: `Contestação ${item.protocol}`,
    openedAt: item.createdAt,
    slaDueAt: item.dueAt,
    stage: mapStage(item.status),
    priority: mapPriority(item.dueAt),
    channel: 'portal' as const,
    evidences: 0,
  }));
}

export async function resolveDisputeLive(input: {
  id: string;
  outcome: 'procedente' | 'parcial' | 'improcedente';
  rationale: string;
}): Promise<void> {
  const outcomeMap = {
    procedente: 'RESOLVED_FAVOR_TITULAR',
    parcial: 'RESOLVED_FAVOR_TITULAR',
    improcedente: 'RESOLVED_MAINTAIN',
  } as const;
  await httpClient(`/api/v1/disputes/${encodeURIComponent(input.id)}/resolve`, {
    method: 'PATCH',
    body: {
      outcome: outcomeMap[input.outcome],
      rationale: input.rationale,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

function mapActor(actor: string): DisputeTimelineEvent['actor'] {
  const a = (actor || '').toLowerCase();
  if (a.includes('titular') || a.includes('subject')) return 'titular';
  if (a.includes('fonte') || a.includes('source') || a.includes('creditor')) return 'fonte';
  if (a.includes('system') || a.includes('engine')) return 'sistema';
  return 'analista';
}

export async function fetchDisputeTrackingLive(
  protocol: string,
  confirmDocumento = '01',
): Promise<DisputeTracking> {
  const qs = new URLSearchParams({ confirmDocumento });
  const [tracking, timeline] = await Promise.all([
    httpClient<{
      protocol: string;
      stage: string;
      status: string;
      slaDueAt: string;
      daysRemaining: number;
      nextAction: string;
      nextActor: string;
      timelinePreview: { eventType: string; occurredAt: string }[];
    }>(`/api/v1/disputes/${encodeURIComponent(protocol)}/tracking?${qs}`),
    httpClient<{
      protocol: string;
      events: { eventType: string; message: string; actor: string; at: string }[];
    }>(`/api/v1/disputes/${encodeURIComponent(protocol)}/timeline?${qs}`).catch(() => ({
      protocol,
      events: [] as { eventType: string; message: string; actor: string; at: string }[],
    })),
  ]);

  const rawEvents = timeline.events?.length
    ? timeline.events
    : (tracking.timelinePreview ?? []).map((e) => ({
        eventType: e.eventType,
        message: e.eventType,
        actor: 'sistema',
        at: e.occurredAt,
      }));

  const events: DisputeTimelineEvent[] = rawEvents.map((e) => ({
    at: e.at,
    stage: mapStage(e.eventType || tracking.stage),
    title: e.eventType,
    detail: e.message,
    actor: mapActor(e.actor),
  }));

  const stage = mapStage(tracking.stage || tracking.status);
  return {
    protocol: tracking.protocol,
    documento: '—',
    openedAt: events[0]?.at ?? new Date().toISOString(),
    slaDueAt: tracking.slaDueAt,
    stage,
    subject: `Contestação ${tracking.protocol}`,
    outcome:
      stage === 'concluida'
        ? tracking.status?.toUpperCase().includes('MAINTAIN')
          ? 'improcedente'
          : 'procedente'
        : undefined,
    nextAction: tracking.nextAction
      ? {
          title: tracking.nextAction,
          description: `Próximo ator: ${tracking.nextActor || '—'}`,
          dueAt: tracking.slaDueAt,
        }
      : undefined,
    timeline: events,
  };
}

/* -------------------------------------------------------------------------- */
/* Attachments                                                                */
/* -------------------------------------------------------------------------- */

export async function fetchAttachmentsLive(disputeId: string): Promise<Attachment[]> {
  const res = await httpClient<{
    items: {
      id: string;
      filename: string;
      contentType: string;
      sha256: string;
      prevAttachmentId: string | null;
      createdAt: string;
    }[];
  }>(`/api/v1/disputes/${encodeURIComponent(disputeId)}/attachments`);

  return (res.items ?? []).map((item) => ({
    attachmentId: item.id,
    fileName: item.filename,
    mime: item.contentType,
    sizeKb: 1,
    uploadedAt: item.createdAt,
    uploadedBy: 'analista' as const,
    scanStatus: 'limpo' as const,
    description: `sha256:${item.sha256?.slice(0, 12) ?? '…'}`,
  }));
}

export async function uploadAttachmentLive(input: {
  disputeId: string;
  filename: string;
  contentBase64: string;
  contentType: string;
}): Promise<Attachment> {
  const res = await httpClient<{
    id: string;
    filename: string;
    contentType: string;
    sha256: string;
    status: string;
    uploadedAt: string;
  }>(`/api/v1/disputes/${encodeURIComponent(input.disputeId)}/attachments`, {
    method: 'POST',
    body: {
      filename: input.filename,
      contentBase64: input.contentBase64,
      contentType: input.contentType,
    },
  });
  return {
    attachmentId: res.id,
    fileName: res.filename,
    mime: res.contentType,
    sizeKb: 1,
    uploadedAt: res.uploadedAt,
    uploadedBy: 'analista',
    scanStatus: 'limpo',
    description: `Upload lab · ${res.status}`,
  };
}

export async function fetchEvidencePackLive(disputeId: string): Promise<{ manifestHash: string }> {
  const res = await httpClient<{ manifestHash: string }>(
    `/api/v1/disputes/${encodeURIComponent(disputeId)}/evidence-pack`,
  );
  return { manifestHash: res.manifestHash };
}

/* -------------------------------------------------------------------------- */
/* SLA                                                                        */
/* -------------------------------------------------------------------------- */

export async function fetchSlaCasesLive(): Promise<SlaCase[]> {
  const res = await httpClient<{
    asOf: string;
    counts: { onTrack: number; atRisk: number; overdue: number };
    atRiskSample: {
      protocol: string;
      businessDaysRemaining: number;
      stage: string;
      assignedTo: string;
    }[];
  }>('/api/v1/sla/status?window=24h');

  return (res.atRiskSample ?? []).map((item, index) => {
    const days = Number(item.businessDaysRemaining) || 0;
    const hoursRemaining = days * 24;
    let band: SlaCase['band'] = 'no_prazo';
    if (days < 0) band = 'estourado';
    else if (days <= 1) band = 'risco';
    else if (days <= 3) band = 'atencao';
    return {
      id: `sla-${index}-${item.protocol}`,
      protocol: item.protocol,
      hoursRemaining,
      slaHours: 120,
      band,
      assignee: item.assignedTo || undefined,
      stage: mapStage(item.stage),
      channel: 'portal',
    };
  });
}

export async function fetchEscalationsLive(): Promise<Escalation[]> {
  const res = await httpClient<{
    items: {
      id: string;
      disputeId: string;
      level: number;
      notifiedAt: string;
      reason: string;
    }[];
  }>('/api/v1/sla/escalations');

  return (res.items ?? []).map((item) => ({
    at: item.notifiedAt,
    protocol: item.disputeId,
    from: `nível ${item.level - 1}`,
    to: `nível ${item.level}`,
    reason: item.reason,
  }));
}
