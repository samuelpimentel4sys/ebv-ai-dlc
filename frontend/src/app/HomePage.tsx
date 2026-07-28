import { Link } from 'react-router-dom';
import { ArrowRight, Command, PlayCircle, Route as RouteIcon, Users } from 'lucide-react';
import { EPICS } from '@/app/epics';
import { JOURNEYS, journeyPersona, journeysByEpic } from '@/app/journeys';
import { AURORA, MARIA } from '@/app/story';
import { Badge, buttonClass, Card, CardHeader, Notice, PageHeader } from '@/ds';
import { SectionWrapper } from '@/shell/SectionWrapper';

const ACCENTS = ['action', 'accent', 'brand', 'success', 'warning', 'action'] as const;

export function HomePage() {
  return (
    <SectionWrapper>
      <PageHeader
        title="EBV Prisma Showcase"
        description="Seis épicos apresentados como trilhas por persona: você percorre a jornada de ponta a ponta em vez de abrir telas isoladas."
        meta={[
          <Badge key="epics" tone="accent">
            6 épicos
          </Badge>,
          <Badge key="journeys" tone="info">
            {JOURNEYS.length} trilhas
          </Badge>,
          <Badge key="screens" tone="neutral">
            56 telas
          </Badge>,
        ]}
        actions={
          <Link to="/roteiro" className={buttonClass('primary')}>
            <PlayCircle size={16} aria-hidden="true" />
            Roteiro de 60 minutos
          </Link>
        }
      />

      {/* A plateia precisa saber de quem é a história antes de ver a primeira
          tela; sem isso os seis épicos parecem seis produtos sem relação. */}
      <Notice tone="info" className="mb-6" title="Duas histórias atravessam os seis épicos">
        <span className="block">
          <strong>{MARIA.name}</strong> ({MARIA.documentMasked}) tem score {MARIA.score} e crédito
          recusado. O EP-01 produz a decisão, o EP-02 explica, o EP-05 corrige o apontamento indevido
          e o EP-06 devolve elegibilidade.
        </span>
        <span className="mt-2 block">
          <strong>{AURORA.name}</strong> ({AURORA.documentMasked}) é o cliente PJ analisado no EP-03
          e reaparece no EP-04 como o nó que propaga risco na carteira.
        </span>
      </Notice>

      <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-eqx-text-muted">
        <Command size={15} aria-hidden="true" />
        Pressione
        <kbd className="rounded-sm border border-eqx-border px-1 font-mono text-xs">Ctrl K</kbd>
        para buscar qualquer tela pelo nome, rota ou User Story.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EPICS.map((epic, index) => {
          const journeys = journeysByEpic(epic.id);
          const screens = journeys.reduce((total, journey) => total + journey.steps.length, 0);
          return (
            <Card key={epic.id} accent={ACCENTS[index % ACCENTS.length]} interactive>
              <CardHeader eyebrow={epic.id} title={epic.shortName} description={epic.summary} />

              <p className="mb-4 border-l-2 border-l-eqx-accent-text pl-3 text-sm">
                {epic.businessOutcome}
              </p>

              <ul className="mb-4 grid gap-1.5">
                {journeys.map((journey) => (
                  <li key={journey.id} className="flex items-start gap-2 text-sm">
                    <RouteIcon
                      size={14}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-eqx-text-muted"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{journey.title}</span>
                      <span className="block text-xs text-eqx-text-muted">
                        {journeyPersona(journey).name} · {journey.steps.length} passos
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-xs text-eqx-text-muted">
                {screens} telas · {epic.code}
              </p>
              <Link
                to={`/epicos/${epic.id}`}
                className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-eqx-action hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
              >
                Ver trilhas de {epic.shortName}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-2xl">Quem conduz cada trilha</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {JOURNEYS.map((journey) => {
          const persona = journeyPersona(journey);
          return (
            <Link
              key={journey.id}
              to={journey.steps[0]}
              className="flex min-h-[4rem] items-start gap-3 rounded-md border border-eqx-border bg-eqx-surface p-4 text-sm transition-colors duration-fast hover:border-eqx-action hover:bg-eqx-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
            >
              <Users size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-eqx-text-muted" />
              <span className="min-w-0">
                <span className="block font-semibold">{persona.name}</span>
                <span className="block text-xs text-eqx-text-muted">{persona.role}</span>
                <span className="mt-1 block text-xs">{journey.title}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
