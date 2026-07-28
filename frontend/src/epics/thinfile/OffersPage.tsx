import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ShoppingBag, XCircle } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  Drawer,
  KeyValueList,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  SelectField,
  useToast,
} from '@/ds';
import { applyOfferLive, fetchOffersLive } from '@/api/inclusion';
import { isLiveMode } from '@/lib/config';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { achievements, offers, type Achievement, type Offer } from '@/epics/thinfile/data';

const categoryLabel: Record<Offer['category'], string> = {
  cartao: 'Cartão',
  emprestimo: 'Empréstimo',
  conta: 'Conta digital',
  seguro: 'Seguro',
};

const ALL = 'todas';

function filterOffers(list: Offer[], visibility: string) {
  return list.filter((offer) =>
    visibility === ALL ? true : visibility === 'elegiveis' ? offer.eligible : !offer.eligible,
  );
}

function latestUnlocked(list: Achievement[]) {
  return [...list]
    .filter((item) => item.unlockedAt)
    .sort((a, b) => (a.unlockedAt ?? '').localeCompare(b.unlockedAt ?? ''))
    .at(-1);
}

export function OffersPage() {
  const toast = useToast();
  const [visibility, setVisibility] = useState(ALL);
  const [detail, setDetail] = useState<Offer | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const query = useDataQuery(
    () => ({
      offers: filterOffers(offers, visibility),
      achievements,
    }),
    async () => {
      const data = await fetchOffersLive();
      return {
        offers: filterOffers(data.offers, visibility),
        achievements: data.achievements,
      };
    },
    {
      latency: 360,
      deps: [visibility],
      isEmpty: (data) => data.offers.length === 0,
    },
  );

  function apply(offer: Offer) {
    void (async () => {
      try {
        if (isLiveMode()) {
          await applyOfferLive({ offerId: offer.offerId });
        }
        setApplied((current) => [...current, offer.offerId]);
        toast.success(
          'Solicitação enviada ao parceiro',
          `POST /api/v1/marketplace/offers/${offer.offerId}/apply`,
        );
        setDetail(null);
      } catch (error) {
        toast.error('Falha ao enviar solicitação', errorMessage(error));
      }
    })();
  }

  const unlockedBy = latestUnlocked(query.data?.achievements ?? achievements);

  return (
    <ScreenLayout
      usId="PRISMA-EP-06-F07-US-FE-01"
      title="Vitrine de ofertas elegíveis"
      description="Marketplace com transparência de elegibilidade: cada oferta mostra por que o titular se qualifica ou não, os requisitos pendentes e a confirmação explícita antes de enviar dados ao parceiro."
      meta={[
        <Badge key="epic" tone="accent">
          EP-06 · Coach B2C
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /marketplace/ofertas
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Notice tone="info" title="Ofertas dependem do seu consentimento">
          Só exibimos ofertas porque a permissão de ofertas personalizadas está ativa. Nenhum dado é
          enviado ao parceiro antes da sua confirmação.{' '}
          <Link to="/titular/privacidade" className="underline">
            Revisar minhas permissões
          </Link>
          .
        </Notice>

        <Card>
          <div className="max-w-xs">
            <SelectField
              label="Mostrar"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              options={[
                { value: ALL, label: 'Todas as ofertas' },
                { value: 'elegiveis', label: 'Só as elegíveis' },
                { value: 'pendentes', label: 'Só as com requisitos pendentes' },
              ]}
            />
          </div>
        </Card>

        <QueryBoundary
          query={query}
          loadingRows={5}
          empty={{
            title: 'Nenhuma oferta disponível para você neste momento.',
            description:
              'Os parceiros não têm produto compatível com o seu perfil agora — isso muda conforme seu histórico evolui. As missões do coach atuam justamente nos fatores que hoje bloqueiam as ofertas.',
            action: (
              <Link to="/coach/missoes" className={buttonClass('secondary', 'sm')}>
                Ver missões do coach
              </Link>
            ),
          }}
          noResults={{
            active: visibility !== ALL,
            description:
              'Nenhuma oferta se encaixa nesse recorte agora. Volte para todas as ofertas para ver a vitrine completa.',
            onClear: () => setVisibility(ALL),
          }}
        >
          {(data) => {
            const list = data.offers;
            const eligible = list.filter((offer) => offer.eligible);

            return (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric
                    value={eligible.length}
                    label="Ofertas elegíveis"
                    tone="success"
                    icon={<ShoppingBag size={18} aria-hidden="true" />}
                  />
                  <Metric
                    value={list.length - eligible.length}
                    label="Ainda não elegíveis"
                    hint="com requisitos explicados"
                  />
                  <Metric value={applied.length} label="Solicitações enviadas" tone="action" />
                </div>

                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((offer) => (
                    <li key={offer.offerId}>
                      <Card
                        accent={offer.eligible ? 'success' : 'none'}
                        interactive
                        className="flex h-full flex-col"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">{categoryLabel[offer.category]}</Badge>
                          <Badge tone={offer.eligible ? 'success' : 'warning'}>
                            {offer.eligible ? 'elegível' : 'requisitos pendentes'}
                          </Badge>
                        </div>
                        <h3 className="mt-3 text-base">{offer.product}</h3>
                        <p className="text-xs text-eqx-text-muted">{offer.partner}</p>
                        <p className="mt-2 text-sm">{offer.highlight}</p>
                        <dl className="mt-3 grid gap-1 text-sm">
                          <div className="flex justify-between gap-2">
                            <dt className="text-eqx-text-muted">Valor</dt>
                            <dd className="font-semibold">{offer.amountLabel}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-eqx-text-muted">Custo</dt>
                            <dd className="font-semibold">{offer.rateLabel}</dd>
                          </div>
                        </dl>
                        <div className="mt-3">
                          <ProgressBar
                            label="Compatibilidade com seu perfil"
                            value={offer.eligibilityScore}
                            tone={
                              offer.eligibilityScore >= 70
                                ? 'success'
                                : offer.eligibilityScore >= 50
                                  ? 'warning'
                                  : 'danger'
                            }
                          />
                        </div>
                        {offer.eligible && unlockedBy ? (
                          <p className="mt-3 flex items-start gap-2 text-xs text-eqx-text-muted">
                            <Award size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <span>
                              Destravada pela conquista <strong>{unlockedBy.title}</strong> —{' '}
                              {unlockedBy.description.toLowerCase()}
                            </span>
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={offer.eligible ? 'primary' : 'secondary'}
                            onClick={() => setDetail(offer)}
                            disabled={applied.includes(offer.offerId)}
                          >
                            {applied.includes(offer.offerId)
                              ? 'Solicitação enviada'
                              : offer.ctaLabel}
                          </Button>
                          {offer.eligible ? (
                            <Link to="/coach/jornada" className={buttonClass('ghost', 'sm')}>
                              Ver conquista
                            </Link>
                          ) : (
                            <Link to="/coach/missoes" className={buttonClass('ghost', 'sm')}>
                              Como me qualificar
                            </Link>
                          )}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }}
        </QueryBoundary>
      </div>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.product ?? ''}
        description={detail ? `Oferta de ${detail.partner}` : undefined}
        footer={
          detail?.eligible ? (
            <Button onClick={() => detail && apply(detail)}>Confirmar e enviar meus dados</Button>
          ) : (
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Entendi
            </Button>
          )
        }
      >
        {detail ? (
          <div className="grid gap-5">
            <KeyValueList
              items={[
                { label: 'Categoria', value: categoryLabel[detail.category] },
                { label: 'Valor', value: detail.amountLabel },
                { label: 'Custo', value: detail.rateLabel },
                {
                  label: 'Compatibilidade',
                  value: `${detail.eligibilityScore}/100`,
                },
              ]}
            />

            <section>
              <h3 className="mb-2 text-base">Por que você vê esta oferta</h3>
              <ul className="grid gap-2 text-sm">
                {detail.reasons.map((reason) => (
                  <li key={reason.label} className="flex items-start gap-2">
                    {reason.positive ? (
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-eqx-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-eqx-danger"
                        aria-hidden="true"
                      />
                    )}
                    {reason.label}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-base">Requisitos do parceiro</h3>
              <ul className="grid gap-2 text-sm text-eqx-text-muted">
                {detail.requirements.map((requirement) => (
                  <li key={requirement}>· {requirement}</li>
                ))}
              </ul>
            </section>

            {detail.eligible ? (
              <>
                {unlockedBy ? (
                  <Notice tone="success" title={`Conquista que destravou: ${unlockedBy.title}`}>
                    {unlockedBy.description} É esse marco da sua jornada que colocou esta oferta na
                    vitrine.
                  </Notice>
                ) : null}
                <Notice tone="warning" title="O que será compartilhado">
                  Enviaremos ao parceiro seu nome, CPF e faixa de score. O parceiro é responsável
                  pela análise final e pode solicitar documentos adicionais.
                </Notice>
              </>
            ) : (
              <Notice tone="info" title="Como se qualificar">
                <p>
                  Cumpra os requisitos acima e refaça a consulta. As missões do coach atuam nos
                  fatores que hoje bloqueiam esta oferta.
                </p>
                <div className="mt-3">
                  <Link to="/coach/missoes" className={buttonClass('secondary', 'sm')}>
                    Abrir catálogo de missões
                  </Link>
                </div>
              </Notice>
            )}
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}
