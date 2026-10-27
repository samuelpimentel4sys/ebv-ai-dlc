import { dataMode } from '@/lib/config';

/** Issuer do JWT (Spring valida este valor). */
const DEFAULT_ISSUER = 'http://localhost:8180/realms/prisma';
/** Client com Direct Access Grants (form Prisma). */
const DEFAULT_PASSWORD_CLIENT = 'prisma-lab';
/** Client PKCE (SSO redirect — opcional). */
const DEFAULT_PKCE_CLIENT = 'prisma-steward-ui';

export function oidcIssuer(): string {
  return (import.meta.env.VITE_OIDC_ISSUER ?? DEFAULT_ISSUER).replace(/\/$/, '');
}

/**
 * Base do realm no browser. Preferir same-origin `/realms/prisma`
 * (Nginx/Vite proxy) para o form de login não esbarrar em CORS.
 */
export function oidcBrowserRealmUrl(): string {
  const fromEnv = import.meta.env.VITE_OIDC_BROWSER_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/realms/prisma`;
  }
  return oidcIssuer();
}

export function oidcPasswordClientId(): string {
  return import.meta.env.VITE_OIDC_PASSWORD_CLIENT_ID ?? DEFAULT_PASSWORD_CLIENT;
}

export function oidcClientId(): string {
  return import.meta.env.VITE_OIDC_CLIENT_ID ?? DEFAULT_PKCE_CLIENT;
}

export function oidcRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_OIDC_REDIRECT_URI;
  if (fromEnv) return fromEnv;
  return `${window.location.origin}/auth/callback`;
}

/**
 * Auth obrigatório em live, salvo override explícito.
 * Mock (Vitest) fica livre — telas usam fixtures.
 */
export function isOidcRequired(): boolean {
  const flag = import.meta.env.VITE_OIDC_ENABLED;
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return dataMode() === 'live';
}

export function authAuthorizeUrl(): string {
  return `${oidcBrowserRealmUrl()}/protocol/openid-connect/auth`;
}

export function authTokenUrl(): string {
  return `${oidcBrowserRealmUrl()}/protocol/openid-connect/token`;
}

export function authLogoutUrl(): string {
  return `${oidcBrowserRealmUrl()}/protocol/openid-connect/logout`;
}
