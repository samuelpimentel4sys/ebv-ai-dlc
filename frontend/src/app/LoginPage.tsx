import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Shield } from 'lucide-react';
import { PrismaLogo } from '@/shell/PrismaLogo';
import { Badge, Button, Notice, TextField } from '@/ds';
import { useAuth } from '@/lib/auth/AuthContext';
import { isOidcRequired } from '@/lib/auth/oidcConfig';

export function LoginPage() {
  const { authenticated, loginWithPassword, loginWithSso } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ||
    new URLSearchParams(location.search).get('returnTo') ||
    '/';

  useEffect(() => {
    const err = new URLSearchParams(location.search).get('error');
    if (err) setError(err);
  }, [location.search]);

  if (!isOidcRequired()) {
    return <Navigate to="/" replace />;
  }

  if (authenticated) {
    return <Navigate to={returnTo} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginWithPassword(username, password);
      navigate(returnTo, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha no login');
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-eqx-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgb(var(--eqx-blue-100) / 0.9), transparent),' +
            'radial-gradient(ellipse 60% 40% at 90% 20%, rgb(var(--eqx-orange-100) / 0.55), transparent),' +
            'linear-gradient(180deg, rgb(var(--eqx-gray-50)), rgb(var(--eqx-white)))',
        }}
        aria-hidden="true"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <PrismaLogo size={32} />
        <Badge tone="neutral" className="font-mono text-xs">
          Sessão segura
        </Badge>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-eqx-action">
          Acesso seguro
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-eqx-text sm:text-4xl">Prisma</h1>
        <p className="mb-8 text-base text-eqx-text-muted">
          Entre com suas credenciais Equifax. A autenticação é validada no Keycloak — a experiência
          fica nesta tela.
        </p>

        {error ? (
          <Notice tone="danger" className="mb-6" title="Não foi possível entrar">
            {error}
          </Notice>
        ) : null}

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          <TextField
            label="Usuário"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="platform"
          />
          <TextField
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={busy}
            icon={<LogIn size={18} aria-hidden="true" />}
          >
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-eqx-text-muted">
          Precisa de SSO institucional?{' '}
          <button
            type="button"
            className="font-semibold text-eqx-action underline-offset-2 hover:underline"
            onClick={() => {
              void loginWithSso(returnTo);
            }}
          >
            Continuar no provedor
          </button>
        </p>

        <div className="mt-8 grid gap-3 rounded-sm border border-eqx-border bg-eqx-surface p-4 text-sm text-eqx-text-muted">
          <p className="flex items-start gap-2 font-semibold text-eqx-text">
            <Shield size={16} className="mt-0.5 shrink-0 text-eqx-action" aria-hidden="true" />
            Lab local
          </p>
          <p>
            Usuários: <code>platform</code>, <code>analista</code>, <code>titular</code> · senha{' '}
            <code>prisma</code>
          </p>
        </div>
      </main>
    </div>
  );
}
