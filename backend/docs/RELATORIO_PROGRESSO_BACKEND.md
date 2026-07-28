# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 14:30 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | S1–S3 em `origin/main` · EP-02 lab local · **EP-05 S5 slice 1** local (sem commit) |

---

## 1. Quanto falta para fechar EP-01?

| Visão | Situação |
|-------|----------|
| **Cobertura de features (código lab)** | **10/10** tocadas |
| **DoD rigoroso das US** | **0/10** — faltam S3 WORM real, Feast/ONNX, OTel, Airflow, OIDC CTs |
| **EP-01 bundle “esqueleto R1”** | **~85–90%** |
| **EP-01 bundle “produção DoD”** | **~45–55%** |

---

## 2. EP-02 — lab **10/10** features

| F | Título | Lab % | Entrega |
|---|--------|------:|---------|
| **F10** | Policy versions | ~60% | V15 · list/diff/publish |
| **F05** | Reasons resolve | ~55% | V16 · resolve stub |
| **F04** | Audit trail WORM | ~55% | V17 · FS WORM · hook decisão |
| **F01** | Explain SHAP | ~50% | V18 · 3 endpoints · stub imutável |
| **F02** | Counterfactual | ~50% | V19 · GET + simulate · DiCE stub |
| **F03** | Dossier | ~50% | V20 · POST 201 · download PDF/JSON stub |
| **F06** | Reviews | ~50% | V21 · open/queue/decide |
| **F07** | Fairness | ~45% | V22 · metrics/alerts/analyze 202 |
| **F08** | Subject requests | ~50% | V23 · LGPD Art.18 lifecycle |
| **F09** | Policy simulate | ~45% | V24 · simulate 202 · baseline |
| — | CORS | ✅ | Vite `5173`/`3000` |

**DEV_RECORD:** [`DEV_RECORD_EP02_F06_F07_F08_F09.md`](./DEV_RECORD_EP02_F06_F07_F08_F09.md) · [`DEV_RECORD_EP02_F01_F02_F03.md`](./DEV_RECORD_EP02_F01_F02_F03.md) · [`DEV_RECORD_EP02_S4.md`](./DEV_RECORD_EP02_S4.md)

### Endpoints F06–F09

| Método | Path |
|--------|------|
| POST | `/api/v1/reviews` → **201** |
| GET | `/api/v1/reviews/queue` |
| PATCH | `/api/v1/reviews/{reviewId}/decide` |
| GET | `/api/v1/fairness/metrics` |
| GET | `/api/v1/fairness/alerts` |
| POST | `/api/v1/fairness/analyze` → **202** |
| POST | `/api/v1/subject-requests` → **201** |
| GET | `/api/v1/subject-requests` |
| PATCH | `/api/v1/subject-requests/{id}` |
| POST | `/api/v1/policy/simulate` → **202** |
| GET | `/api/v1/policy/simulations/{id}` |
| GET | `/api/v1/policy/baseline` |

---

## 3. Resumo executivo

| Dimensão | Planejado | DoD 100% | Em andamento lab | Não iniciado |
|----------|----------:|---------:|-----------------:|-------------:|
| Épicos | 6 | 0 | 3 (EP-01, EP-02, EP-05) | 3 |
| Features EP-01 | 10 | 0 | **10** | **0** |
| Features EP-02 | 10 | 0 | **10** | **0** |
| Features EP-05 | 9 | 0 | **4** (F05/F02/F01/F08) | **5** |

---

## 4. EP-05 Sprint 5 — slice 1 (lab)

| F | Título | Lab % | Entrega |
|---|--------|------:|---------|
| **F05** | Self-service | ~45% | identify · records · disputes · lockout |
| **F02** | Workflow | ~40% | V25 · open/queue/resolve · timeline |
| **F01** | Tracking | ~40% | tracking · timeline · confirmDocumento |
| **F08** | Anexos | ~40% | upload · list · evidence-pack · FS WORM |

**DEV_RECORD:** [`DEV_RECORD_EP05_S5.md`](./DEV_RECORD_EP05_S5.md)

---

## 5. Próximos passos

1. `mvn test` EP-05 S5  
2. EP-05 F06 SLA · F03/F07/F04 console  
3. Commit/push quando pedir  

---

_Gerado por Noah · “concluído” = DoD rigoroso da US._

