# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 15:35 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | S1–S3 em `origin/main` · EP-02/EP-05/EP-06/EP-04 lab local (**sem commit** neste slice) |

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

Ver slice anterior. **DEV_RECORD:** [`DEV_RECORD_EP02_F06_F07_F08_F09.md`](./DEV_RECORD_EP02_F06_F07_F08_F09.md)

---

## 3. Resumo executivo

| Dimensão | Planejado | DoD 100% | Em andamento lab | Não iniciado |
|----------|----------:|---------:|-----------------:|-------------:|
| Épicos | 6 | 0 | 5 (EP-01, EP-02, EP-04, EP-05, EP-06) | 1 (EP-03) |
| Features EP-01 | 10 | 0 | **10** | **0** |
| Features EP-02 | 10 | 0 | **10** | **0** |
| Features EP-04 | 9 | 0 | **9** | **0** |
| Features EP-05 | 9 | 0 | **9** | **0** |
| Features EP-06 | 9 | 0 | **9** | **0** |

---

## 4. EP-05 Sprint 5 — lab **9/9**

| F | Título | Lab % | Entrega |
|---|--------|------:|---------|
| **F05** | Self-service | ~45% | identify · records · disputes · lockout |
| **F02** | Workflow | ~40% | V25 · open/queue/resolve · timeline |
| **F01** | Tracking | ~40% | tracking · timeline · confirmDocumento |
| **F08** | Anexos | ~40% | upload · list · evidence-pack · FS WORM |
| **F06** | SLA | ~40% | V26 · status/policies/escalations |
| **F03** | Onboarding | ~40% | V27 · start/verify/complete → F07 |
| **F07** | Credentials | ~40% | V28 · create/rotate/revoke |
| **F04** | Console | ~40% | V29 · usage/invoices/contracts |
| **F09** | Analytics | ~35% | V30 · deflection/sac-cost/baseline |

**DEV_RECORD:** [`DEV_RECORD_EP05_S5.md`](./DEV_RECORD_EP05_S5.md) · [`DEV_RECORD_EP05_F03_F04_F06_F07_F09.md`](./DEV_RECORD_EP05_F03_F04_F06_F07_F09.md)

---

## 5. EP-06 Sprint 6b — lab **9/9**

Consent → titularidade → ingest alt → thin-file → coach → gamificação → efeito → marketplace → drift.

**DEV_RECORD:** [`DEV_RECORD_EP06.md`](./DEV_RECORD_EP06.md) · Flyway **V31–V39**

---

## 6. EP-04 Sprint — lab **9/9** (NOVO)

Sala de Risco / Portfólio — stubs Java (sem Neptune/Trino/Iceberg/Spark reais).

**DEV_RECORD:** [`DEV_RECORD_EP04.md`](./DEV_RECORD_EP04.md) · Flyway **V40–V48**

| F | Âncora |
|---|--------|
| F01 | `GET /api/v1/portfolio/graph` |
| F02 | `POST /api/v1/portfolio/contagion/simulate` |
| F03 | `POST /api/v1/portfolio/stress/run` |
| F04 | `POST /api/v1/portfolio/limits` |
| F05 | `POST /api/v1/portfolio/aggregates/refresh` |
| F06 | `POST /api/v1/portfolio/communities/detect` |
| F07 | `GET /api/v1/portfolio/snapshot` |
| F08 | `POST /api/v1/portfolio/reports` |
| F09 | `GET /api/v1/portfolio/graph/2d` |

---

## 7. Próximos passos

1. `mvn test` confirmação local  
2. Commit/push quando pedir  
3. EP-03 Copiloto PJ (Python + HITL Java) · hardening R1

---

_Gerado por Noah · “concluído” = DoD rigoroso da US._
