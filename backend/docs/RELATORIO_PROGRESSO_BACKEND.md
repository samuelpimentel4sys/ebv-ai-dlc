# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 14:00 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | S1–S3 em `origin/main` · **EP-02 S4 cont.** F01/F02/F03 local (sem commit) |

---

## 1. Quanto falta para fechar EP-01?

| Visão | Situação |
|-------|----------|
| **Cobertura de features (código lab)** | **10/10** tocadas |
| **DoD rigoroso das US** | **0/10** — faltam S3 WORM real, Feast/ONNX, OTel, Airflow, OIDC CTs |
| **EP-01 bundle “esqueleto R1”** | **~85–90%** |
| **EP-01 bundle “produção DoD”** | **~45–55%** |

---

## 2. EP-02 Sprint 4 — continuação F01–F03

| F | Título | Lab % | Entrega |
|---|--------|------:|---------|
| **F10** | Policy versions | ~60% | V15 · list/diff/publish |
| **F05** | Reasons resolve | ~55% | V16 · resolve stub |
| **F04** | Audit trail WORM | ~55% | V17 · FS WORM · hook decisão |
| **F01** | Explain SHAP | ~50% | V18 · 3 endpoints · stub imutável |
| **F02** | Counterfactual | ~50% | V19 · GET + simulate · DiCE stub |
| **F03** | Dossier | ~50% | V20 · POST 201 · download PDF/JSON stub |
| — | CORS | ✅ | Vite `5173`/`3000` |

**DEV_RECORD:** [`DEV_RECORD_EP02_F01_F02_F03.md`](./DEV_RECORD_EP02_F01_F02_F03.md) · [`DEV_RECORD_EP02_S4.md`](./DEV_RECORD_EP02_S4.md)

### Endpoints novos (F01–F03)

| Método | Path |
|--------|------|
| GET | `/api/v1/explain/{decisionId}` |
| POST | `/api/v1/explain/batch` |
| GET | `/api/v1/explain/{decisionId}/factors` |
| GET | `/api/v1/counterfactual/{decisionId}` |
| POST | `/api/v1/counterfactual/simulate` |
| POST | `/api/v1/dossier` → **201** |
| GET | `/api/v1/dossier/{dossierId}` |
| GET | `/api/v1/dossier/{dossierId}/download?format=` |

---

## 3. Resumo executivo

| Dimensão | Planejado | DoD 100% | Em andamento lab | Não iniciado |
|----------|----------:|---------:|-----------------:|-------------:|
| Épicos | 6 | 0 | 2 (EP-01, EP-02) | 4 |
| Features EP-01 | 10 | 0 | **10** | **0** |
| Features EP-02 | 10 | 0 | **6** (F10/F05/F04/F01/F02/F03) | 4 |

---

## 4. Próximos passos

1. `mvn test` + smoke HTTP F01–F03  
2. Commit/push EP-02 S4 cont. (quando pedir)  
3. Continuar EP-02: F06 review · F07 fairness · F08 rights · F09 simulação  

---

_Gerado por Noah · “concluído” = DoD rigoroso da US._
