# Handoff Sofia — FE só fala com Java :8080 (BFF GenAI)

| Campo | Valor |
|-------|-------|
| **De** | Noah |
| **Para** | Sofia (FE) · Emilly (ciente) |
| **Data** | 2026-07-28 |
| **Decisão** | Frontend **não** chama Python `:8090` |

## Regra

```
FE (Sofia)
   │
   └─────────────► Java :8080  (único backend público)
                      │
                      ├─ HITL submit/approve/trail  → Java (JDBC)
                      └─ demais /api/v1/pj/**       → BFF → Python :8090 (Emilly)
```

## Paths FE

| Uso | Base URL | Path |
|-----|----------|------|
| **Tudo EP-03** | `http://localhost:8080` | `/api/v1/pj/**` |
| Health GenAI (via BFF) | `:8080` | `GET /api/v1/pj/genai/health` |
| HITL | `:8080` | `POST .../opinions/{id}/submit` · `approve` · `GET .../trail` |
| GenAI (RAG, opinions, ratios, docs, library, guardrails, group, routing) | `:8080` | **mesmos paths** que Emilly documentou — sem trocar path, só host |

**Remover** qualquer `VITE_*` / axios base apontando para `:8090`.

Header resposta BFF: `X-Prisma-Bff: genai`.

## Env BE

```env
PRISMA_GENAI_ENABLED=true
PRISMA_GENAI_BASE_URL=http://localhost:8090
```

Python continua **interno** (localhost ou rede lab). FE/browser não precisa alcançar `:8090`.

## Contrato Emilly

Sem mudança de paths Python. Noah só faz proxy HTTP transparente (+ timeout 180s LLM).

## Smoke

```bash
# GenAI via BFF
curl -s http://localhost:8080/api/v1/pj/genai/health
# → {"status":"ok","service":"prisma-pj",...}

# HITL continua Java
curl -s http://localhost:8080/api/v1/pj/opinions/{id}/trail
```

_Noah · 2026-07-28_
