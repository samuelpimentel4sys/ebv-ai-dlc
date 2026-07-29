# Arquitetura Hexagonal — Prisma PJ (Python)

```
Presentation → Application → Domain ← Infrastructure
                              ↑
                    Ports (typing.Protocol)
```

- **Domain:** Python puro — aggregates, VOs, ports, exceptions
- **Application:** use cases (orquestração + ports)
- **Infrastructure:** adapters LLM/embed, Postgres/pgvector, Redis
- **Presentation:** FastAPI routers finos + `deps.py` (único ponto de concreção)

## Providers

`local | bedrock | openai | gemini` — ver `ADR-001-llm-provider-multi.md`.

## Java

HITL/alçada (F04) permanece em `Prisma/backend` (Noah). Este serviço = núcleo GenAI.
