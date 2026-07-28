# Handoff Noah ? Sofia ? Matriz FE × BE

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 15:40 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` · `origin/main` ? `9aa6fcf` |
| **Auth lab** | `OIDC_ENABLED=false` · CORS `:5173` / `:3000` |
| **Base URL** | `http://localhost:8080` · profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` · `/v3/api-docs` |

**Legenda:** ?? plugar agora · ?? stub lab · ?? fora / adiado

---

## Resumo

| Épico | Lab | Sofia |
|-------|----:|-------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explicável | 10/10 | **Sim** |
| **EP-04** Portfólio / Grafo | 9/9 | **Sim** (stubs Neptune/Trino) |
| **EP-05** Contestação / Console | 9/9 | **Sim** |
| **EP-06** Inclusão / Coach | 9/9 | **Sim** |
| **EP-03** Copiloto PJ / GenAI | ? | ?? **ADIADO** (núcleo Python/Bedrock ? fora do escopo Noah agora) |

---

## 1. EP-01 ? Score Vivo

| F | St | Endpoints |
|---|----|-----------|
| F01 | ?? | `GET /streams/health` · `GET /events/{id}` · `POST /events/credit` |
| F02 | ?? | `GET /features/catalog` · `GET /features/{doc}` · `POST /features/batch` |
| F03 | ?? | `GET /score/{doc}` · `/history` · `POST /score/recalculate` |
| F04 | ?? | `GET /decisions/{id}` · `/snapshot` · `POST .../verify` |
| F05 | ?? | `POST /decisions` · `GET /decisions/{id}` · `GET /decisions/budget` |
| F06 | ?? | `GET /ingest/sources` · `POST /ingest/replay` |
| F07 | ?? | `GET /identity/candidates` · `/{doc}` · `POST /merge` · `/merge/undo` |
| F08 | ?? | `GET /observability/slo` · `/budget` · `/traces/{decisionId}` |
| F09 | ?? | `GET /models` · `POST .../promote` · `.../rollback` |
| F10 | ?? | `POST /replay/jobs` · `GET .../{jobId}` · `POST .../abort` |

Prefixo: `/api/v1`

---

## 2. EP-02 ? Explicável

| F | St | Endpoints |
|---|----|-----------|
| F01 | ?? | `GET /explain/{decisionId}` · `/factors` · `POST /explain/batch` |
| F02 | ?? | `GET /counterfactual/{decisionId}` · `POST /counterfactual/simulate` |
| F03 | ?? | `POST /dossier` · `GET /dossier/{id}` · `/download` |
| F04 | ?? | `GET /audit/trail` · `/trail/{doc}` · `POST /audit/export` |
| F05 | ?? | `GET /reasons` · `POST /reasons` · `GET /reasons/resolve/{decisionId}` |
| F06 | ?? | `GET /reviews/queue` · `POST /reviews` · `PATCH .../decide` |
| F07 | ?? | `GET /fairness/metrics` · `/alerts` · `POST /fairness/analyze` |
| F08 | ?? | `GET/POST /subject-requests` · `PATCH /subject-requests/{id}` |
| F09 | ?? | `GET /policy/baseline` · `POST /policy/simulate` · `GET /policy/simulations/{id}` |
| F10 | ?? | `GET /policy/versions` · `.../diff/{a}/{b}` · `POST .../publish` |

---

## 3. EP-04 ? Portfólio (NOVO plugável)

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

Self-service · disputes · tracking · attachments · SLA · onboarding · credentials · console · analytics  
(detalhe completo no commit `7ccd4aa` / `HANDOFF` histórico)

---

## 5. EP-06 ? Inclusão / Coach

Consents · utilities · alternative-data · thinfile · coach · missions · marketplace · drift  
Flyway V31?V39 · commit `e3ebc6f`

---

## 6. EP-03 ? ADIADO (GenAI)

**Não plugar.** Núcleo Bedrock/RAG/parecer GenAI = serviço Python.  
Noah **não** implementa agora. HITL Java (alçada) só se Walter reabrir o épico sem GenAI.

---

## 7. Ressalvas gerais

WORM = FS local · SHAP/DiCE/ONNX/Fairlearn = stubs · `OIDC_ENABLED=false` no lab · gaps de shape ? listar p/ Noah (sem inventar campo).

## 8. Commits âncora

| Commit | Escopo |
|--------|--------|
| ?`6d723af` | EP-01 |
| ?`f6192a1` | EP-02 |
| `e3ebc6f` | EP-06 |
| `7ccd4aa` | EP-05 close |
| `9aa6fcf` | EP-04 |
| `617dcc0` | Handoff consolidado (pré-EP-04 fix) |

_Próximo Noah: Sprint 6 hardening (OIDC smoke, WORM/S3 port, Testcontainers) ? sem GenAI._
