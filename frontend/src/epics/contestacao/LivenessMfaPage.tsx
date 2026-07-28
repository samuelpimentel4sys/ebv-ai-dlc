import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import { Button, Card, Notice, TextField, useToast } from '@/ds';
import { lastLivenessSession, rememberLivenessSession } from '@/api/liveness';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

/** MFA step-up pós-liveness (SCR-BIO / US-FE-02). Lab: OTP mock. */
export function LivenessMfaPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const session = lastLivenessSession();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [focusNonce, setFocusNonce] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(formRef.current);
  }, [focusNonce]);

  if (!session?.sessionId) {
    return (
      <ScreenLayout
        usId="PRISMA-EP-05-F11-US-FE-01"
        title="MFA step-up"
        description="Segundo fator após a sessão Liveness — reforço IAL antes de liberar o canal sensível."
      >
        <Notice tone="warning" title="Sessão ausente">
          Inicie a captura biométrica antes do MFA.
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/titular/biometria')}>
              Ir para captura
            </Button>
          </div>
        </Notice>
      </ScreenLayout>
    );
  }

  function confirm() {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Informe o código de 6 dígitos enviado ao canal cadastrado.');
      setFocusNonce((n) => n + 1);
      return;
    }
    setBusy(true);
    // Lab: qualquer 6 dígitos valida; score mock até GetResults existir no BE.
    const score = otp.trim() === '000000' ? 42 : 92;
    const outcome = score >= 80 ? 'success' : 'failed';
    if (session) {
      rememberLivenessSession({
        ...session,
        status: outcome === 'success' ? 'SUCCEEDED' : 'FAILED',
        score,
        outcome,
      });
    }
    toast.success(
      outcome === 'success' ? 'MFA OK' : 'Vivacidade baixa',
      `Score lab ${score} · Amplify/GetResults fora do slice`,
    );
    setBusy(false);
    navigate('/titular/biometria/resultado');
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F11-US-FE-01"
      title="MFA step-up"
      description="Segundo fator após a sessão Liveness — reforço IAL antes de liberar o canal sensível."
    >
      <Notice tone="info" title="Lab">
        OTP simulado. Use qualquer código de 6 dígitos; <code className="text-xs">000000</code>{' '}
        força falha de vivacidade (score &lt; 80).
      </Notice>

      <Card className="mt-6 max-w-md">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-eqx-accent" aria-hidden />
          <h2 className="text-lg font-semibold text-eqx-text">Código de verificação</h2>
        </div>
        <div ref={formRef}>
          <TextField
            label="OTP"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            error={error}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError(undefined);
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/titular/biometria')}>
            Voltar à captura
          </Button>
          <Button variant="primary" disabled={busy} onClick={confirm}>
            Confirmar MFA
          </Button>
        </div>
      </Card>
    </ScreenLayout>
  );
}
