# Dev Agent Record — P2 Núcleo copiloto

**Agente:** Emilly · **Data:** 2026-07-28  
**Sprint:** P2 (F05 → F03 → F06)

## Entregue

- Migration Supabase `ep03_p2_ratios_opinion_guardrails` + Alembic `002_ep03_p2`
- **F05** ratios: calculate / list / benchmarks (rubricas no body — F01 pendente)
- **F03** opinions: POST sync gera seções via LLM+RAG; GET; PATCH
- **F06** guardrails: verify lastro numérico determinístico + report histórico
- Domínio puro: `ratio_calculator`, `guardrail_numbers`
- Smoke: `scripts/smoke_p2.py` → `SMOKE_P2_OK`

## Endpoints novos

- `POST /api/v1/pj/ratios/calculate`
- `GET /api/v1/pj/{cnpj}/ratios`
- `GET /api/v1/pj/ratios/benchmarks?cnae=`
- `POST /api/v1/pj/opinions`
- `GET|PATCH /api/v1/pj/opinions/{id}`
- `POST /api/v1/pj/guardrails/verify`
- `GET /api/v1/pj/guardrails/report/{opinionId}`

## Trade-offs

- F01 pendente → calculate exige `fields` no request (massa sintética)
- Guardrail P2 = lastro numérico determinístico (não entailment Bedrock ainda)
- Opinion lab sync (`sync=true`); async job fica para P3/P4
- Se RAG sem hits → seção `UNVERIFIED` (RN002)

## Pendente

- F01 extração + massa documental
- JWT/ACL
- F04 HITL Java
- Entailment LLM no F06
- F08/F09

## Próximo

P3 contrato F04 (Noah) **ou** reforçar grounding opinion (query RAG mais específica) + F09 routing
