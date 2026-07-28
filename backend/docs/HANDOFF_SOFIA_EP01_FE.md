# Handoff Noah → Sofia — O que plugar agora (EP-01)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (frontend) |
| **Data** | 2026-07-28 |
| **BE base** | `Prisma/backend` · `origin/main` (inclui F08/F10) |
| **US FE** | `99.DownStream/.../User Stories/Frontend` (EP-01 F01–F10) |
| **Auth lab** | `OIDC_ENABLED=false` → APIs abertas no smoke; contratos JWT prontos no SecurityConfig |

---

## Veredito rápido

**Sofia pode plugar as 10 US-FE do EP-01** — todos os endpoints primários das US-FE existem no BE lab.

| Prioridade | Significado |
|------------|-------------|
| 🟢 **Plugar agora** | Happy path + contrato principal alinhado |
| 🟡 **Plugar com ressalva** | API existe; payload/integração ainda lab/stub (não DoD prod) |
| 🔴 **Não** | Endpoint ausente |

---

## Matriz US-FE × BE

| US-FE Sofia | Tela | Status | Endpoints BE prontos |
|-------------|------|--------|----------------------|
| **F01** Saúde barramento | Console tópicos/lag | 🟡 | `GET /api/v1/streams/health` · `GET /api/v1/events/{eventId}` · `POST /api/v1/events/credit` |
| **F02** Catálogo atributos | Catálogo + PIT | 🟢 | `GET /api/v1/features/catalog` · `GET /api/v1/features/{documento}` · `POST /api/v1/features/batch` |
| **F03** Linha tempo score | Histórico titular | 🟢 | `GET /api/v1/score/{documento}` · `.../history` · `POST /api/v1/score/recalculate` |
| **F04** Comparar decisões | Snapshot A/B | 🟢 | `GET /api/v1/decisions/{id}` · `.../snapshot` · `POST .../verify` |
| **F05** Playground decisão | Teste integração | 🟢 | `POST /api/v1/decisions` · `GET .../{id}` · `GET .../budget` |
| **F06** Conectores origem | Monitor ingest | 🟢 | `GET /api/v1/ingest/sources` · `POST /api/v1/ingest/replay` · OF callback |
| **F07** Identidade ambígua | Console merge | 🟢 | `GET /api/v1/identity/candidates` · `GET .../{documento}` · `POST .../merge` · `POST .../merge/undo` *(extra BE)* |
| **F08** Painel SLO | Observabilidade | 🟡 | `GET /api/v1/observability/slo` · `/budget` · `/traces/{decisionId}` |
| **F09** Model registry | Promote/rollback | 🟢 | `GET /api/v1/models` · `POST .../promote` · `POST .../rollback` |
| **F10** Replay jobs | Console replay | 🟡 | `POST /api/v1/replay/jobs` · `GET .../{jobId}` · `POST .../abort` |

---

## Ordem sugerida para Sofia (menor atrito → maior)

1. **F02** catálogo / PIT  
2. **F03** score timeline  
3. **F09** models  
4. **F07** identity merge  
5. **F05** playground decisão (+ gera decisionId p/ F04/F08)  
6. **F04** snapshot/compare/verify  
7. **F06** ingest sources  
8. **F01** streams health (métricas Kafka podem ser parciais)  
9. **F08** SLO (agregação lab, não OTel real)  
10. **F10** replay (job estado lab; sem Spark/Airflow)

---

## Ressalvas para Sofia (importante)

| Tema | Detalhe |
|------|---------|
| **Base URL** | Lab: `http://localhost:8080` · profiles `supabase,infra` |
| **CORS** | Confirmar com Noah se FE origem precisa allowlist (avisar se 403 CORS) |
| **Auth** | Smoke sem JWT; produção precisa roles da US (SRE, DATA_STEWARD, etc.) |
| **F01** | Health/stream existe; campos de lag/throughput podem ser simplificados vs mock FE |
| **F04/F05** | WORM = FS local (`./data/worm`), não S3 Object Lock |
| **F05 outcome** | Threshold stub (APPROVE/REVIEW/REJECT), não motor EP-02 |
| **F08** | Sem Prometheus/OTel real — p95 a partir de `tb_decision.latency_ms` |
| **F10** | Job QUEUED/status/abort; sem worker async completo nem Kafka sandbox |
| **Shapes** | Se FE mock diverge do JSON BE, abrir gap list — Noah alinha contrato US, não inventa campo |

---

## Fora de escopo EP-01 (Sofia NÃO pluga ainda nestas US)

- EP-02…EP-06 US-FE (47 FE no pacote Sofia; só EP-01 tem BE espelhado hoje)
- XAI `/api/v1/xai/...` (só `explanationRef` stub na decisão)

---

## Contato Noah

Dúvida de contrato → citar `US-FE-ID` + path + body esperado vs recebido.  
OpenAPI: `/swagger-ui.html` ou `/v3/api-docs` com app up.

_Relatório complementar: `backend/docs/RELATORIO_PROGRESSO_BACKEND.md`_
