import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Quote, Search } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CardHeader,
  Metric,
  Notice,
  ProgressBar,
  QueryBoundary,
  TextField,
  useToast,
} from '@/ds';
import { useMockQuery } from '@/lib/useMockQuery';
import { formatNumber, formatPercent } from '@/lib/format';
import { AURORA } from '@/app/story';
import { ragQuery, ragSuggestions } from '@/epics/copiloto-pj/data';
import { cn } from '@/lib/cn';

export function GroundingPage() {
  const toast = useToast();
  const [question, setQuestion] = useState(ragSuggestions[0]);
  const [asked, setAsked] = useState(ragSuggestions[0]);
  const [citationId, setCitationId] = useState<string | null>(null);

  const query = useMockQuery(() => ragQuery(asked), {
    latency: 620,
    deps: [asked],
    isEmpty: (data) => data.citations.length === 0,
  });

  function ask(text: string) {
    setQuestion(text);
    setAsked(text);
    setCitationId(null);
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-03-F02-US-FE-01"
      title="Rastreamento da origem da afirmação"
      description="Consulta ao acervo do CNPJ com resposta sempre acompanhada dos trechos recuperados: similaridade, documento, página e pré-visualização do trecho citado."
      meta={[
        <Badge key="epic" tone="accent">
          EP-03 · Copiloto PJ
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /pj/:cnpj/grounding
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5">
        <Notice tone="info" title="Escopo restrito ao CNPJ 12.345.678/0001-90">
          A recuperação usa apenas documentos da biblioteca deste cliente. Nenhum trecho de outro
          CNPJ pode ser retornado, e a tentativa é registrada na auditoria.
        </Notice>

        <Card>
          <CardHeader
            eyebrow="consulta"
            title="Pergunta ao acervo"
            description="POST /api/v1/pj/rag/query"
          />
          <div className="grid gap-3">
            <TextField
              label="Pergunta"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              hint="Perguntas objetivas retornam citações mais precisas."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<Search size={16} aria-hidden="true" />}
                loading={query.status === 'loading'}
                onClick={() => ask(question)}
              >
                Consultar acervo
              </Button>
              {ragSuggestions.slice(1).map((suggestion) => (
                <Button key={suggestion} variant="ghost" size="sm" onClick={() => ask(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <QueryBoundary
          query={query}
          loadingRows={5}
          empty={{
            title: 'Nenhum trecho do acervo sustenta essa pergunta.',
            description:
              'Sem trecho recuperado o copiloto não responde, para não inventar lastro. Reformule a pergunta ou envie o documento que trata do tema à biblioteca do cliente.',
            action: (
              <Link to={`/pj/${AURORA.document}/biblioteca`} className={buttonClass('secondary')}>
                Abrir biblioteca do cliente
              </Link>
            ),
          }}
          noResults={{
            active: asked !== ragSuggestions[0],
            onClear: () => ask(ragSuggestions[0]),
            description:
              'A pergunta atual não recuperou nenhum trecho do acervo deste CNPJ. Volte à pergunta sugerida para ver a recuperação de referência ou reformule com os termos usados no documento.',
          }}
        >
          {(answer) => {
            const citation =
              answer.citations.find((item) => item.citationId === citationId) ?? answer.citations[0];
            return (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric value={answer.citations.length} label="Trechos recuperados" />
                  <Metric
                    value={formatPercent(
                      Math.max(...answer.citations.map((item) => item.similarity)) * 100,
                      0,
                    )}
                    label="Maior similaridade"
                    tone="success"
                  />
                  <Metric
                    value={`${formatNumber(answer.latencyMs / 1000, 2)} s`}
                    label="Latência da resposta"
                    hint={`modelo ${answer.model}`}
                  />
                  <Metric
                    value={new Set(answer.citations.map((item) => item.docId)).size}
                    label="Documentos envolvidos"
                    tone="action"
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                  <Card accent="action">
                    <CardHeader
                      eyebrow="resposta"
                      title="Síntese com lastro documental"
                      actions={<Quote size={18} aria-hidden="true" />}
                    />
                    <p className="text-base leading-relaxed">{answer.answer}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {answer.citations.map((item, index) => (
                        <button
                          key={item.citationId}
                          type="button"
                          onClick={() => setCitationId(item.citationId)}
                          aria-pressed={citation.citationId === item.citationId}
                          className={cn(
                            'inline-flex min-h-target items-center gap-1 rounded-pill border px-3 text-xs font-semibold',
                            citation.citationId === item.citationId
                              ? 'border-eqx-accent-text bg-eqx-accent/15 text-eqx-accent-text'
                              : 'border-eqx-border hover:bg-eqx-surface-subtle',
                          )}
                        >
                          [{index + 1}] {item.docName} p.{item.page}
                        </button>
                      ))}
                    </div>
                    <Notice tone="warning" className="mt-4" title="Sem citação, sem afirmação">
                      Qualquer trecho da resposta que não tenha citação correspondente é bloqueado
                      pelos guardrails antes de entrar no parecer.
                    </Notice>
                    <div className="mt-4">
                      <Link
                        to={`/pj/pareceres/${AURORA.opinionId}/editor`}
                        className={buttonClass('primary')}
                      >
                        <PenLine size={16} aria-hidden="true" />
                        Levar citações para o parecer
                      </Link>
                    </div>
                  </Card>

                  <div className="grid content-start gap-3">
                    {answer.citations.map((item, index) => (
                      <Card
                        key={item.citationId}
                        interactive
                        accent={citation.citationId === item.citationId ? 'accent' : 'none'}
                        onClick={() => setCitationId(item.citationId)}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold">
                            [{index + 1}] {item.docName}
                          </span>
                          <Badge tone={item.similarity >= 0.85 ? 'success' : 'warning'}>
                            similaridade {formatNumber(item.similarity, 2)}
                          </Badge>
                        </div>
                        <p className="text-sm italic text-eqx-text-muted">“{item.excerpt}”</p>
                        <div className="mt-3">
                          <ProgressBar
                            label={`página ${item.page} · ${item.chunkId}`}
                            value={item.similarity * 100}
                            tone={item.similarity >= 0.85 ? 'success' : 'warning'}
                          />
                        </div>
                      </Card>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() => toast.info('Reindexação solicitada', 'POST /api/v1/pj/rag/index')}
                    >
                      Reindexar acervo do CNPJ
                    </Button>
                  </div>
                </div>
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </ScreenLayout>
  );
}
