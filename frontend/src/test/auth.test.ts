import { describe, expect, it, beforeEach } from 'vitest';
import { createPkcePair, randomState } from '@/lib/auth/pkce';
import { isOidcRequired } from '@/lib/auth/oidcConfig';
import {
  clearSession,
  decodeJwtPayload,
  rolesFromPayload,
  writeSession,
  readSession,
} from '@/lib/auth/tokenStore';
import { getAccessTokenSync, isAuthenticated } from '@/lib/auth/oidc';

describe('OIDC / PKCE', () => {
  beforeEach(() => {
    clearSession();
    sessionStorage.clear();
  });

  it('gera verifier e challenge S256 distintos', async () => {
    const pair = await createPkcePair();
    expect(pair.verifier.length).toBeGreaterThan(20);
    expect(pair.challenge.length).toBeGreaterThan(20);
    expect(pair.challenge).not.toEqual(pair.verifier);
  });

  it('gera state URL-safe', () => {
    const state = randomState();
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('em mock mode OIDC não é obrigatório', () => {
    expect(isOidcRequired()).toBe(false);
  });

  it('persiste sessão e expõe token sync', () => {
    writeSession({
      accessToken: 'tok-lab',
      expiresAt: Date.now() + 60_000,
      username: 'platform',
      roles: ['PLATFORM'],
    });
    expect(readSession()?.username).toBe('platform');
    expect(getAccessTokenSync()).toBe('tok-lab');
    expect(isAuthenticated()).toBe(true);
  });

  it('decodifica roles do JWT (payload base64url)', () => {
    const payload = btoa(JSON.stringify({ preferred_username: 'platform', realm_access: { roles: ['PLATFORM'] } }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    const jwt = `hdr.${payload}.sig`;
    const decoded = decodeJwtPayload(jwt);
    expect(decoded?.preferred_username).toBe('platform');
    expect(rolesFromPayload(decoded)).toContain('PLATFORM');
  });
});
