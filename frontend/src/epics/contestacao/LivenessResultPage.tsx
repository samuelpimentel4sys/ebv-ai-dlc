import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, TimerOff } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import { Badge, Button, Card, KeyValueList, Metric, Notice } from '@/ds';
import { lastLivenessSession } from '@/api/liveness';
import { formatDateTime } from '@/lib/format';

export function LivenessResultPage() {
  const navigate = useNavigate();
  const session = lastLivenessSession();
  const outcome = session?.outcome ?? (session ? 'success' : null);

  const tone =
    outcome === 'success'
      ? 'success'
      : outcome === 'lockout' || outcome === 'failed'
        ? 'danger'
        : outcome === 'expired'
          ? 'warning'
          : 'neutral';

  const Icon =
    outcome === 'success' ? CheckCircle2 : outcome === 'expired' ? TimerOff : ShieldAlert;

  const title =
    outcome === 'success'
      ? 'Identidade verificada'
      : outcome === 'failed'
        ? 'Vivacidade insuficiente'
        : outcome === 'lockout'
          ? 'Bloqueio biométrico'
          : outcome === 'expired'
            ? 'Sessão expirada'
            : 'Sem sessão';

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F12-US-FE-01"
      title="Resultado da biometria"
      description="Feedback de vivacidade e próximo passo (SCR-BIO-02). Scoring real / JWT IAL3 fora do slice Noah."
      actions={outcome ? <Badge tone={tone}>{outcome}</Badge> : null}
    >
      {!session ? (
        <Notice tone="warning" title="Nenhuma sessão em memória">
          Volte à captura para registrar consentimento e criar a sessão Liveness.
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/titular/biometria')}>
              Ir para captura
            </Button>
          </div>
        </Notice>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${tone === 'success' ? 'text-eqx-success' : 'text-eqx-danger'}`} aria-hidden />
              <div>
                <h2 className="text-xl font-semibold text-eqx-text">{title}</h2>
                <p className="text-sm text-eqx-text-muted">
                  {outcome === 'success'
                    ? 'Lab liberou o fluxo titular. Em prod, Amplify + GetFaceLivenessSessionResults fecham o score.'
                    : outcome === 'lockout'
                      ? 'HTTP 429 do BE — aguarde a janela de desbloqueio antes de nova tentativa.'
                      : outcome === 'expired'
                        ? 'TTL de 3 minutos esgotado. Crie uma nova sessão.'
                        : 'Tente novamente ou use outro canal de autenticação.'}
                </p>
              </div>
            </div>
            <KeyValueList
              items={[
                { label: 'session_id', value: session.sessionId },
                { label: 'customer_id', value: session.customerId },
                { label: 'status', value: session.status },
                { label: 'created_at', value: formatDateTime(session.createdAt) },
                { label: 'expires_at', value: formatDateTime(session.expiresAt) },
              ]}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate('/titular/biometria')}>
                Nova captura
              </Button>
              {outcome === 'success' ? (
                <Button variant="primary" onClick={() => navigate('/titular/registros')}>
                  Seguir ao portal do titular
                </Button>
              ) : null}
            </div>
          </Card>
          <Card>
            <Metric
              label="Score vivacidade (lab)"
              value={session.score != null ? String(session.score) : '—'}
              hint="Mock FE até BE expor GetResults"
            />
            <Notice className="mt-4" tone="info" title="Fora do slice">
              GetFaceLivenessSessionResults · scoring oficial · JWT IAL3.
            </Notice>
          </Card>
        </div>
      )}
    </ScreenLayout>
  );
}
