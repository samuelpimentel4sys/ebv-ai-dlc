# Provisionamento lab — Neo4j · ONNX · Fairlearn

| Campo | Valor |
|-------|-------|
| **Host lab** | `192.168.31.47` |
| **Data** | 2026-07-28 |
| **Consumidor** | Noah · `prisma-backend` |

## Env (`.env`)

```env
GRAPH_BACKEND=neo4j
NEO4J_URI=bolt://192.168.31.47:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=***

ONNX_MODE=http
ONNX_SCORER_URL=http://192.168.31.47:8091
ONNX_MODEL_PATH=/home/walter/prisma-infra/models/score-v1.onnx

FAIRLEARN_ENABLED=true
FAIRLEARN_URL=http://192.168.31.47:8092
```

## Smoke

| Serviço | Check | Esperado |
|---------|-------|----------|
| Neo4j | Bolt `7687` / Browser `7474` | ping OK; seed `PortfolioNode` no 1º GET graph |
| ONNX | `GET /health` | `status=up` · **`model_loaded=true`** p/ inferência real |
| Fairlearn | `GET /health` · `POST /analyze` | `status=up` · analyze 200 |

### Nota ONNX (2026-07-28)

Sidecar respondeu `model_loaded=false` (`score=-1`). BE faz **fallback** para fórmula lab até o volume do `.onnx` carregar no container. Conferir mount `/models/score-v1.onnx` no host Docker.

## Adapters BE

| Port | Adapter | Condicional |
|------|---------|-------------|
| `PortfolioGraphStorePort` | `Neo4jPortfolioGraphAdapter` | `GRAPH_BACKEND=neo4j` |
| `OnnxScorerPort` | `HttpOnnxScorerAdapter` | `ONNX_MODE=http` |
| `FairlearnEnginePort` | `HttpFairlearnAdapter` | `FAIRLEARN_ENABLED=true` |

Defaults sem infra: `stub` / `false` (testes locais sem Docker).
