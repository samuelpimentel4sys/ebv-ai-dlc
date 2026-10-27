import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  beginLogin,
  currentSession,
  isAuthenticated,
  loginWithPassword,
  logout as oidcLogout,
} from '@/lib/auth/oidc';
import type { OidcSession } from '@/lib/auth/tokenStore';

interface AuthContextValue {
  session: OidcSession | null;
  authenticated: boolean;
  /** Form Prisma → Keycloak (password grant). */
  loginWithPassword: (username: string, password: string) => Promise<void>;
  /** SSO opcional (redirect Keycloak + PKCE). */
  loginWithSso: (returnTo?: string) => Promise<void>;
  logout: () => void;
  refreshLocal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const session = useMemo(() => {
    void tick;
    return currentSession();
  }, [tick]);

  const refreshLocal = useCallback(() => setTick((n) => n + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      authenticated: isAuthenticated(),
      loginWithPassword: async (username, password) => {
        await loginWithPassword(username, password);
        refreshLocal();
      },
      loginWithSso: (returnTo?: string) => beginLogin(returnTo),
      logout: () => oidcLogout(true),
      refreshLocal,
    }),
    [session, refreshLocal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
