import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Link2, Route as RouteIcon, Target, TrendingUp } from 'lucide-react';
import { EPICS } from '@/app/epics';
import { journeyItems, journeyPersona, journeysByEpic } from '@/app/journeys';
import type { EpicId } from '@/app/types';
import { Badge, Card, CardHeader, EmptyState, PageHeader } from '@/ds';
import { SectionWrapper } from '@/shell/SectionWrapper';

export function EpicLandingPage() {
  const { epicId } = useParams<{ epicId: string }>();
  const epic = EPICS.find((entry) => entry.id === epicId);

  if (!epic) {
    return (
      <SectionWrapper>
        <EmptyState
          title="Épico não encontrado"
          description="Use a navegação lateral ou Ctrl+K para localizar um dos seis épicos do programa."
        />
      </SectionWrapper>
    );
  }

  const journeys = journeysByEpic(epic.id as EpicId);
  const screens = journeys.reduce((total, journey) => total + journey.steps.length, 0);

  return (
    <SectionWrapper>
      <PageHeader
        usId={epic.code}
        title={epic.name}
        description={epic.summary}
        meta={[
          <Badge key="trilhas" tone="accent">
            {journeys.length} trilhas
          </Badge>,
          <Badge key="telas" tone="neutral">
            {screens} telas
          </Badge>,
        ]}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card accent="accent">
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-eqx-accent-text">
            <TrendingUp size={14} aria-hidden="true" />
            Resultado de negócio
          </p>
          <p className="text-sm">{epic.businessOutcome}</p>
        </Card>
        <Card accent="action">
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-eqx-action">
            <Link2 size={14} aria-hidden="true" />
            Lugar na história
          </p>
          <p className="text-sm">{epic.connectsTo}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {journeys.map((journey) => {
          const items = journeyItems(journey);
          const first = items[0];
          const persona = journeyPersona(journey);
          return (
            <Card key={journey.id} accent="action">
              <CardHeader
                eyebrow={`${persona.name} · ${persona.role}`}
                title={journey.title}
                description={
                  <span className="flex items-start gap-2">
                    <Target
                      size={15}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-eqx-accent-text"
                    />
                    {journey.goal}
                  </span>
                }
              />
              <ol className="mb-4 grid gap-1">
                {items.map((item, index) => (
                  <li key={item.href} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 w-4 shrink-0 font-mono text-xs text-eqx-text-muted">
                      {index + 1}
                    </span>
                    <Link
                      to={item.href}
                      className="text-eqx-text hover:text-eqx-action hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ol>
              {first ? (
                <Link
                  to={first.href}
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-eqx-action hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
                >
                  <RouteIcon size={16} aria-hidden="true" />
                  Percorrer a trilha
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
