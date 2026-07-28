# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 13:50 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | S1–S3 em `origin/main` · **EP-02 S4 start local** (F10/F05/F04 + CORS) |

---

## 1. Quanto falta para fechar EP-01?

| Visão | Situação |
|-------|----------|
| **Cobertura de features (código lab)** | **10/10** tocadas |
| **DoD rigoroso das US** | **0/10** — faltam S3 WORM real, Feast/ONNX, OTel, Airflow, OIDC CTs |
| **EP-01 bundle “esqueleto R1”** | **~85–90%** |
| **EP-01 bundle “produção DoD”** | **~45–55%** |

---

## 2. EP-02 Sprint 4 — início

| F | Título | Lab % | Entrega |
|---|--------|------:|---------|
| **F10** | Policy versions | ~60% | V15 · list/diff/publish · hash 422 · immutable 409 |
| **F05** | Reasons resolve | ~55% | V16 · CRUD DRAFT · resolve stub (sem SHAP/Drools) |
| **F04** | Audit trail WORM | ~55% | V17 · FS `./data/audit-worm` · export 202 · hook decisão |
| — | CORS | ✅ | Vite `5173`/`3000` + Security OPTIONS |

**DEV_RECORD:** [`DEV_RECORD_EP02_S4.md`](./DEV_RECORD_EP02_S4.md)

### Endpoints novos

| Método | Path |
|--------|------|
| GET | `/api/v1/policy/versions` |
| GET | `/api/v1/policy/versions/{a}/diff/{b}` |
| POST | `/api/v1/policy/versions/{id}/publish` → **201** |
| GET/POST | `/api/v1/reasons` |
| GET | `/api/v1/reasons/resolve/{decisionId}?channel=` |
| GET | `/api/v1/audit/trail` · `/api/v1/audit/trail/{documento}` |
| POST | `/api/v1/audit/export` → **202** |

---

## 3. Resumo executivo

| Dimensão | Planejado | DoD 100% | Em andamento lab | Não iniciado |
|----------|----------:|---------:|-----------------:|-------------:|
| Épicos | 6 | 0 | 2 (EP-01, EP-02) | 4 |
| Features EP-01 | 10 | 0 | **10** | **0** |
| Features EP-02 | 10 | 0 | **3** (F10/F05/F04) | 7 |

---

## 4. Próximos passos

1. `mvn test` + smoke HTTP EP-02  
2. Commit/push EP-02 S4 start (quando pedir)  
3. Continuar EP-02: F01 SHAP → F02 contrafactuais → F03 dossiê  

---

_Gerado por Noah · “concluído” = DoD rigoroso da US._
