import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { completeLogin } from '@/lib/auth/oidc';
import { useAuth } from '@/lib/auth/AuthContext';
import { isOidcRequired } from '@/lib/auth/oidcConfig';
import { PrismaLogo } from '@/shell/PrismaLogo';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshLocal } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = params.get('error');
    if (oauthError) {
      setError(params.get('error_description') || oauthError);
      return;
    }

    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      setError('Callback sem code/state.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const returnTo = await completeLogin(code, state);
        if (cancelled) return;
        refreshLocal();
        navigate(returnTo || '/', { replace: true });
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Falha no callback OIDC');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, navigate, refreshLocal]);

  if (!isOidcRequired()) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return <Navigate to={`/login?error=${encodeURIComponent(error)}`} replace />;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-eqx-bg px-6">
      <PrismaLogo size={36} />
      <p className="text-sm text-eqx-text-muted" role="status">
        Validando sessão com Keycloak…
      </p>
    </div>
  );
}
