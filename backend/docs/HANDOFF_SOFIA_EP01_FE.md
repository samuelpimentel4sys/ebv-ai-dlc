# Handoff Noah -> Sofia ? Matriz FE x BE

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 18:40 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` ? `origin/main` -> `0b537cd`+ (F04 HITL)|
| **Base URL** | `http://localhost:8080` ? profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` ? `/v3/api-docs` |
| **CORS** | `http://localhost:5173` ? `http://localhost:3000` |
| **Auth lab agora** | `OIDC_ENABLED=false` (APIs abertas apos restart 16:12) |

**Legenda:** OK = plugar agora ? STUB = lab stub ? SKIP = fora / adiado

---

## Auth lab ? ler antes de plugar

### Situacao agora (2026-07-28 ~16:12)

| Item | Estado |
|------|--------|
| `.env` | `OIDC_ENABLED=false` |
| Processo `:8080` | reiniciado com **OIDC off** -> FE pode chamar sem Bearer |
| Health | `GET /actuator/health` -> **200** (sempre publico) |

### Se Sofia comecar a tomar 401

Causa tipica: alguem (Noah / smoke) subiu o BE com `OIDC_ENABLED=true` e o processo ficou vivo.

| Sintoma | Significado |
|---------|-------------|
| `GET /api/v1/identity/candidates` -> **401** | OIDC on |
| Mesmo path -> **200** | lab aberto |

**Opcao A (recomendado no plug FE):** `.env` com `OIDC_ENABLED=false` + **reiniciar** Spring. So editar `.env` **nao** altera processo ja rodando.

**Opcao B (demo Keycloak):** enviar Bearer em toda rota protegida.

```bash
curl -s -X POST "$OIDC_ISSUER_URI/protocol/openid-connect/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=prisma-backend" \
  -d "client_secret=***"
```

```http
Authorization: Bearer <access_token>
```

Issuer lab: `http://192.168.31.47:8180/realms/prisma`  
Client: `prisma-backend` (secret so no `.env` / vault ? **nao** commit no FE)

| Path (prefixo `/api/v1`) | Auth |
|--------------------------|------|
| `/identity/**` | JWT + role `DATA_STEWARD` ou `PLATFORM` |
| `/features/**` | JWT + `ML` / `ANALISTA_RISCO` / `PLATFORM` |
| `/decisions/**` | JWT + `COMPLIANCE` / `B2B` / `PLATFORM` |
| `/portfolio/**` | JWT + `RISK_ANALYST` / ? / `PLATFORM` |
| `/self-service/**`, `/onboarding/**` | publico |
| `GET /disputes/*/tracking`, `*/timeline` | publico |
| `/actuator/health` | publico |

Sem token em rota protegida -> **401**. Role errada -> **403**. Token invalido -> **401**.

Smoke Noah 2026-07-28 (OIDC on): health 200 ? identity 401 sem token ? identity/candidates/portfolio 200 com Bearer SA.

---

## Resumo epicos

| Epico | Lab | Sofia |
|-------|----:|-------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explicavel | 10/10 | **Sim** |
| **EP-04** Portfolio / Grafo | 9/9 | **Sim** (stubs Neptune/Trino) |
| **EP-05** Contestacao / Console | 9/9 | **Sim** |
| **EP-06** Inclusao / Coach | 9/9 | **Sim** |
| **EP-03** Copiloto PJ | F04 HITL Java OK · GenAI Python Emilly | **F04 plugar** (`:8080`) · GenAI → Emilly `:8090` |

---

## 1. EP-01 ? Score Vivo

Prefixo `/api/v1`

| F | St | Endpoints |
|---|----|-----------|
| F01 | OK | `GET /streams/health` ? `GET /events/{id}` ? `POST /events/credit` |
| F02 | OK | `GET /features/catalog` ? `GET /features/{doc}` ? `POST /features/batch` |
| F03 | OK | `GET /score/{doc}` ? `/history` ? `POST /score/recalculate` |
| F04 | OK | `GET /decisions/{id}` ? `/snapshot` ? `POST .../verify` |
| F05 | OK | `POST /decisions` ? `GET /decisions/{id}` ? `GET /decisions/budget` |
| F06 | OK | `GET /ingest/sources` ? `POST /ingest/replay` |
| F07 | OK | `GET /identity/candidates` ? `/{doc}` ? `POST /merge` ? `/merge/undo` |
| F08 | OK | `GET /observability/slo` ? `/budget` ? `/traces/{decisionId}` |
| F09 | OK | `GET /models` ? `POST .../promote` ? `.../rollback` |
| F10 | OK | `POST /replay/jobs` ? `GET .../{jobId}` ? `POST .../abort` |

---

## 2. EP-02 ? Explicavel

| F | St | Endpoints |
|---|----|-----------|
| F01 | OK | `GET /explain/{decisionId}` ? `/factors` ? `POST /explain/batch` |
| F02 | OK | `GET /counterfactual/{decisionId}` ? `POST /counterfactual/simulate` |
| F03 | OK | `POST /dossier` ? `GET /dossier/{id}` ? `/download` |
| F04 | OK | `GET /audit/trail` ? `/trail/{doc}` ? `POST /audit/export` |
| F05 | OK | `GET /reasons` ? `POST /reasons` ? `GET /reasons/resolve/{decisionId}` |
| F06 | OK | `GET /reviews/queue` ? `POST /reviews` ? `PATCH .../decide` |
| F07 | OK | `GET /fairness/metrics` ? `/alerts` ? `POST /fairness/analyze` |
| F08 | OK | `GET/POST /subject-requests` ? `PATCH /subject-requests/{id}` |
| F09 | OK | `GET /policy/baseline` ? `POST /policy/simulate` ? `GET /policy/simulations/{id}` |
| F10 | OK | `GET /policy/versions` ? `.../diff/{a}/{b}` ? `POST .../publish` |

---

## 3. EP-04 ? Portfolio

Todos sob `/api/v1/portfolio/*` ? Flyway V40-V48 ? commit `9aa6fcf`

| F | Endpoints |
|---|-----------|
| F01 Grafo | `GET /graph` ? `GET /graph/node/{id}` ? `POST /graph/filter` |
| F02 Contagio | `POST /contagion/simulate` ? `GET /contagion/{simId}` ? `GET /contagion/critical` |
| F03 Stress | `POST /stress/run` ? `GET /stress/scenarios` ? `GET /stress/{runId}` |
| F04 Limites | `GET /concentration` ? `POST /limits` ? `GET /alerts` |
| F05 Cubos | `GET /aggregates` ? `POST /aggregates/refresh` ? `GET /aggregates/freshness` |
| F06 Comunidades | `POST /communities/detect` ? `GET /communities` ? `GET /communities/{id}` |
| F07 Historico | `GET /snapshot` ? `POST /compare` ? `GET /timeline` |
| F08 Reports | `POST /reports` ? `GET /reports/{id}` ? `GET .../download` |
| F09 2D/tabular | `GET /graph/2d` ? `GET /graph/tabular` |

Ressalva: stubs (sem Neptune/Trino/Spark reais).

---

## 4. EP-05 ? Contestacao / Console

Self-service ? disputes ? tracking ? attachments ? SLA ? onboarding ? credentials ? console ? analytics.

Rotas publicas uteis no FE: `/api/v1/self-service/**`, `/api/v1/onboarding/**`, tracking/timeline de dispute.

---

## 5. EP-06 ? Inclusao / Coach

Consents ? utilities ? alternative-data ? thinfile ? coach ? missions ? marketplace ? drift  
Flyway V31-V39 ? commit `e3ebc6f`

---

## 6. EP-03 — F04 HITL OK · GenAI Emilly

| Parte | Host | Sofia |
|-------|------|-------|
| **F04 HITL** (submit / approve / trail) | Noah Java `:8080` | **Plugar agora** |
| GenAI (extra��o, RAG, parecer, ratios, guardrails, library?) | Emilly Python `:8090` | Plugar quando Walter/Emilly liberarem contrato FE?Python |

### F04 ? endpoints Java (lab ? 2026-07-28)

Commit �ncora: `0b537cd` � Flyway **V50** � smoke cruzado Emilly?Noah **OK**

| M�todo | Path |
|--------|------|
| `POST` | `/api/v1/pj/opinions/{id}/submit` |
| `POST` | `/api/v1/pj/opinions/{id}/approve` |
| `GET` | `/api/v1/pj/opinions/{id}/trail` |

Telas FE alvo: `OpinionEditorPage` (submit) � `ApprovalPage` (approve/reject + trail) � `GuardrailsPage` (submit p�s-verify).

**N�o** misturar: GenAI continua **s�** Emilly ? Java n�o embute LLM.

Detalhe contrato: [`HANDOFF_EMILLY_NOAH_EP03_F04.md`](./HANDOFF_EMILLY_NOAH_EP03_F04.md)

---

## 7. Ressalvas gerais

- WORM lab = FS (`prisma.worm.backend=fs`); prod pode ser S3 Object Lock
- SHAP / DiCE / ONNX / Fairlearn / Neptune = stubs
- Flyway Supabase ate **V50** (HITL approval_*) · V49 sha256 align
- Gaps de shape -> listar p/ Noah (sem inventar campo)

---

## 9. Alinhamento Sofia (2026-07-28) — o que ainda fica

| Item | Dono | Nota |
|------|------|------|
| **EP-03 F04 HITL live** | **Sofia** próximo | Noah lab OK — plugar submit/approve/trail |
| **EP-03 GenAI live** | Emilly + Sofia | Python `:8090` — fora do plug Noah |
| **P1** hardening FE gaps OpenAPI | **Sofia** | Noah só age se FE listar divergência |
| **P6** login OIDC PKCE | **Sofia** backlog | Lab `OIDC_ENABLED=false` |
| Stubs → adapters reais | Noah / Walter | Neo4j/ONNX/Fairlearn quando host OK |

### Ack Noah (2026-07-28) — registrado neste handoff

- F04 HITL no ar (`:8080`)
- Flyway V50 no Supabase
- Smoke cruzado Emilly↔Noah OK
- GenAI fica na Emilly (`:8090`)

---

## 10. Commits ancora

| Commit | Escopo |
|--------|--------|
| `9aa6fcf` | EP-04 |
| `e4e9a64` | WORM S3 switch |
| `d531e0f` | OIDC CTs + Backend CI |
| `582f710` | Flyway V49 + doc smoke OIDC |
| `c852a76` | Handoff Sofia Auth / 401 |
| `0b537cd` | EP-03 F04 HITL Java |

_Noah: F04 HITL no ar. GenAI = Emilly. Sofia pluga F04 no FE._
