import {
  authAuthorizeUrl,
  authTokenUrl,
  isOidcRequired,
  oidcClientId,
  oidcPasswordClientId,
  oidcRedirectUri,
} from '@/lib/auth/oidcConfig';
import { createPkcePair, randomState } from '@/lib/auth/pkce';
import {
  clearSession,
  decodeJwtPayload,
  readSession,
  rolesFromPayload,
  takePkcePending,
  usernameFromPayload,
  writePkcePending,
  writeSession,
  type OidcSession,
} from '@/lib/auth/tokenStore';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

function sessionFromTokens(tokens: TokenResponse, clientId: string): OidcSession {
  const payload = decodeJwtPayload(tokens.access_token);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + Math.max(30, tokens.expires_in - 30) * 1000,
    username: usernameFromPayload(payload),
    roles: rolesFromPayload(payload),
    clientId,
  };
}

async function exchangeToken(
  body: Record<string, string>,
  clientId: string,
): Promise<OidcSession> {
  const response = await fetch(authTokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    let detail = '';
    try {
      const payload = (await response.json()) as {
        error?: string;
        error_description?: string;
      };
      detail = payload.error_description || payload.error || '';
    } catch {
      detail = (await response.text()).slice(0, 180);
    }
    if (response.status === 401) {
      throw new Error('Usuário ou senha inválidos.');
    }
    throw new Error(detail || `Falha na autenticação (${response.status}).`);
  }
  const tokens = (await response.json()) as TokenResponse;
  const session = sessionFromTokens(tokens, clientId);
  writeSession(session);
  return session;
}

/**
 * Login na tela Prisma (ROPC) → Keycloak `prisma-lab`.
 * Sem redirecionar para a UI do Keycloak.
 */
export async function loginWithPassword(username: string, password: string): Promise<OidcSession> {
  const clientId = oidcPasswordClientId();
  const user = username.trim();
  if (!user || !password) {
    throw new Error('Informe usuário e senha.');
  }
  return exchangeToken(
    {
      grant_type: 'password',
      client_id: clientId,
      username: user,
      password,
      scope: 'openid profile',
    },
    clientId,
  );
}

/** SSO opcional: Authorization Code + PKCE (client prisma-steward-ui). */
export async function beginLogin(returnTo = '/'): Promise<void> {
  const { verifier, challenge } = await createPkcePair();
  const state = randomState();
  writePkcePending({ verifier, state, returnTo: returnTo || '/' });
  const clientId = oidcClientId();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'openid profile',
    redirect_uri: oidcRedirectUri(),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${authAuthorizeUrl()}?${params.toString()}`);
}

/** Troca `code` do callback PKCE por tokens. */
export async function completeLogin(code: string, state: string): Promise<string> {
  const pending = takePkcePending();
  if (!pending) {
    throw new Error('Sessão PKCE não encontrada. Inicie o login novamente.');
  }
  if (pending.state !== state) {
    throw new Error('State OIDC inválido (possível CSRF).');
  }

  const clientId = oidcClientId();
  await exchangeToken(
    {
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: oidcRedirectUri(),
      code_verifier: pending.verifier,
    },
    clientId,
  );

  return pending.returnTo || '/';
}

async function refreshSession(session: OidcSession): Promise<OidcSession | null> {
  if (!session.refreshToken) return null;
  const clientId = session.clientId || oidcPasswordClientId();
  try {
    return await exchangeToken(
      {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: session.refreshToken,
      },
      clientId,
    );
  } catch {
    clearSession();
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const session = readSession();
  if (session) {
    if (Date.now() < session.expiresAt) {
      return session.accessToken;
    }
    const refreshed = await refreshSession(session);
    return refreshed?.accessToken ?? null;
  }

  const envBearer = import.meta.env.VITE_API_BEARER;
  return envBearer || null;
}

export function getAccessTokenSync(): string | null {
  const session = readSession();
  if (session && Date.now() < session.expiresAt) {
    return session.accessToken;
  }
  return import.meta.env.VITE_API_BEARER || null;
}

export function currentSession(): OidcSession | null {
  const session = readSession();
  if (session && Date.now() < session.expiresAt) return session;
  if (import.meta.env.VITE_API_BEARER) {
    return {
      accessToken: import.meta.env.VITE_API_BEARER,
      expiresAt: Date.now() + 60 * 60 * 1000,
      username: 'env-bearer',
      roles: [],
    };
  }
  return null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessTokenSync());
}

/** Logout local — sem tela do Keycloak. */
export function logout(redirectToLogin = true): void {
  clearSession();
  if (redirectToLogin) {
    if (isOidcRequired()) {
      window.location.assign('/login');
    } else {
      window.location.assign('/');
    }
  }
}
