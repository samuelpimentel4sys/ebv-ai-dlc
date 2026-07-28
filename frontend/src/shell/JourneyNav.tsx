import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, Route as RouteIcon } from 'lucide-react';
import type { JourneyPosition } from '@/app/journeys';
import { journeysByEpic } from '@/app/journeys';
import { epicById } from '@/app/epics';
import { Badge } from '@/ds/Badge';
import { buttonClass } from '@/ds/Button';

const cardLink =
  'group flex min-h-target flex-1 items-center gap-3 rounded-md border border-eqx-border bg-eqx-surface ' +
  'px-3 py-2 text-sm transition-colors duration-fast hover:border-eqx-action hover:bg-eqx-surface-subtle ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus';

/**
 * Rodapé de continuidade compacto: posição na trilha + um passo, sem repetir
 * o cargo da persona (já está no title) nem empilhar um quarto bloco de cromo.
 */
export function JourneyNav({ position }: { position: JourneyPosition }) {
  const { journey, persona, index, total, previous, next } = position;
  const epic = epicById(journey.epic);
  const siblings = journeysByEpic(journey.epic).filter((entry) => entry.id !== journey.id);

  return (
    <nav
      aria-label="Próximo passo da jornada"
      className="mt-6 border-t border-eqx-border pt-4"
      title={`${persona.name} · ${persona.role}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <RouteIcon size={14} aria-hidden="true" className="text-eqx-accent-text" />
        <span className="font-semibold">{journey.title}</span>
        <Badge tone="neutral">
          {index + 1}/{total}
        </Badge>
        <span className="text-xs text-eqx-text-muted">{persona.name}</span>
        <Link
          to="/roteiro"
          className="ml-auto text-xs font-semibold text-eqx-action underline-offset-2 hover:underline"
        >
          Roteiro
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {previous ? (
          <Link to={previous.href} className={cardLink}>
            <ArrowLeft
              size={16}
              aria-hidden="true"
              className="shrink-0 text-eqx-text-muted group-hover:text-eqx-action"
            />
            <span className="min-w-0 truncate">
              <span className="text-xs text-eqx-text-muted">Anterior · </span>
              <span className="font-semibold">{previous.label}</span>
            </span>
          </Link>
        ) : null}

        {next ? (
          <Link to={next.href} className={`${cardLink} sm:justify-end sm:text-right`}>
            <span className="min-w-0 truncate">
              <span className="text-xs text-eqx-accent-text">Próximo · </span>
              <span className="font-semibold">{next.label}</span>
            </span>
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="shrink-0 text-eqx-action transition-transform duration-fast group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}
      </div>

      {!next ? (
        <div className="mt-3 rounded-md border-l-4 border-l-eqx-success border-eqx-border bg-eqx-surface px-3 py-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <CircleCheck size={16} aria-hidden="true" className="text-eqx-success" />
            Trilha concluída — {persona.name}
          </p>
          <p className="mt-1 text-sm text-eqx-text-muted">{journey.payoff}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                to={sibling.steps[0]}
                className={buttonClass('secondary', 'sm')}
              >
                {sibling.title}
              </Link>
            ))}
            <Link to={`/epicos/${epic.id}`} className={buttonClass('ghost', 'sm')}>
              Trilhas de {epic.shortName}
            </Link>
            <Link to="/roteiro" className={buttonClass('ghost', 'sm')}>
              Roteiro da demo
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
