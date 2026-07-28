import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import { Badge, Button, Card, KeyValueList, Notice, useToast } from '@/ds';
import {
  createLivenessSessionLive,
  LAB_CUSTOMER_ID,
  lastLivenessSession,
  mockBiometricConsent,
  mockLivenessSession,
  registerBiometricConsentLive,
  rememberLivenessSession,
  type LivenessSession,
} from '@/api/liveness';
import { isLiveMode } from '@/lib/config';
import { errorMessage } from '@/lib/useDataQuery';
import { HttpError } from '@/lib/httpClient';
import { formatDateTime } from '@/lib/format';

type Phase = 'consent' | 'session' | 'capture';

function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function LivenessCapturePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [accepted, setAccepted] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('consent');
  const [session, setSession] = useState<LivenessSession | null>(() => lastLivenessSession());
  const [ttl, setTtl] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.expiresAt) return;
    setTtl(secondsLeft(session.expiresAt));
    const id = window.setInterval(() => setTtl(secondsLeft(session.expiresAt)), 1000);
    return () => window.clearInterval(id);
  }, [session?.expiresAt]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(
        'Câmera indisponível neste ambiente. Lab segue sem Amplify — use “Concluir captura (lab)”.',
      );
    }
  }

  async function registerConsent() {
    if (!accepted) {
      toast.error('Consentimento', 'Aceite o termo biométrico v1.0 antes de continuar (RN006).');
      return;
    }
    setBusy(true);
    try {
      if (isLiveMode()) {
        await registerBiometricConsentLive({ customerId: LAB_CUSTOMER_ID });
      } else {
        mockBiometricConsent();
      }
      setConsentOk(true);
      setPhase('session');
      toast.success('Consentimento ACTIVE', 'POST /api/v1/auth/biometric-consent');
    } catch (error) {
      toast.error('Falha no consentimento', errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function createSession() {
    setBusy(true);
    try {
      const created = isLiveMode()
        ? await createLivenessSessionLive({ customerId: LAB_CUSTOMER_ID, channel: 'WEB_PORTAL' })
        : mockLivenessSession();
      setSession(created);
      setPhase('capture');
      toast.success(
        created.fromCache ? 'Sessão (cache)' : 'Sessão CREATED',
        `TTL ~3 min · ${created.sessionId.slice(0, 8)}…`,
      );
      await startCamera();
    } catch (error) {
      if (error instanceof HttpError && error.shape.status === 412) {
        toast.error('412 Pré-condição', 'Sem consentimento ACTIVE — registre o termo primeiro.');
        setConsentOk(false);
        setPhase('consent');
      } else if (error instanceof HttpError && error.shape.status === 429) {
        rememberLivenessSession({
          ...(session ?? mockLivenessSession()),
          outcome: 'lockout',
        });
        toast.error('429 Lockout', errorMessage(error));
        navigate('/titular/biometria/resultado');
      } else {
        toast.error('Falha na sessão', errorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }

  function finishCaptureLab() {
    if (!session) {
      toast.error('Sessão', 'Crie a sessão liveness antes de concluir.');
      return;
    }
    if (ttl === 0) {
      rememberLivenessSession({ ...session, outcome: 'expired', status: 'EXPIRED' });
      stopCamera();
      navigate('/titular/biometria/resultado');
      return;
    }
    rememberLivenessSession({ ...session, status: 'IN_PROGRESS' });
    stopCamera();
    navigate('/titular/biometria/mfa');
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F10-US-FE-01"
      title="Captura biométrica"
      description="Consentimento LGPD → sessão Liveness (lab stub/WireMock) → guia facial. Amplify AWS fora deste slice."
      actions={
        session ? (
          <Badge tone={ttl > 30 ? 'success' : ttl > 0 ? 'warning' : 'danger'}>
            TTL {ttl}s
          </Badge>
        ) : null
      }
    >
      <Notice tone="info" title="Lab Noah EP-05 F01 BIO">
        BE Java <code className="text-xs">:8080</code> · Flyway V51 ·{' '}
        <code className="text-xs">LIVENESS_MODE=http|stub</code>. Sem FaceLivenessDetector Amplify —
        UI avança com <code className="text-xs">session_id</code> mock.
      </Notice>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-eqx-accent" aria-hidden />
            <h2 className="text-lg font-semibold text-eqx-text">1. Consentimento biométrico</h2>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-eqx-text">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={consentOk}
            />
            <span>
              Autorizo o tratamento biométrico facial (termo <strong>v1.0</strong>) para prova de
              vivacidade neste canal WEB_PORTAL, conforme RN006.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={busy || consentOk || !accepted}
              onClick={() => void registerConsent()}
            >
              {consentOk ? 'Consentimento ACTIVE' : 'Registrar consentimento'}
            </Button>
            {consentOk ? <Badge tone="success">ACTIVE</Badge> : null}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-eqx-accent" aria-hidden />
            <h2 className="text-lg font-semibold text-eqx-text">2. Sessão Liveness</h2>
          </div>
          <p className="mb-4 text-sm text-eqx-text-muted">
            Customer lab <code className="text-xs">{LAB_CUSTOMER_ID}</code>
          </p>
          <Button
            variant="secondary"
            disabled={busy || (!consentOk && phase === 'consent')}
            onClick={() => void createSession()}
          >
            Criar sessão
          </Button>
          {session ? (
            <div className="mt-4">
              <KeyValueList
                items={[
                  { label: 'session_id', value: session.sessionId },
                  { label: 'status', value: session.status },
                  { label: 'expires_at', value: formatDateTime(session.expiresAt) },
                  { label: 'from_cache', value: session.fromCache ? 'sim' : 'não' },
                ]}
              />
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-eqx-text">3. Guia facial (SCR-BIO-01)</h2>
        <p className="mb-4 text-sm text-eqx-text-muted">
          Centralize o rosto no oval. Lab não chama Rekognition GetResults — só prova o fluxo de
          sessão.
        </p>
        <div className="relative mx-auto aspect-[4/3] max-w-lg overflow-hidden rounded-xl bg-eqx-surface-subtle">
          <video
            ref={videoRef}
            className="h-full w-full object-cover scale-x-[-1]"
            playsInline
            muted
            aria-label="Pré-visualização da câmera"
          />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-[70%] w-[55%] rounded-[50%] border-2 border-eqx-accent shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
          </div>
        </div>
        {cameraError ? (
          <Notice className="mt-4" tone="warning" title="Câmera">
            {cameraError}
          </Notice>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!session} onClick={() => void startCamera()}>
            Reabrir câmera
          </Button>
          <Button variant="primary" disabled={!session || busy} onClick={finishCaptureLab}>
            Concluir captura (lab) → MFA
          </Button>
        </div>
      </Card>
    </ScreenLayout>
  );
}
