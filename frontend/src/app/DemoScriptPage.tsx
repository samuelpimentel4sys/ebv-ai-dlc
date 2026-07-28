import { Link } from 'react-router-dom';
import { Clock, MessageSquareQuote, PlayCircle } from 'lucide-react';
import { EPICS } from '@/app/epics';
import { JOURNEYS, journeyPersona, journeysByEpic } from '@/app/journeys';
import { AURORA, MARIA } from '@/app/story';
import { Badge, buttonClass, Card, CardHeader, Notice, PageHeader } from '@/ds';
import { SectionWrapper } from '@/shell/SectionWrapper';

/** Frase de abertura de cada ato, para quem apresenta não precisar improvisar. */
const OPENING_LINE: Record<string, string> = {
  'EP-01': `Uma proposta de crédito de ${MARIA.firstName} acabou de entrar. Vamos ver o dado chegar e a decisão sair no mesmo minuto.`,
  'EP-02': `A decisão foi recusar. Agora ${MARIA.firstName} liga perguntando por que — e o regulador vai perguntar depois.`,
  'EP-03': `Trocando de mesa: aqui o cliente é a ${AURORA.shortName}, e o analista tem 200 páginas de balanço para ler hoje.`,
  'EP-04': `A ${AURORA.shortName} não é um caso isolado. Ela está dentro da nossa carteira, ligada a outros.`,
  'EP-05': `Volta para ${MARIA.firstName}: um dos dois apontamentos dela está errado, e ela quer resolver sem ligar para o SAC.`,
  'EP-06': `Apontamento corrigido, ${MARIA.firstName} ainda tem histórico curto. É aqui que ela entra no mercado de crédito.`,
};

const MINUTES_PER_ACT = 10;

export function DemoScriptPage() {
  return (
    <SectionWrapper>
      <PageHeader
        title="Roteiro da demonstração"
        description="Seis atos de dez minutos. Cada ato abre com uma frase, percorre uma trilha e termina num resultado de negócio."
        meta={[
          <Badge key="tempo" tone="accent">
            60 minutos
          </Badge>,
          <Badge key="atos" tone="info">
            6 atos
          </Badge>,
          <Badge key="trilhas" tone="neutral">
            {JOURNEYS.length} trilhas
          </Badge>,
        ]}
        actions={
          <Link to={JOURNEYS[0].steps[0]} className={buttonClass('primary')}>
            <PlayCircle size={16} aria-hidden="true" />
            Começar pelo ato 1
          </Link>
        }
      />

      <Notice tone="info" className="mb-6" title="Como usar em apresentação de 20 minutos">
        Corte os atos 1 e 3 e apresente a história de {MARIA.firstName} de ponta a ponta: recusa
        (EP-02), contestação (EP-05) e retorno à elegibilidade (EP-06). O seletor de estado no
        cabeçalho mostra falha e resposta vazia quando a plateia perguntar o que acontece se o
        serviço cair.
      </Notice>

      <ol className="grid gap-4">
        {EPICS.map((epic, index) => {
          const journeys = journeysByEpic(epic.id);
          const main = journeys[0];
          return (
            <li key={epic.id}>
              <Card accent={index % 2 === 0 ? 'action' : 'accent'}>
                <CardHeader
                  eyebrow={`Ato ${index + 1} · ${epic.id}`}
                  title={epic.shortName}
                  description={epic.businessOutcome}
                  actions={
                    <Badge tone="neutral">
                      <Clock size={12} aria-hidden="true" />
                      {index * MINUTES_PER_ACT}–{(index + 1) * MINUTES_PER_ACT} min
                    </Badge>
                  }
                />

                <p className="mb-4 flex items-start gap-2 rounded-md bg-eqx-surface-subtle p-3 text-sm italic">
                  <MessageSquareQuote
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-eqx-text-muted"
                  />
                  {OPENING_LINE[epic.id]}
                </p>

                <div className="grid gap-2">
                  {journeys.map((journey) => {
                    const persona = journeyPersona(journey);
                    return (
                      <div
                        key={journey.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-t border-eqx-border pt-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold">{journey.title}</span>
                          <span className="block text-xs text-eqx-text-muted">
                            {persona.name} · {journey.steps.length} telas · {journey.payoff}
                          </span>
                        </span>
                        <Link to={journey.steps[0]} className={buttonClass('secondary', 'sm')}>
                          {journey === main ? 'Percorrer' : 'Trilha opcional'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </SectionWrapper>
  );
}
