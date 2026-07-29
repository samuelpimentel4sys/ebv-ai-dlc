# Plano de Trabalho — EP-03 Copiloto GenAI PJ (Python / Emilly)

**Agente:** Emilly (`dev-python-esp`)  
**Repo:** `Prisma/backend-python` (monorepo sibling de `backend` Java)  
**Contrato:** 9 US-BE · 26 endpoints · `backend/docs/user-stories/00_INDICE_US-BE_PRISMA-EP-03.md`  
**Parceiro Java:** Noah — BC `pj` HITL/alçada (F04)  
**Norte providers:** Jarvis (chat+embed only; **sem voz**)

---

## Providers

| Provider | Uso | Chat | Embed |
|----------|-----|------|-------|
| `local` | Lab default | Ollama `/v1/chat/completions` | Ollama `/api/embeddings` |
| `bedrock` | Prod EBV canônico | Bedrock Runtime | Titan embed |
| `openai` | Análise / eval | Chat Completions | text-embedding-3-* |
| `gemini` | Análise / eval | generateContent | text-embedding-004 |

`INFERENCE_PROVIDER=local|bedrock|openai|gemini`  
Voz/STT/TTS/Whisper/Piper/Pipecat = **fora de escopo**.

**RN004:** `provider + embeddingModel + dims + indexVersion` — troca = reindex.

---

## Sprints

### P0 — Plataforma GenAI ✅ (2026-07-28)

- [x] Scaffold uv + hexagonal `src/prisma_pj`
- [x] Ports `LlmGateway` / `EmbeddingGateway`
- [x] Adapters local / openai / gemini / bedrock
- [x] `/health` `/ready` `POST /api/v1/pj/smoke/llm`
- [x] docker-compose (pgvector + redis) + Dockerfile
- [x] ADR-001 + testes unitários adapters

### P1 — Fundação dados (F07 → F01 → F02) · 🟡 (2026-07-28)

- [x] Supabase Prisma: extension `vector` + tabelas F01/F07/F02
- [x] Alembic `001_ep03_pj` + `.env` DATABASE_URL (mesmo host Java)
- [x] F07 library CRUD API (sem ACL JWT ainda)
- [x] F02 RAG index/query/citations (pad dims + isolamento CNPJ)
- [x] F01 extração estruturada — massa sintética + stub OCR · [`DEV_RECORD_F01.md`](./DEV_RECORD_F01.md) · `fixtures/f01/`
- [x] Smoke e2e Ollama embed → Supabase
- [x] ACL / JWT (Keycloak espelho Noah — `OIDC_ENABLED`, lab bypass) · [`DEV_RECORD_JWT.md`](./DEV_RECORD_JWT.md)

### P2 — Núcleo copiloto (F05 → F03 → F06) · ✅ (2026-07-28)

- [x] F05 índices (calculate + benchmarks; fields no body)
- [x] F03 parecer seccionado (LLM local + RAG)
- [x] F06 guardrails lastro numérico
- [x] Migration `002_ep03_p2` + smoke_p2

### P3 — Governança (F04 contrato · F08 · F09)

- [x] **Handoff F04 → Noah:** [`HANDOFF_EMILLY_NOAH_EP03_F04.md`](../backend/docs/HANDOFF_EMILLY_NOAH_EP03_F04.md) (cópia: `docs/HANDOFF_NOAH_EP03_F04.md`)
- [x] F04 HITL implementação (**Noah** — Java) · ack Emilly 2026-07-28 · JDBC · sem PATCH status Python
- [x] F08 grupo (stub Neptune) · [`DEV_RECORD_F08.md`](./DEV_RECORD_F08.md)
- [x] F09 routing + telemetria custo · [`DEV_RECORD_F09.md`](./DEV_RECORD_F09.md)

### P4 — Hardening

- [ ] Testcontainers · cov >80% · OpenAPI FE · smoke multi-provider

---

## Decisões abertas

| # | Item |
|---|------|
| D2 | Host Ollama lab (default `.env.example` = 192.168.31.47) |
| D3 | Dims canônicas lab 768 vs 1024 |
| D4 | Model IDs Bedrock oficiais EBV |
| D5 | F04: sync HTTP vs Kafka |
| D6 | F08 stub ate EP-04 — **fechado** (`GROUP_GRAPH_BACKEND=stub`) |
| D7 | Reabrir EP-03 no plano Noah (hoje ADIADO) |

D1 (path) = **`Prisma/backend-python`** — fechado.
