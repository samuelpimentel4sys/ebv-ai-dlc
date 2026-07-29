# Dev Agent Record — P0 Plataforma GenAI

**Agente:** Emilly · **Data:** 2026-07-28  
**Sprint:** P0

## Entregue

- Serviço `Prisma/backend-python` (uv + FastAPI hexagonal)
- Ports + 4× LLM + 4× Embed adapters
- Endpoints: `GET /health`, `GET /ready`, `POST /api/v1/pj/smoke/llm`
- Plano + ADR-001 + docker-compose (pgvector:5433, redis:6380)

## Trade-offs

- Bedrock sem SigV4 nativo no P0 — endpoint mock para contrato; boto3 no P4/staging
- Coverage gate P0 = 60% (sobe para 80% no P4)
- Porta API **8090** (Java permanece 8080)

## Dívida

- Alembic / tabelas EP-03 → P1
- JWT/OIDC validação → alinhar com Noah
- boto3 Bedrock real
- OpenAPI schemas ricos por US

## Próximo

P1: F07 → F01 → F02 (biblioteca, extração, RAG CNPJ)
