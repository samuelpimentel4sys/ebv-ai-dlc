import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, Upload } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  KeyValueList,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  Stepper,
  TextField,
} from '@/ds';
import { fetchDisputeTrackingLive } from '@/api/dispute';
import { useDataQuery } from '@/lib/useDataQuery';
import { formatDateTime, relativeFromNow } from '@/lib/format';
import { MARIA } from '@/app/story';
import { stageLabel, stageOrder, tracking } from '@/epics/contestacao/data';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

const SLA_TOTAL_HOURS = 120;

export function DisputeTrackingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const routeProtocol = params.protocolo ?? MARIA.disputeProtocol;
  // Chegar pela URL (trilha ou link do portal) já é autenticação suficiente
  // para a demo: o gate de CPF só aparece quando a pessoa digita a rota raiz
  // sem protocolo, como um titular faria no dia a dia.
  const arrivedWithProtocol = Boolean(params.protocolo);

  const [protocol, setProtocol] = useState(routeProtocol);
  const [documento, setDocumento] = useState(
    arrivedWithProtocol ? MARIA.document : '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = useState(arrivedWithProtocol);
  const formRef = useRef<HTMLDivElement>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  const activeProtocol = unlocked ? (params.protocolo ?? protocol.trim()) : routeProtocol;
  const confirmDocumento = documento.replace(/\D/g, '').slice(-2) || '01';

  const query = useDataQuery(
    () => ({
      ...tracking,
      protocol: activeProtocol,
      // O mock cita o protocolo dentro do texto dos eventos; a troca mantém a
      // linha do tempo coerente com o protocolo que veio da URL.
      timeline: tracking.timeline.map((event) => ({
        ...event,
        detail: event.detail.replace(MARIA.disputeProtocol, activeProtocol),
      })),
    }),
    () => fetchDisputeTrackingLive(activeProtocol, confirmDocumento),
    { latency: 340, enabled: unlocked, deps: [activeProtocol, confirmDocumento] },
  );

  useEffect(() => {
    setProtocol(routeProtocol);
    if (params.protocolo) {
      setUnlocked(true);
      setDocumento((current) => (current ? current : MARIA.document));
    }
  }, [routeProtocol, params.protocolo]);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(formRef.current);
  }, [focusNonce]);

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function consult() {
    const found: Record<string, string> = {};
    if (protocol.trim().length < 6) {
      found.protocol = 'Informe o protocolo completo, no formato CT-2026-000000.';
    }
    if (documento.replace(/\D/g, '').length !== 11) {
      found.documento = 'Informe os 11 números do CPF, sem pontos ou traço.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusNonce((value) => value + 1);
      return;
    }
    setUnlocked(true);
    if (!params.protocolo && protocol.trim().length >= 6) {
      navigate(`/titular/contestacoes/${protocol.trim()}`);
    }
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F01-US-FE-01"
      title="Acompanhamento da contestação"
      description="Consulta pública por protocolo e documento, com etapa atual da contestação, prazo restante, histórico completo e indicação clara da próxima ação esperada do titular."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          {routeProtocol}
        </Badge>,
      ]}
    >
      <div className="grid gap-5">
        {!unlocked ? (
          <Card accent="brand" className="mx-auto w-full max-w-xl">
            <CardHeader
              eyebrow="acesso"
              title="Consultar minha contestação"
              description="Informe o protocolo recebido e o documento do titular."
            />
            <div className="grid gap-4" ref={formRef}>
              <TextField
                label="Número do protocolo"
                required
                placeholder={MARIA.disputeProtocol}
                value={protocol}
                error={errors.protocol}
                onChange={(event) => {
                  setProtocol(event.target.value);
                  clearError('protocol');
                }}
              />
              <TextField
                label="CPF do titular"
                required
                inputMode="numeric"
                placeholder="somente números"
                value={documento}
                error={errors.documento}
                hint="Usamos o CPF apenas para confirmar que a contestação é sua."
                onChange={(event) => {
                  setDocumento(event.target.value);
                  clearError('documento');
                }}
              />
              <Button icon={<Search size={16} aria-hidden="true" />} onClick={consult}>
                Consultar
              </Button>
              <Notice tone="info" title="Sem cadastro necessário">
                A consulta por protocolo não exige login. Dados sensíveis aparecem mascarados.
              </Notice>
            </div>
          </Card>
        ) : (
          <QueryBoundary
            query={query}
            loadingRows={5}
            empty={{
              title: 'Não encontramos essa contestação.',
              description: `Nenhum caso aberto aparece com o protocolo ${routeProtocol}. Confira o número no e-mail de confirmação: ele começa com CT e tem o ano no meio. Se o número estiver certo, abra uma nova contestação a partir do registro no portal — nada do que você já enviou é perdido.`,
              action: (
                <Button variant="secondary" onClick={() => setUnlocked(false)}>
                  Conferir o protocolo
                </Button>
              ),
            }}
          >
            {(dispute) => {
              const stageIndex = stageOrder.indexOf(dispute.stage);
              const hoursLeft = Math.max(
                (new Date(dispute.slaDueAt).getTime() - Date.now()) / 3_600_000,
                0,
              );
              return (
                <div className="grid gap-5">
                  <Notice
                    tone={hoursLeft < 24 ? 'warning' : 'info'}
                    title={`Prazo de resposta: ${relativeFromNow(dispute.slaDueAt)}`}
                  >
                    Protocolo <strong>{dispute.protocol}</strong> · titular {dispute.documento} ·
                    aberto em {formatDateTime(dispute.openedAt)}.
                  </Notice>

                  <Stepper
                    currentIndex={stageIndex}
                    steps={stageOrder.map((stage) => ({
                      id: stage,
                      label: stageLabel[stage],
                      description: stage === dispute.stage ? 'etapa atual' : undefined,
                    }))}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Metric
                      value={stageLabel[dispute.stage]}
                      label="Situação atual"
                      tone="action"
                    />
                    <Metric
                      value={`${Math.round(hoursLeft)} h`}
                      label="Tempo restante"
                      tone={hoursLeft < 24 ? 'danger' : 'success'}
                      hint={`prazo total de ${SLA_TOTAL_HOURS} h`}
                    />
                    <Metric value={dispute.timeline.length} label="Eventos registrados" />
                  </div>

                  <ProgressBar
                    label="Consumo do prazo legal"
                    value={((SLA_TOTAL_HOURS - hoursLeft) / SLA_TOTAL_HOURS) * 100}
                    tone={hoursLeft < 24 ? 'danger' : 'success'}
                  />

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    {dispute.nextAction ? (
                      <Card accent="warning">
                        <CardHeader
                          eyebrow="ação necessária"
                          title={dispute.nextAction.title}
                          description={`Prazo: ${formatDateTime(dispute.nextAction.dueAt)}`}
                        />
                        <p className="text-sm">{dispute.nextAction.description}</p>
                        <div className="mt-4">
                          <Button
                            icon={<Upload size={16} aria-hidden="true" />}
                            onClick={() => navigate(`/disputas/${dispute.protocol}/evidencias`)}
                          >
                            Enviar documento
                          </Button>
                        </div>
                      </Card>
                    ) : null}

                    <Card>
                      <CardHeader
                        eyebrow="objeto da contestação"
                        title="O que está sendo analisado"
                      />
                      <p className="text-sm">{dispute.subject}</p>
                      <KeyValueList
                        className="mt-4"
                        items={[
                          {
                            label: 'Protocolo',
                            value: <code className="text-xs">{dispute.protocol}</code>,
                          },
                          {
                            label: 'Aberto em',
                            value: formatDateTime(dispute.openedAt),
                          },
                          {
                            label: 'Prazo final',
                            value: formatDateTime(dispute.slaDueAt),
                          },
                          { label: 'Etapa', value: stageLabel[dispute.stage] },
                        ]}
                      />
                      <div className="mt-4">
                        <Link
                          to={`/disputas/${dispute.protocol}/evidencias`}
                          className={buttonClass('secondary', 'sm')}
                        >
                          Ver documentos do caso
                        </Link>
                      </div>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader
                      eyebrow="histórico"
                      title="Linha do tempo da contestação"
                      description="GET /api/v1/disputes/{protocol}/timeline"
                    />
                    <ol className="grid gap-4 border-l border-eqx-border pl-5">
                      {dispute.timeline.map((event) => (
                        <li key={event.at} className="relative">
                          <span
                            aria-hidden="true"
                            className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-pill bg-eqx-action"
                          />
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">{stageLabel[event.stage]}</Badge>
                            <span className="text-xs text-eqx-text-muted">
                              {formatDateTime(event.at)} · {event.actor}
                            </span>
                          </div>
                          <p className="text-sm font-semibold">{event.title}</p>
                          <p className="text-sm text-eqx-text-muted">{event.detail}</p>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </div>
              );
            }}
          </QueryBoundary>
        )}
      </div>
    </ScreenLayout>
  );
}
