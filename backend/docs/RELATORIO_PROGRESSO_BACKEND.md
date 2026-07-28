# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 12:05 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` · Supabase `Prisma Equifax` |
| **Git** | Sprint 1 `76509bd` · Sprint 2 **`1625460`** em `origin/main` · Sprint 3 **local** (sem commit) |

---

## 1. Resumo executivo

| Dimensão | Planejado | Concluído (DoD) | Em andamento | Não iniciado |
|----------|----------:|----------------:|-------------:|-------------:|
| **Épicos** | 6 | **0** | **1** (EP-01) | 5 |
| **Features US-BE** | 56 | **0** | **8** | 48 |
| **Endpoints REST tocados** | ~163 | — | **~24** (+ actuator) | ~139 |

| Sprint | Escopo | Status | Bundle DoD |
|--------|--------|--------|------------|
| **0** | Plataforma | ✅ | ~85% |
| **1** | F07 · F01 · F06 | ✅ `76509bd` | ~75% |
| **2** | F02 · F09 · F03 | ✅ `1625460` | ~75% |
| **3** | F04 · F05 | 🟡 código + testes local | **~70%** |

> **“Concluído”** = DoD US (S3 Object Lock real, ONNX, OIDC roles, policy EP-02). Nenhuma feature 100% DoD ainda.

**% por feature:**  
S1 — F07 ~85% · F01 ~75% · F06 ~70%  
S2 — F02 ~80% · F09 ~75% · F03 ~70%  
S3 — F04 ~70% · F05 ~70% (WORM FS local; outcome stub)

---

## 2. Inventário por épico

| Épico | Nome | US-BE | Status | Features tocadas |
|-------|------|------:|--------|------------------|
| **EP-01** | Score Vivo Event-Driven & PIT | 10 | 🟡 Em andamento | F07 · F01 · F06 · F02 · F09 · F03 · **F04** · **F05** |
| **EP-02** … **EP-06** | — | — | ⚪ | — |

**EP-01:** 0/10 DoD · **8/10 em andamento** · 2/10 não (F08 SLO · F10 Replay)

---

## 3. Features EP-01 — detalhe

| Feature | Título | Status | Evidência |
|---------|--------|--------|-----------|
| F01 | Eventos crédito | 🟡 ~75% | Kafka + DLQ |
| F02 | PIT atributos | 🟡 ~80% | V9 · smoke |
| F03 | Recálculo score | 🟡 ~70% | V11 · smoke |
| **F04** | Snapshot WORM | 🟡 **~70%** | V12 · GET/verify · FS WORM |
| **F05** | Decisão síncrona | 🟡 **~70%** | POST decisions · budget · testes |
| F06 | Ingest multi-fonte | 🟡 ~70% | OF + replay |
| F07 | Golden Record | 🟡 ~85% | merge/undo |
| F08 | Telemetria SLO | ⚪ | — |
| F09 | Model registry | 🟡 ~75% | V10 · smoke |
| F10 | Replay histórico | ⚪ | — |

---

## 4. Git / commits

| Sprint | Commit | Remote |
|--------|--------|--------|
| 1 | `76509bd` feat Sprint 1 identity/events/ingest | ✅ `origin/main` |
| 2 | `1625460` feat Sprint 2 PIT/registry/score | ✅ `origin/main` (`76509bd..1625460`) |
| 3 | — F04/F05 decision WORM | ❌ working tree |

---

## 5. Sprint 3 — estado atual (local)

### Endpoints
| Método | Path | Feature |
|--------|------|---------|
| POST | `/api/v1/decisions` (+ `X-Budget-Ms`) | F05 |
| GET | `/api/v1/decisions/budget` | F05 |
| GET | `/api/v1/decisions/{id}` | F04/F05 |
| GET | `/api/v1/decisions/{id}/snapshot` | F04 |
| POST | `/api/v1/decisions/{id}/verify` | F04 |
| PUT/PATCH | `.../snapshot` | F04 → **405** |

### Artefatos
- Flyway `V12__decision_worm_f04_f05.sql` (`tb_decision`)
- Domain/application `decision` · WORM adapter `./data/worm/{id}.json`
- `DecisionController` · `CreateDecisionServiceTest`
- `DEV_RECORD_F04.md` · `DEV_RECORD_F05.md`
- `mvn test` **PASS** (exit 0)

### Pendente DoD Sprint 3
- [ ] S3 Object Lock real (hoje FS local + `prisma.worm.fail`)
- [ ] Policy/XAI EP-02 (outcome = threshold stub)
- [ ] Timeouts duros por fatia de budget
- [ ] Smoke HTTP POST decisions + verify
- [ ] Commit + push Sprint 3

---

## 6. Plataforma transversal

| Item | Status |
|------|--------|
| Flyway V1–V12 | ✅ (V12 local até push) |
| Redis/Kafka/Keycloak `infra` | ✅ |
| OIDC enforced | ❌ smoke off |
| Sprint 2 remote | ✅ |
| Sprint 3 remote | ❌ |

---

## 7. Percentuais gerenciais

| Escopo | % aprox. |
|--------|---------:|
| Catálogo 56 US | **~8%** |
| EP-01 (10 US) | **~60%** |
| Sprint 2 (pushado) | **~75%** |
| Sprint 3 (local) | **~70%** |

---

## 8. Próximos passos

1. Smoke HTTP F04/F05 + commit/push Sprint 3
2. Sprint seguinte plano: F08 SLO e/ou F10 Replay · ou EP-02 início
3. OIDC CT steward/compliance

---

## 9. Fontes

- `docs/PLANO_TRABALHO_BACKEND.md`
- `docs/DEV_RECORD_F0{2,3,4,5,6,7,9}.md`
- US `PRISMA-EP-01-F04/F05-US-BE-01`

---

_Gerado por Noah · não contabiliza US FE · “concluído” = DoD rigoroso._
