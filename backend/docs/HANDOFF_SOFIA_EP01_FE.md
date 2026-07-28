# Handoff Noah → Sofia — O que plugar (EP-01 + EP-02)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 14:20 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` · `origin/main` ≥ `f6192a1` |
| **Auth lab** | `OIDC_ENABLED=false` (APIs abertas) · JWT roles no SecurityConfig p/ prod |
| **CORS** | `http://localhost:5173` · `http://localhost:3000` (`prisma.cors.allowed-origins`) |
| **Base URL** | `http://localhost:8080` · profiles `supabase,infra` |

**Legenda:** 🟢 plugar agora · 🟡 plugar com ressalva (stub lab) · 🔴 ausente

---

## 1. EP-01 — Score Vivo (10/10 plugável)

| US-FE | Status | Endpoints BE |
|-------|--------|--------------|
| F01 Streams health | 🟡 | `GET /api/v1/streams/health` · `GET /events/{id}` · `POST /events/credit` |
| F02 Features catalog | 🟢 | `GET /features/catalog` · `GET /features/{doc}` · `POST /features/batch` |
| F03 Score timeline | 🟢 | `GET /score/{doc}` · `/history` · `POST /score/recalculate` |
| F04 Snapshot compare | 🟢 | `GET /decisions/{id}` · `/snapshot` · `POST .../verify` |
| F05 Playground | 🟢 | `POST /decisions` · `GET /decisions/{id}` · `GET /decisions/budget` |
| F06 Ingest sources | 🟢 | `GET /ingest/sources` · `POST /ingest/replay` |
| F07 Identity merge | 🟢 | `GET /identity/candidates` · `/{doc}` · `POST /merge` · `/merge/undo` |
| F08 SLO panel | 🟡 | `GET /observability/slo` · `/budget` · `/traces/{decisionId}` |
| F09 Model registry | 🟢 | `GET /models` · `POST .../promote` · `.../rollback` |
| F10 Replay jobs | 🟡 | `POST /replay/jobs` · `GET .../{jobId}` · `POST .../abort` |

**Ordem EP-01:** F02 → F03 → F09 → F07 → F05 → F04 → F06 → F01 → F08 → F10

---

## 2. EP-02 — Explicável (10/10 plugável) — **NOVO**

| US-FE | Status | Endpoints BE |
|-------|--------|--------------|
| F01 Fatores / explain | 🟡 | `GET /explain/{decisionId}` · `/factors` · `POST /explain/batch` |
| F02 Contrafactuais | 🟡 | `GET /counterfactual/{decisionId}` · `POST /counterfactual/simulate` |
| F03 Dossiê LGPD | 🟡 | `POST /dossier` · `GET /dossier/{id}` · `GET .../download` |
| F04 Trilha auditoria | 🟡 | `GET /audit/trail` · `/trail/{doc}` · `POST /audit/export` (202) |
| F05 Motivos recusa | 🟢 | `GET /reasons` · `POST /reasons` · `GET /reasons/resolve/{decisionId}` |
| F06 Revisão humana | 🟢 | `GET /reviews/queue` · `POST /reviews` · `PATCH .../decide` |
| F07 Fairness | 🟡 | `GET /fairness/metrics` · `/alerts` · `POST /fairness/analyze` (202) |
| F08 Fila direitos | 🟢 | `GET/POST /subject-requests` · `PATCH /subject-requests/{id}` |
| F09 Simulação política | 🟡 | `GET /policy/baseline` · `POST /policy/simulate` · `GET /policy/simulations/{id}` |
| F10 Versões política | 🟢 | `GET /policy/versions` · `.../diff/{a}/{b}` · `POST .../publish` |

**Ordem EP-02 sugerida:**  
1. F05 reasons · 2. F10 policy versions · 3. F01 explain (após `POST /decisions` c/ `includeExplanation=true`)  
4. F02 counterfactual · 5. F06 reviews · 6. F08 subject-requests · 7. F04 audit  
8. F03 dossier · 9. F09 simulate · 10. F07 fairness  

**Fluxo feliz FE:** `POST /decisions` → `decisionId` → explain + counterfactual + reasons/resolve → dossier.

---

## 3. Ressalvas lab (Sofia)

| Tema | Detalhe |
|------|---------|
| SHAP / DiCE / PDF | Stubs Java — não Python TreeExplainer / DiCE / PDFBox real |
| WORM | FS `./data/worm` · `./data/audit-worm` · `./data/dossier` — não S3 Object Lock |
| Fairness / simulate | Analyze/simulate **202** síncrono stub — sem Fairlearn/Spark |
| Kafka health / OTel | Métricas parciais |
| Outcome decisão | Threshold stub até policy Drools real |
| Shapes | Divergência mock FE vs JSON BE → gap list p/ Noah (sem inventar campo) |
| EP-03…06 | **Ainda não** plugar — Noah em Sprint 5 (EP-05) agora |

---

## 4. Commits BE relevantes

| Commit | Escopo |
|--------|--------|
| `76509bd`…`6d723af` | EP-01 S1–S3 + F08/F10 |
| `6cc5fdd` | Handoff EP-01 inicial |
| `9dd02c3` | EP-02 F10/F05/F04 + CORS |
| `8df606c` | EP-02 F01–F03 |
| `f6192a1` | EP-02 F06–F09 (épico lab fechado) |

OpenAPI: `/swagger-ui.html` · `/v3/api-docs`

_Relatório: `backend/docs/RELATORIO_PROGRESSO_BACKEND.md`_

---

## 5. EP-05 � Contesta��o / Console (9/9 lab) � **NOVO** (6cb93f4+)

| �rea | Status | Endpoints |
|------|--------|-----------|
| Self-service F05 | ?? | /api/v1/self-service/identify � /records � /disputes |
| Disputes F02/F01/F08 | ?? | /disputes � /queue � /resolve � /tracking � /timeline � /attachments � /evidence-pack |
| SLA F06 | ?? | /sla/status � /sla/policies � /sla/escalations |
| Onboarding F03 | ?? | /onboarding/start � /{id}/verify � /{id}/complete |
| Credentials F07 | ?? | POST/DELETE /credentials � /rotate |
| Console F04 | ?? | /console/usage � /invoices � /contracts |
| Analytics F09 | ?? | /analytics/deflection � /sac-cost � /baseline |

EP-03/EP-04/EP-06 ainda **fora** (pr�ximo plano Noah = EP-06 ou EP-04).

---

## 6. EP-06 — Score Inclusão + Coach B2C (9/9 lab) — **NOVO**

Auth lab: `OIDC_ENABLED=false`. Roles prod: `TITULAR_B2C` · `SYSTEM_INGEST` · `SCORE_CONSUMER` · `MODEL_OPS`.

| F | Status | Endpoints |
|---|--------|-----------|
| F04 Consent | stub | `POST /api/v1/consents` · `GET /consents/{documento}` · `DELETE /consents/{consentId}` |
| F08 Utilities | stub | `POST /utilities/link` · `GET /utilities/links?documento=` · `DELETE /utilities/links/{linkId}` |
| F01 Alt data | stub | `POST /alternative-data/ingest` · `GET /coverage` · `GET /quality` |
| F02 Thin-file | stub | `POST /thinfile/score` · `GET /thinfile/model-card` · `GET /thinfile/{documento}` |
| F03 Coach | stub | `GET /coach/journey?documento=` · `POST /coach/goals` · `GET /coach/progress` |
| F05 Missions | stub | `GET /missions?documento=` · `POST /missions/{id}/progress` · `GET /missions/achievements` |
| F06 Simulate | stub | `POST /coach/simulate` · `GET /coach/simulations/history?documento=` |
| F07 Marketplace | stub | `GET /marketplace/offers?documento=` · `POST /offers/{id}/apply` · `GET /eligibility` |
| F09 Drift | stub | `GET /thinfile/monitoring` · `GET /thinfile/drift` · `POST /thinfile/monitoring/evaluate` |

Ordem plug: F04 → F08 → F01 → F02 → F03 → F05 → F06 → F07 → F09.  
DEV_RECORD: `docs/DEV_RECORD_EP06.md` · Flyway V31–V39.
