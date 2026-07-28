# Handoff Noah ? Sofia ? Matriz FE � BE

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 19:30 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` � lab local `:8080` |
| **Base URL** | `http://localhost:8080` � profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` � `/v3/api-docs` |
| **CORS** | `http://localhost:5173` � `http://localhost:3000` |
| **Auth lab agora** | `OIDC_ENABLED=false` (APIs abertas) |
| **Liveness lab** | `LIVENESS_MODE=http` � mock `http://192.168.31.47:8093` |
| **Lab marker** | Header `X-Prisma-Lab: true` (OBS-04) ? n�o � produ��o |

**Mapa hosts:** [`MAPA_HOSTS_FE.md`](./MAPA_HOSTS_FE.md) � Auditoria OBS: [`DEV_RECORD_AUDITORIA_OBS.md`](./DEV_RECORD_AUDITORIA_OBS.md)

**Legenda:** OK = plugar agora � STUB = lab stub � SKIP = fora / adiado

---

## Auth lab ? ler antes de plugar

### Situa��o agora

| Item | Estado |
|------|--------|
| `.env` | `OIDC_ENABLED=false` |
| Processo `:8080` | UP � OIDC off |
| Health | `GET /actuator/health` ? **200** (sempre p�blico) |
| Liveness | modo **http** ? WireMock lab |

### Se Sofia come�ar a tomar 401

Causa t�pica: BE subiu com `OIDC_ENABLED=true` e o processo ficou vivo.

| Sintoma | Significado |
|---------|-------------|
| `GET /api/v1/identity/candidates` ? **401** | OIDC on |
| Mesmo path ? **200** | lab aberto |

**Op��o A (recomendado no plug FE):** `.env` com `OIDC_ENABLED=false` + **reiniciar** Spring. S� editar `.env` **n�o** altera processo j� rodando.

**Op��o B (demo Keycloak):** Bearer em toda rota protegida.

Issuer lab: `http://192.168.31.47:8180/realms/prisma`  
Client: `prisma-backend` (secret s� no `.env` / vault ? **n�o** commit no FE)

| Path (prefixo `/api/v1`) | Auth (quando OIDC on) |
|--------------------------|------------------------|
| `/identity/**` | JWT + `DATA_STEWARD` / `PLATFORM` |
| `/features/**` | JWT + `ML` / `ANALISTA_RISCO` / `PLATFORM` |
| `/decisions/**` | JWT + `COMPLIANCE` / `B2B` / `PLATFORM` |
| `/portfolio/**` | JWT + `RISK_ANALYST` / ? / `PLATFORM` |
| `/pj/opinions/*/submit` | `ANALISTA_PJ` |
| `/pj/opinions/*/approve` | `APROVADOR_PJ_L1\|L2\|L3` |
| `/pj/opinions/*/trail` | `AUDIT` / aprovadores |
| `/auth/biometric-consent`, `/auth/liveness/**` | `CITIZEN` / `USER` / `ONBOARDING` / `TITULAR_B2C` / `PLATFORM` |
| `/self-service/**`, `/onboarding/**` | p�blico |
| `GET /disputes/*/tracking`, `*/timeline` | p�blico |
| `/actuator/health` | p�blico |

Sem token em rota protegida ? **401**. Role errada ? **403**.

---

## Resumo �picos

| �pico | Lab | Sofia |
|-------|----:|-------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explic�vel | 10/10 | **Sim** |
| **EP-04** Portf�lio / Grafo | 9/9 | **Sim** (Neo4j lab / stubs onde couber) |
| **EP-05** Contesta��o / Console | 9/9 | **Sim** |
| **EP-05 F01 BIO** Liveness | ?? V51 + WireMock | **Plugar agora** (session stub/mock) |
| **EP-06** Inclus�o / Coach | 9/9 | **Sim** |
| **EP-03** Copiloto PJ | F04 HITL + BFF GenAI | **Tudo via `:8080`** (Python interno) |

---

## 1. EP-01 ? Score Vivo

Prefixo `/api/v1`

| F | St | Endpoints |
|---|----|-----------|
| F01 | OK | `GET /streams/health` � `GET /events/{id}` � `POST /events/credit` |
| F02 | OK | `GET /features/catalog` � `GET /features/{doc}` � `POST /features/batch` |
| F03 | OK | `GET /score/{doc}` � `/history` � `POST /score/recalculate` |
| F04 | OK | `GET /decisions/{id}` � `/snapshot` � `POST .../verify` |
| F05 | OK | `POST /decisions` � `GET /decisions/{id}` � `GET /decisions/budget` |
| F06 | OK | `GET /ingest/sources` � `POST /ingest/replay` |
| F07 | OK | `GET /identity/candidates` � `/{doc}` � `POST /merge` � `/merge/undo` |
| F08 | OK | `GET /observability/slo` � `/budget` � `/traces/{decisionId}` |
| F09 | OK | `GET /models` � `POST .../promote` � `.../rollback` |
| F10 | OK | `POST /replay/jobs` � `GET .../{jobId}` � `POST .../abort` |

---

## 2. EP-02 ? Explic�vel

| F | St | Endpoints |
|---|----|-----------|
| F01 | OK | `GET /explain/{decisionId}` � `/factors` � `POST /explain/batch` |
| F02 | OK | `GET /counterfactual/{decisionId}` � `POST /counterfactual/simulate` |
| F03 | OK | `POST /dossier` � `GET /dossier/{id}` � `/download` |
| F04 | OK | `GET /audit/trail` � `/trail/{doc}` � `POST /audit/export` |
| F05 | OK | `GET /reasons` � `POST /reasons` � `GET /reasons/resolve/{decisionId}` |
| F06 | OK | `GET /reviews/queue` � `POST /reviews` � `PATCH .../decide` |
| F07 | OK | `GET /fairness/metrics` � `/alerts` � `POST /fairness/analyze` |
| F08 | OK | `GET/POST /subject-requests` � `PATCH /subject-requests/{id}` |
| F09 | OK | `GET /policy/baseline` � `POST /policy/simulate` � `GET /policy/simulations/{id}` |
| F10 | OK | `GET /policy/versions` � `.../diff/{a}/{b}` � `POST .../publish` |

---

## 3. EP-04 ? Portf�lio

Todos sob `/api/v1/portfolio/*`

| F | Endpoints |
|---|-----------|
| F01 Grafo | `GET /graph` � `GET /graph/node/{id}` � `POST /graph/filter` |
| F02 Cont�gio | `POST /contagion/simulate` � `GET /contagion/{simId}` � `GET /contagion/critical` |
| F03 Stress | `POST /stress/run` � `GET /stress/scenarios` � `GET /stress/{runId}` |
| F04 Limites | `GET /concentration` � `POST /limits` � `GET /alerts` |
| F05 Cubos | `GET /aggregates` � `POST /aggregates/refresh` � `GET /aggregates/freshness` |
| F06 Comunidades | `POST /communities/detect` � `GET /communities` � `GET /communities/{id}` |
| F07 Hist�rico | `GET /snapshot` � `POST /compare` � `GET /timeline` |
| F08 Reports | `POST /reports` � `GET /reports/{id}` � `GET .../download` |
| F09 2D/tabular | `GET /graph/2d` � `GET /graph/tabular` |

Lab: `GRAPH_BACKEND=neo4j` em `192.168.31.47:7687` (quando host OK).

---

## 4. EP-05 ? Contesta��o / Console + Biometria

### 4.1 Contesta��o / Console (j� lab)

Self-service � disputes � tracking � attachments � SLA � onboarding � credentials � console � analytics.

Rotas p�blicas �teis: `/api/v1/self-service/**`, `/api/v1/onboarding/**`, tracking/timeline.

### 4.2 F01 BIO ? Liveness (novo � Noah � 2026-07-28)

**Ownership:** Noah (n�o � produto externo). Flyway **V51**.

| M�todo | Path | Uso FE |
|--------|------|--------|
| `POST` | `/api/v1/auth/biometric-consent` | Pr�-req LGPD (RN006) ? chamar **antes** da sess�o |
| `POST` | `/api/v1/auth/liveness/session` | Cria sess�o � header opcional `X-Idempotency-Key` |

**Request sess�o (exemplo):**

```json
{
  "customer_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "device_info": { "platform": "iOS", "app_version": "2.14.0" },
  "audit_context": { "channel": "MOBILE_APP" }
}
```

**Response `201`:** `session_id`, `customer_id`, `status=CREATED`, `created_at`, `expires_at` (+3 min), `from_cache`.

| C�digo | Quando |
|--------|--------|
| `412` | Sem consentimento ACTIVE |
| `429` | Lockout biom�trico |
| `409` | Idempotency key + payload divergente |
| `403` | OIDC on e `customer_id` ? `sub` |

**Rekognition lab:**

| Modo | Env | FE |
|------|-----|-----|
| `http` (lab atual) | WireMock `http://192.168.31.47:8093` | Usa `session_id` mock ? UI pode avan�ar sem Amplify AWS |
| `stub` | UUID local no Java | Idem |
| `aws` | futuro | S� a� FaceLivenessDetector Amplify real |

Runbook servidor: [`INSTRUCAO_SERVIDOR_LIVENESS.md`](./INSTRUCAO_SERVIDOR_LIVENESS.md)  
Provisionamento: [`PROVISIONAMENTO_LIVENESS_REKOGNITION.md`](./PROVISIONAMENTO_LIVENESS_REKOGNITION.md)

**Fora deste slice:** GetFaceLivenessSessionResults / scoring / JWT IAL3.

---

## 5. EP-06 ? Inclus�o / Coach

Consents � utilities � alternative-data � thinfile � coach � missions � marketplace � drift  
Flyway V31?V39

---

## 6. EP-03 — F04 HITL + BFF GenAI (FE so :8080)

| Parte | Host | Sofia |
|-------|------|-------|
| **F04 HITL** (submit / approve / trail) | Noah Java `:8080` | **Plugar agora** |
| GenAI (RAG, parecer, ratios, guardrails, library, docs) | Noah BFF `:8080` -> Emilly `:8090` | **Mesmos paths**, base URL **so** `:8080` |

Ver [`HANDOFF_SOFIA_BFF_GENAI.md`](./HANDOFF_SOFIA_BFF_GENAI.md).

### F04 — endpoints Java

Commit ancora: `0b537cd` · Flyway **V50** · smoke cruzado Emilly↔Noah **OK**

| Metodo | Path |
|--------|------|
| `POST` | `/api/v1/pj/opinions/{id}/submit` |
| `POST` | `/api/v1/pj/opinions/{id}/approve` |
| `GET` | `/api/v1/pj/opinions/{id}/trail` |
| `GET` | `/api/v1/pj/genai/health` (BFF -> Python) |

Telas FE alvo: `OpinionEditorPage` (submit) · `ApprovalPage` (approve/reject + trail) · `GuardrailsPage` (submit pos-verify).

**Proibido:** browser -> `:8090`. GenAI so via BFF Java.

Contrato HITL: [`HANDOFF_EMILLY_NOAH_EP03_F04.md`](./HANDOFF_EMILLY_NOAH_EP03_F04.md)

---

## 7. Ressalvas gerais

- WORM lab = FS (`prisma.worm.backend=fs`); prod pode ser S3 Object Lock
- ONNX / Fairlearn / Neo4j = adapters lab em `192.168.31.47` (ONNX pode estar `model_loaded=false` ? fallback)
- Flyway Supabase at� **V51** (Liveness) � V50 HITL � V49 sha256
- Face Liveness **n�o** existe no LocalStack ? usar WireMock/`stub`
- Gaps de shape ? listar p/ Noah (sem inventar campo)

---

## 8. Alinhamento Sofia ? o que ainda fica

| Item | Dono | Nota |
|------|------|------|
| **EP-03 F04 HITL live** | **Sofia** | Noah lab OK ? plugar submit/approve/trail |
| **EP-05 Liveness live** | **Sofia** | Consent + create session � `session_id` mock OK no lab |
| **EP-03 GenAI live** | **Sofia** | Base URL `:8080` (BFF) — **nao** `:8090` |
| **P1** hardening FE gaps OpenAPI | **Sofia** | Noah s� se FE listar diverg�ncia |
| **P6** login OIDC PKCE | **Sofia** backlog | Lab `OIDC_ENABLED=false` |
| Amplify Face Liveness real | Sofia + Noah `aws` | Fora lab mock |

### Ack Noah (2026-07-28) ? registrado neste handoff

- F04 HITL no ar (`:8080`) � V50
- Liveness no ar (`/api/v1/auth/liveness/*`) � V51 � WireMock `:8093`
- Smoke consent ? session `CREATED` OK
- **BFF GenAI** — FE so `:8080`; Python interno

---

## 9. Commits �ncora

| Commit | Escopo |
|--------|--------|
| `9aa6fcf` | EP-04 |
| `e4e9a64` | WORM S3 switch |
| `d531e0f` | OIDC CTs + Backend CI |
| `582f710` | Flyway V49 + doc smoke OIDC |
| `c852a76` | Handoff Sofia Auth / 401 |
| `0b537cd` | EP-03 F04 HITL Java |
| *(local / pr�ximo push)* | EP-05 F01 Liveness V51 + WireMock |

---

_Noah � 2026-07-28 19:30 � F04 HITL + Liveness lab OK � Sofia pluga FE_
