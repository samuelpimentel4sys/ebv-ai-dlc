# Handoff Noah ? Sofia ? Matriz FE × BE (atualizado)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Atualizado** | 2026-07-28 15:35 (America/Sao_Paulo) |
| **BE** | `Prisma/backend` · lab EP-04 local (**sem commit** neste slice) |
| **Auth lab** | `OIDC_ENABLED=false` (APIs abertas) · roles JWT no SecurityConfig p/ prod |
| **CORS** | `http://localhost:5173` · `http://localhost:3000` |
| **Base URL** | `http://localhost:8080` · profiles `supabase,infra` |
| **OpenAPI** | `/swagger-ui.html` · `/v3/api-docs` |

**Legenda:** ? plugar agora · ?? plugar com ressalva (stub lab) · ? ausente no BE

---

## Resumo executivo

| Épico | Features lab | Sofia pode plugar? |
|-------|-------------:|--------------------|
| **EP-01** Score Vivo | 10/10 | **Sim** |
| **EP-02** Explicável | 10/10 | **Sim** |
| **EP-05** Contestação / Console | 9/9 | **Sim** |
| **EP-06** Inclusão / Coach | 9/9 | **Sim** |
| **EP-04** Portfólio / Grafo | 9/9 | **Sim** (lab stubs) |
| **EP-03** Copiloto PJ | 0 | ? GenAI Python + HITL Java pendente |

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

## 4. EP-06 ? Inclusão / Coach (9/9)

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

## 5. EP-04 ? Portfólio / Sala de Risco (9/9) ? **NOVO / PLUGÁVEL**

Base: `/api/v1/portfolio` · header `X-Tenant-Id` · lab stubs (Neptune/Trino/Iceberg/Spark **não** reais).

| US-FE | Status | Endpoints |
|-------|--------|-----------|
| F01 Grafo carteira | ?? | `GET /portfolio/graph` · `GET /portfolio/graph/node/{nodeId}` · `POST /portfolio/graph/filter` |
| F02 Contágio | ?? | `POST /portfolio/contagion/simulate` (202) · `GET /portfolio/contagion/{simId}` · `GET /portfolio/contagion/critical` |
| F03 Estresse | ?? | `POST /portfolio/stress/run` · `GET /portfolio/stress/scenarios` · `GET /portfolio/stress/{runId}` |
| F04 Limites | ?? | `GET /portfolio/concentration` · `POST /portfolio/limits` · `GET /portfolio/alerts` |
| F05 Cubos | ?? | `GET /portfolio/aggregates` · `POST /portfolio/aggregates/refresh` (202) · `GET /portfolio/aggregates/freshness` |
| F06 Comunidades | ?? | `POST /portfolio/communities/detect` (202) · `GET /portfolio/communities` · `GET /portfolio/communities/{communityId}` |
| F07 Histórico | ?? | `GET /portfolio/snapshot` · `POST /portfolio/compare` · `GET /portfolio/timeline` |
| F08 Dossiê | ?? | `POST /portfolio/reports` (202) · `GET /portfolio/reports/{reportId}` · `GET /portfolio/reports/{reportId}/download` |
| F09 Projeção 2D | ?? | `GET /portfolio/graph/2d` · `GET /portfolio/graph/tabular` |

**Ordem plug sugerida:** F05 (frescor) ? F01 ? F09 ? F04 ? F02 ? F03 ? F06 ? F07 ? F08  
**DEV_RECORD:** `docs/DEV_RECORD_EP04.md` · Flyway **V40?V48**

---

## 6. Ressalvas lab (todas)

| Tema | Detalhe |
|------|---------|
| SHAP / DiCE / PDF / Fairlearn / Spark | Stubs Java ? não motores reais |
| Neptune / Trino / Iceberg | EP-04 stubs ? topologia/agregados sintéticos |
| WORM | FS local (`./data/worm`, ?) ? não S3 Object Lock |
| Serpro / concessionária / ONNX thin-file | Stubs |
| Kafka health / OTel | Métricas parciais |
| Shapes | Gap FE vs BE ? listar p/ Noah; **não inventar campo** fora da US |
| EP-03 | **Ainda não** no BE |

---

## 7. Commits BE âncora

| Commit | Escopo |
|--------|--------|
| `76509bd` ? `6d723af` | EP-01 |
| `9dd02c3` ? `f6192a1` | EP-02 |
| `6cb93f4` ? `7ccd4aa` | EP-05 |
| `e3ebc6f` | EP-06 lab 9/9 |
| _(local)_ | EP-04 lab 9/9 ? **sem commit** |

_Relatório: `backend/docs/RELATORIO_PROGRESSO_BACKEND.md`_
