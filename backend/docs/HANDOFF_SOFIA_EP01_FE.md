# Handoff Noah ? Sofia ? Matriz FE × BE (atualizado)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 15:20 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` · `origin/main` ? `e3ebc6f` |
| **Auth lab** | `OIDC_ENABLED=false` (APIs abertas) · roles JWT no SecurityConfig p/ prod |
| **CORS** | `http://localhost:5173` · `http://localhost:3000` |
| **Base URL** | `http://localhost:8080` · profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` · `/v3/api-docs` |

**Legenda:** ?? plugar agora · ?? plugar com ressalva (stub lab) · ?? ausente no BE

---

## Resumo executivo

| Épico | Features lab | Sofia pode plugar? |
|-------|-------------:|--------------------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explicável | 10/10 | **Sim** |
| **EP-05** Contestação / Console | 9/9 | **Sim** |
| **EP-06** Inclusão / Coach | 9/9 | **Sim** |
| **EP-03** Copiloto PJ | 0 | ?? GenAI Python + HITL Java pendente |
| **EP-04** Portfólio / Grafo | 0 | ?? Próximo Noah (ou hardening) |

---

## 1. EP-01 ? Score Vivo (10/10)

| US-FE | Status | Endpoints |
|-------|--------|-----------|
| F01 Streams | ?? | `GET /api/v1/streams/health` · `GET /events/{id}` · `POST /events/credit` |
| F02 Features | ?? | `GET /features/catalog` · `GET /features/{doc}` · `POST /features/batch` |
| F03 Score | ?? | `GET /score/{doc}` · `/history` · `POST /score/recalculate` |
| F04 Snapshot | ?? | `GET /decisions/{id}` · `/snapshot` · `POST .../verify` |
| F05 Playground | ?? | `POST /decisions` · `GET /decisions/{id}` · `GET /decisions/budget` |
| F06 Ingest | ?? | `GET /ingest/sources` · `POST /ingest/replay` |
| F07 Identity | ?? | `GET /identity/candidates` · `/{doc}` · `POST /merge` · `/merge/undo` |
| F08 SLO | ?? | `GET /observability/slo` · `/budget` · `/traces/{decisionId}` |
| F09 Models | ?? | `GET /models` · `POST .../promote` · `.../rollback` |
| F10 Replay | ?? | `POST /replay/jobs` · `GET .../{jobId}` · `POST .../abort` |

**Ordem:** F02 ? F03 ? F09 ? F07 ? F05 ? F04 ? F06 ? F01 ? F08 ? F10

---

## 2. EP-02 ? Explicável (10/10)

| US-FE | Status | Endpoints |
|-------|--------|-----------|
| F01 Explain | ?? | `GET /explain/{decisionId}` · `/factors` · `POST /explain/batch` |
| F02 Contrafactual | ?? | `GET /counterfactual/{decisionId}` · `POST /counterfactual/simulate` |
| F03 Dossiê | ?? | `POST /dossier` · `GET /dossier/{id}` · `GET .../download` |
| F04 Audit | ?? | `GET /audit/trail` · `/trail/{doc}` · `POST /audit/export` (202) |
| F05 Motivos | ?? | `GET /reasons` · `POST /reasons` · `GET /reasons/resolve/{decisionId}` |
| F06 Reviews | ?? | `GET /reviews/queue` · `POST /reviews` · `PATCH .../decide` |
| F07 Fairness | ?? | `GET /fairness/metrics` · `/alerts` · `POST /fairness/analyze` (202) |
| F08 Subject-requests | ?? | `GET/POST /subject-requests` · `PATCH /subject-requests/{id}` |
| F09 Policy sim | ?? | `GET /policy/baseline` · `POST /policy/simulate` · `GET /policy/simulations/{id}` |
| F10 Policy versions | ?? | `GET /policy/versions` · `.../diff/{a}/{b}` · `POST .../publish` |

**Fluxo:** `POST /decisions` (`includeExplanation=true`) ? explain ? counterfactual ? reasons/resolve ? dossier.

---

## 3. EP-05 ? Contestação / Console (9/9)

| Área | Status | Endpoints |
|------|--------|-----------|
| F05 Self-service | ?? | `POST /self-service/identify` · `GET /records` · `POST /disputes` |
| F02 Workflow | ?? | `POST /disputes` · `GET /disputes/queue` · `PATCH /disputes/{id}/resolve` |
| F01 Tracking | ?? | `GET /disputes/{protocol}/tracking` · `/timeline` |
| F08 Anexos | ?? | `POST/GET /disputes/{id}/attachments` · `GET .../evidence-pack` |
| F06 SLA | ?? | `GET /sla/status` · `POST /sla/policies` · `GET /sla/escalations` |
| F03 Onboarding | ?? | `POST /onboarding/start` · `/{id}/verify` · `/{id}/complete` |
| F07 Credentials | ?? | `POST /credentials` · `POST .../rotate` · `DELETE /credentials/{id}` |
| F04 Console | ?? | `GET /console/usage` · `/invoices` · `/contracts` |
| F09 Analytics SAC | ?? | `GET /analytics/deflection` · `/sac-cost` · `/baseline` |

**Ordem:** self-service ? disputes ? tracking ? attachments ? SLA ? onboarding ? credentials ? console ? analytics.

---

## 4. EP-06 ? Inclusão / Coach (9/9) ? **NOVO**

| US-FE | Status | Endpoints |
|-------|--------|-----------|
| F04 Privacidade / consent | ?? | `POST /consents` · `GET /consents/{documento}` · `DELETE /consents/{consentId}` |
| F08 Vinculação consumo | ?? | `POST /utilities/link` · `GET /utilities/links` · `DELETE /utilities/links/{linkId}` |
| F01 Monitor parceiros / alt | ?? | `POST /alternative-data/ingest` · `GET /alternative-data/coverage` · `GET /quality` |
| F02 Thin-file | ?? | `POST /thinfile/score` · `GET /thinfile/model-card` · `GET /thinfile/{documento}` |
| F03 Jornada coach | ?? | `GET /coach/journey` · `POST /coach/goals` · `GET /coach/progress` |
| F05 Catálogo missões | ?? | `GET /missions` · `POST /missions/{id}/progress` · `GET /missions/achievements` |
| F06 Simulador impacto | ?? | `POST /coach/simulate` · `GET /coach/simulations/history` |
| F07 Vitrine ofertas | ?? | `GET /marketplace/offers` · `POST /marketplace/offers/{id}/apply` · `GET /marketplace/eligibility` |
| F09 Painel deriva | ?? | `GET /thinfile/monitoring` · `GET /thinfile/drift` · `POST /thinfile/monitoring/evaluate` |

**Ordem plug:** F04 ? F08 ? F01 ? F02 ? F03 ? F05 ? F06 ? F07 ? F09  
**DEV_RECORD:** `docs/DEV_RECORD_EP06.md` · Flyway **V31?V39**

---

## 5. Ressalvas lab (todas)

| Tema | Detalhe |
|------|---------|
| SHAP / DiCE / PDF / Fairlearn / Spark | Stubs Java ? não motores reais |
| WORM | FS local (`./data/worm`, `audit-worm`, `dossier`, `dispute-evidence`) ? não S3 Object Lock |
| Serpro / concessionária / ONNX thin-file | Stubs |
| Kafka health / OTel | Métricas parciais |
| Shapes | Gap FE vs BE ? listar p/ Noah; **não inventar campo** fora da US |
| EP-03 / EP-04 | **Ainda não** no BE |

---

## 6. Commits BE âncora

| Commit | Escopo |
|--------|--------|
| `76509bd` ? `6d723af` | EP-01 |
| `9dd02c3` ? `f6192a1` | EP-02 |
| `6cb93f4` ? `7ccd4aa` | EP-05 |
| `e3ebc6f` | EP-06 lab 9/9 |

_Relatório: `backend/docs/RELATORIO_PROGRESSO_BACKEND.md`_
