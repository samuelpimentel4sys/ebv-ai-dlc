/**
 * API client — EP-05 F01 Biometria / Liveness (Noah Java :8080).
 * Lab: stub|WireMock — sem Amplify Face Liveness real.
 */
import { httpClient } from '@/lib/httpClient';

const BASE = '/api/v1/auth';
const SESSION_KEY = 'prisma.liveness.session';
const CUSTOMER_KEY = 'prisma.liveness.customerId';

/** UUID lab do smoke Noah (INSTRUCAO_SERVIDOR_LIVENESS). */
export const LAB_CUSTOMER_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

export type LivenessSession = {
  sessionId: string;
  customerId: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  fromCache: boolean;
};

export type BiometricConsent = {
  customerId: string;
  termVersion: string;
  status: string;
};

type StoredSession = LivenessSession & { score?: number; outcome?: 'success' | 'failed' | 'expired' | 'lockout' };

function rememberCustomer(customerId: string) {
  try {
    sessionStorage.setItem(CUSTOMER_KEY, customerId);
  } catch {
    /* ignore */
  }
}

export function lastLivenessCustomerId(): string {
  try {
    return sessionStorage.getItem(CUSTOMER_KEY) ?? LAB_CUSTOMER_ID;
  } catch {
    return LAB_CUSTOMER_ID;
  }
}

export function rememberLivenessSession(session: StoredSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function lastLivenessSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function registerBiometricConsentLive(input?: {
  customerId?: string;
  termVersion?: string;
}): Promise<BiometricConsent> {
  const customerId = input?.customerId ?? LAB_CUSTOMER_ID;
  const res = await httpClient<{
    customer_id: string;
    term_version: string;
    status: string;
  }>(`${BASE}/biometric-consent`, {
    method: 'POST',
    body: {
      customer_id: customerId,
      term_version: input?.termVersion ?? 'v1.0',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'prisma-fe',
    },
  });
  rememberCustomer(res.customer_id);
  return {
    customerId: res.customer_id,
    termVersion: res.term_version,
    status: res.status,
  };
}

export async function createLivenessSessionLive(input?: {
  customerId?: string;
  channel?: string;
  idempotencyKey?: string;
}): Promise<LivenessSession> {
  const customerId = input?.customerId ?? lastLivenessCustomerId();
  const idempotencyKey =
    input?.idempotencyKey ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `lab-${Date.now()}`);

  const res = await httpClient<{
    session_id: string;
    customer_id: string;
    status: string;
    created_at: string;
    expires_at: string;
    from_cache?: boolean;
  }>(`${BASE}/liveness/session`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': idempotencyKey },
    body: {
      customer_id: customerId,
      device_info: {
        platform: 'WEB',
        app_version: '1.0.0-lab',
      },
      audit_context: {
        channel: input?.channel ?? 'WEB_PORTAL',
      },
    },
  });

  const session: LivenessSession = {
    sessionId: res.session_id,
    customerId: res.customer_id,
    status: res.status,
    createdAt: res.created_at,
    expiresAt: res.expires_at,
    fromCache: Boolean(res.from_cache),
  };
  rememberLivenessSession(session);
  return session;
}

/** Mock local (Vitest / VITE_DATA_MODE=mock). */
export function mockBiometricConsent(): BiometricConsent {
  return { customerId: LAB_CUSTOMER_ID, termVersion: 'v1.0', status: 'ACTIVE' };
}

export function mockLivenessSession(): LivenessSession {
  const now = Date.now();
  const session: LivenessSession = {
    sessionId: crypto.randomUUID?.() ?? `mock-${now}`,
    customerId: LAB_CUSTOMER_ID,
    status: 'CREATED',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 180_000).toISOString(),
    fromCache: false,
  };
  rememberLivenessSession(session);
  return session;
}
