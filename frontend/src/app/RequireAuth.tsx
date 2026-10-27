import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isOidcRequired } from '@/lib/auth/oidcConfig';
import { useAuth } from '@/lib/auth/AuthContext';

/** Protege o shell do produto quando OIDC é obrigatório (live). */
export function RequireAuth() {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!isOidcRequired()) {
    return <Outlet />;
  }

  if (!authenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  return <Outlet />;
}
