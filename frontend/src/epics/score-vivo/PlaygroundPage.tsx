import { useState } from 'react';
import { Copy, Play, Terminal } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardHeader,
  EmptyState,
  KeyValueList,
  Notice,
  SelectField,
  Tabs,
  TextAreaField,
  useToast,
} from '@/ds';
import { playgroundRun, playgroundSamplePayload, type PlaygroundResponse } from '@/epics/score-vivo/data';
import { formatNumber } from '@/lib/format';
import { isLiveMode } from '@/lib/config';
import { errorMessage } from '@/lib/useDataQuery';
import { createDecisionLive } from '@/api/scorePlatform';

const DECISION_IDS_KEY = 'prisma.decisionIds';

function rememberDecisionId(decisionId: string) {
  try {
    const raw = sessionStorage.getItem(DECISION_IDS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [...ids.filter((id) => id !== decisionId), decisionId].slice(-10);
    sessionStorage.setItem(DECISION_IDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

const snippets = {
  curl: `curl -X POST https://api.prisma.ebv.com.br/api/v1/decisions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: $(uuidgen)" \\
  -d @payload.json`,
  java: `var request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.prisma.ebv.com.br/api/v1/decisions"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .header("X-Idempotency-Key", UUID.randomUUID().toString())
    .POST(HttpRequest.BodyPublishers.ofString(payload))
    .build();

var response = client.send(request, BodyHandlers.ofString());`,
  typescript: `const response = await fetch('/api/v1/decisions', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${token}\`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify(payload),
});

const decision: DecisionResponse = await response.json();`,
};

export function PlaygroundPage() {
  const toast = useToast();
  const [payload, setPayload] = useState(playgroundSamplePayload);
  const [environment, setEnvironment] = useState('sandbox');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PlaygroundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    let parsed: { documento?: string; productCode?: string; produto?: string };
    try {
      parsed = JSON.parse(payload) as {
        documento?: string;
        productCode?: string;
        produto?: string;
      };
    } catch {
      setResult(null);
      setError(
        'O corpo não é um JSON válido. Revise vírgulas, chaves e aspas — ou use “Restaurar exemplo” para voltar ao payload de referência.',
      );
      document.querySelector<HTMLElement>('[name="playground-payload"]')?.focus();
      return;
    }
    setError(null);
    setRunning(true);
    void (async () => {
      try {
        let response: PlaygroundResponse;
        if (isLiveMode()) {
          if (!parsed.documento) {
            throw new Error('Payload live exige o campo "documento".');
          }
          response = await createDecisionLive({
            documento: parsed.documento,
            productCode: parsed.productCode ?? parsed.produto,
          });
          rememberDecisionId(response.decisionId);
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          response = playgroundRun();
          rememberDecisionId(response.decisionId);
        }
        setResult(response);
        toast.success('Decisão emitida no sandbox', 'POST /api/v1/decisions');
      } catch (err) {
        setResult(null);
        setError(errorMessage(err));
        toast.error('Falha ao emitir decisão', errorMessage(err));
      } finally {
        setRunning(false);
      }
    })();
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F05-US-FE-01"
      title="Playground da API de decisões"
      description="Monte o payload, execute contra o sandbox, veja a resposta com decision_id, os motivos retornados, o consumo de cada etapa do orçamento de latência e copie o snippet na linguagem do cliente."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /integracao/playground/decisoes
        </Badge>,
      ]}
      wide
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            eyebrow="requisição"
            title="Payload da decisão"
            actions={
              <SelectField
                label="Ambiente"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
                options={[
                  { value: 'sandbox', label: 'Sandbox' },
                  { value: 'homolog', label: 'Homologação' },
                ]}
              />
            }
          />
          <TextAreaField
            label="Corpo da requisição (JSON)"
            name="playground-payload"
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            hint="Header X-Idempotency-Key é gerado automaticamente pelo playground."
            rows={14}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button loading={running} icon={<Play size={16} aria-hidden="true" />} onClick={run}>
              Executar decisão
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPayload(playgroundSamplePayload);
                setError(null);
              }}
            >
              Restaurar exemplo
            </Button>
          </div>
        </Card>

        <Card accent={result ? 'success' : 'none'}>
          <CardHeader
            eyebrow="resposta"
            title="Retorno do motor de decisão"
            actions={
              result ? (
                <Badge tone="success">HTTP 201</Badge>
              ) : (
                <Badge tone="neutral">aguardando execução</Badge>
              )
            }
          />
          {result ? (
            <div className="grid gap-4">
              <KeyValueList
                items={[
                  { label: 'decision_id', value: <code className="text-xs">{result.decisionId}</code> },
                  { label: 'Resultado', value: result.outcome },
                  { label: 'Score', value: result.score },
                  { label: 'Modelo', value: <code className="text-xs">{result.modelVersion}</code> },
                ]}
              />
              <div>
                <h3 className="mb-2 text-base">
                  Orçamento de latência ({formatNumber(result.latency.total)} ms de 250 ms)
                </h3>
                <BarChart
                  ariaLabel="Consumo do orçamento de latência por etapa"
                  unit=" ms"
                  max={250}
                  data={[
                    { label: 'feature-store', value: result.latency.featureStore, tone: 'action' },
                    { label: 'model-serving', value: result.latency.model, tone: 'accent' },
                    { label: 'policy-engine', value: result.latency.policy, tone: 'success' },
                    { label: 'audit-write', value: result.latency.audit, tone: 'muted' },
                  ]}
                />
              </div>
              <div>
                <h3 className="mb-2 text-base">Motivos retornados</h3>
                <ul className="grid gap-2">
                  {result.reasons.map((reason) => (
                    <li
                      key={reason.code}
                      className="flex items-center justify-between gap-3 rounded-md border border-eqx-border px-3 py-2 text-sm"
                    >
                      <span>
                        <code className="text-xs">{reason.code}</code> {reason.label}
                      </span>
                      <Badge tone="info">{reason.weight}%</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nenhuma execução ainda"
              description="Envie o payload para ver decision_id, motivos e a quebra da latência por etapa."
              icon={<Terminal size={28} aria-hidden="true" />}
            />
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          eyebrow="integração"
          title="Snippets de consumo"
          description="Idempotência obrigatória por X-Idempotency-Key; timeout recomendado de 1 s com retry exponencial."
          actions={
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy size={16} aria-hidden="true" />}
              onClick={() => toast.info('Snippet copiado para a área de transferência')}
            >
              Copiar
            </Button>
          }
        />
        <Tabs
          items={[
            { id: 'curl', label: 'cURL', content: <pre>{snippets.curl}</pre> },
            { id: 'java', label: 'Java 21', content: <pre>{snippets.java}</pre> },
            { id: 'ts', label: 'TypeScript', content: <pre>{snippets.typescript}</pre> },
          ]}
        />
        <Notice tone="warning" className="mt-4" title="Ambiente de demonstração">
          O playground opera com dados sintéticos. Nenhuma consulta atinge bases produtivas e o
          ambiente selecionado ({environment}) apenas altera o rótulo do snippet.
        </Notice>
      </Card>
    </ScreenLayout>
  );
}
