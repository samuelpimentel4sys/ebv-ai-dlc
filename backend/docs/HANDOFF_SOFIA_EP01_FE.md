# Handoff Noah ? Sofia ? Matriz FE × BE

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 16:10 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` · `origin/main` ? `582f710` |
| **Base URL** | `http://localhost:8080` · profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` · `/v3/api-docs` |
| **CORS** | `http://localhost:5173` · `http://localhost:3000` |

**Legenda:** ? plugar agora · ?? stub lab · ? fora / adiado

---

## ?? Auth lab ? ler antes de plugar

### Situação agora (2026-07-28 ~16:05)

| Item | Estado |
|------|--------|
| `.env` no disco | `OIDC_ENABLED=false` (lab Sofia) |
| **Processo Spring em `:8080`** | ainda com **OIDC ligado** do smoke Keycloak |
| Efeito no FE | `GET /api/v1/**` **sem** `Authorization` ? **401** |
| Health | `GET /actuator/health` ? **200** (público) |

Se Sofia ver **401** em massa: ou (A) reiniciar o BE com `OIDC_ENABLED=false`, ou (B) enviar Bearer JWT (abaixo).

### Como saber se OIDC está on

```http
GET http://localhost:8080/api/v1/identity/candidates
```

- **401** ? OIDC on (precisa token ou restart)
- **200** (lista) ? lab aberto, plugar sem auth

### Opção A ? Lab aberto (recomendado enquanto pluga FE)

1. Confirmar `Prisma/backend/.env`: `OIDC_ENABLED=false`
2. **Reiniciar** o Spring Boot (só alterar `.env` **não** muda processo vivo)
3. Retestar identity/candidates ? deve voltar **200** sem header

### Opção B ? Consumir com Keycloak (OIDC on)

Issuer: `http://192.168.31.47:8180/realms/prisma`  
Client: `prisma-backend` (confidential · client_credentials)

```bash
# token (não logar secret no chat/commit)
curl -s -X POST "$OIDC_ISSUER_URI/protocol/openid-connect/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=prisma-backend" \
  -d "client_secret=***"
```

Todas as chamadas autenticadas:

```http
Authorization: Bearer <access_token>
```

Roles no JWT (`realm_access.roles`) ? Keycloak lab usa prefixo `ROLE_*`; o BE mapeia para Spring `hasRole`:

| Path (prefixo `/api/v1`) | Role mínima (exemplos) |
|--------------------------|-------------------------|
| `/identity/**` | `DATA_STEWARD` ou `PLATFORM` |
| `/features/**` | `ML` / `ANALISTA_RISCO` / `PLATFORM` |
| `/decisions/**` | `COMPLIANCE` / `B2B` / `PLATFORM` |
| `/portfolio/**` | `RISK_ANALYST` / ? / `PLATFORM` |
| `/self-service/**`, `/onboarding/**` | **público** (sem JWT) |
| `GET /disputes/*/tracking`, `*/timeline` | **público** |
| `/actuator/health` | **público** |

Token inválido / ausente em rota protegida ? **401**.  
Token ok, role errada ? **403**.

Smoke Noah 2026-07-28 (SA com várias roles): health 200 · identity 401 sem token · identity/candidates/portfolio **200** com Bearer.

Secrets Keycloak: só no `.env` do BE / vault ? **não** commitarem no FE.

---

## Resumo épicos

| Épico | Lab | Sofia |
|-------|----:|-------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explicável | 10/10 | **Sim** |
| **EP-04** Portfólio / Grafo | 9/9 | **Sim** (stubs Neptune/Trino) |
| **EP-05** Contestação / Console | 9/9 | **Sim** |
| **EP-06** Inclusão / Coach | 9/9 | **Sim** |
| **EP-03** Copiloto PJ / GenAI | ? | ? **ADIADO** (Python/Bedrock) |

---

## 1. EP-01 ? Score Vivo

| F | St | Endpoints |
|---|----|-----------|
| F01 | ? | `GET /streams/health` · `GET /events/{id}` · `POST /events/credit` |
| F02 | ? | `GET /features/catalog` · `GET /features/{doc}` · `POST /features/batch` |
| F03 | ? | `GET /score/{doc}` · `/history` · `POST /score/recalculate` |
| F04 | ? | `GET /decisions/{id}` · `/snapshot` · `POST .../verify` |
| F05 | ? | `POST /decisions` · `GET /decisions/{id}` · `GET /decisions/budget` |
| F06 | ? | `GET /ingest/sources` · `POST /ingest/replay` |
| F07 | ? | `GET /identity/candidates` · `/{doc}` · `POST /merge` · `/merge/undo` |
| F08 | ? | `GET /observability/slo` · `/budget` · `/traces/{decisionId}` |
| F09 | ? | `GET /models` · `POST .../promote` · `.../rollback` |
| F10 | ? | `POST /replay/jobs` · `GET .../{jobId}` · `POST .../abort` |

Prefixo: `/api/v1`

---

## 2. EP-02 ? Explicável

| F | St | Endpoints |
|---|----|-----------|
| F01 | ? | `GET /explain/{decisionId}` · `/factors` · `POST /explain/batch` |
| F02 | ? | `GET /counterfactual/{decisionId}` · `POST /counterfactual/simulate` |
| F03 | ? | `POST /dossier` · `GET /dossier/{id}` · `/download` |
| F04 | ? | `GET /audit/trail` · `/trail/{doc}` · `POST /audit/export` |
| F05 | ? | `GET /reasons` · `POST /reasons` · `GET /reasons/resolve/{decisionId}` |
| F06 | ? | `GET /reviews/queue` · `POST /reviews` · `PATCH .../decide` |
| F07 | ? | `GET /fairness/metrics` · `/alerts` · `POST /fairness/analyze` |
| F08 | ? | `GET/POST /subject-requests` · `PATCH /subject-requests/{id}` |
| F09 | ? | `GET /policy/baseline` · `POST /policy/simulate` · `GET /policy/simulations/{id}` |
| F10 | ? | `GET /policy/versions` · `.../diff/{a}/{b}` · `POST .../publish` |

---

## 3. EP-04 ? Portfólio

Todos sob `/api/v1/portfolio/*` · Flyway V40?V48 · commit `9aa6fcf`

| F | Endpoints |
|---|-----------|
| F01 Grafo | `GET /graph` · `GET /graph/node/{id}` · `POST /graph/filter` |
| F02 Contágio | `POST /contagion/simulate` · `GET /contagion/{simId}` · `GET /contagion/critical` |
| F03 Stress | `POST /stress/run` · `GET /stress/scenarios` · `GET /stress/{runId}` |
| F04 Limites | `GET /concentration` · `POST /limits` · `GET /alerts` |
| F05 Cubos | `GET /aggregates` · `POST /aggregates/refresh` · `GET /aggregates/freshness` |
| F06 Comunidades | `POST /communities/detect` · `GET /communities` · `GET /communities/{id}` |
| F07 Histórico | `GET /snapshot` · `POST /compare` · `GET /timeline` |
| F08 Reports | `POST /reports` · `GET /reports/{id}` · `GET .../download` |
| F09 2D/tabular | `GET /graph/2d` · `GET /graph/tabular` |

**Ressalva:** stubs (sem Neptune/Trino/Spark reais).

---

## 4. EP-05 ? Contestação / Console

Self-service · disputes · tracking · attachments · SLA · onboarding · credentials · console · analytics.

Rotas **públicas** úteis no FE: `/api/v1/self-service/**`, `/api/v1/onboarding/**`, tracking/timeline de dispute.

---

## 5. EP-06 ? Inclusão / Coach

Consents · utilities · alternative-data · thinfile · coach · missions · marketplace · drift  
Flyway V31?V39 · commit `e3ebc6f`

---

## 6. EP-03 ? ADIADO (GenAI)

**Não plugar.** Núcleo Bedrock/RAG = Python. Noah não implementa neste ciclo.

---

## 7. Ressalvas gerais

- WORM lab = FS (`prisma.worm.backend=fs`); prod pode ser S3 Object Lock
- SHAP / DiCE / ONNX / Fairlearn / Neptune = stubs
- Flyway Supabase até **V49** (align sha256 CHAR?VARCHAR)
- Gaps de shape ? listar p/ Noah (sem inventar campo)

---

## 8. Commits âncora

| Commit | Escopo |
|--------|--------|
| `6d723af` | EP-01 |
| `f6192a1` | EP-02 |
| `e3ebc6f` | EP-06 |
| `7ccd4aa` | EP-05 |
| `9aa6fcf` | EP-04 |
| `e4e9a64` | WORM S3 switch |
| `d531e0f` | OIDC CTs + Backend CI |
| `582f710` | Flyway V49 + doc smoke OIDC |

_Noah: Sprint 6 hardening OK (OIDC smoke, WORM/S3, CI). GenAI continua adiado._
