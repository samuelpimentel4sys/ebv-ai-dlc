export interface OidcSession {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  username?: string;
  roles: string[];
  /** Client Keycloak que emitiu o token (refresh precisa do mesmo). */
  clientId?: string;
}

const SESSION_KEY = 'prisma.oidc.session';
const PKCE_KEY = 'prisma.oidc.pkce';

export interface PkcePending {
  verifier: string;
  state: string;
  returnTo: string;
}

export function readSession(): OidcSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OidcSession;
  } catch {
    return null;
  }
}

export function writeSession(session: OidcSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function writePkcePending(pending: PkcePending): void {
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pending));
}

export function takePkcePending(): PkcePending | null {
  try {
    const raw = sessionStorage.getItem(PKCE_KEY);
    sessionStorage.removeItem(PKCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PkcePending;
  } catch {
    sessionStorage.removeItem(PKCE_KEY);
    return null;
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function rolesFromPayload(payload: Record<string, unknown> | null): string[] {
  if (!payload) return [];
  const realm = payload.realm_access as { roles?: string[] } | undefined;
  return Array.isArray(realm?.roles) ? realm.roles : [];
}

export function usernameFromPayload(payload: Record<string, unknown> | null): string | undefined {
  if (!payload) return undefined;
  const preferred = payload.preferred_username;
  if (typeof preferred === 'string') return preferred;
  if (typeof payload.sub === 'string') return payload.sub;
  return undefined;
}
