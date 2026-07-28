# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 11:47 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` · Supabase `Prisma Equifax` (`jrpjrvttiqustpfedxdz`) |
| **Git** | Sprint 1 **pushado** `76509bd` → `origin/main` · Sprint 2 **apenas working tree** (sem commit) |

---

## 1. Resumo executivo

| Dimensão | Planejado | Concluído (DoD) | Em andamento | Não iniciado |
|----------|----------:|----------------:|-------------:|-------------:|
| **Épicos** | 6 | **0** | **1** (EP-01) | 5 |
| **Features US-BE** | 56 | **0** | **6** | 50 |
| **Endpoints REST tocados** | ~163 | — | **~18** (+ actuator) | ~145 |

| Sprint | Escopo | Status | Bundle DoD |
|--------|--------|--------|------------|
| **0** | Plataforma | ✅ base | ~85% |
| **1** | F07 · F01 · F06 | ✅ em `main` | ~75% |
| **2** | F02 · F09 · F03 | 🟡 código + smoke local | **~75%** |
| **3+** | F04 · F05 … | ⚪ | — |

> **Critério “concluído”** = DoD da US (OIDC, ONNX/Feast reais, coverage formal). Nenhuma feature EP-01 está 100% DoD ainda.

**Percentuais por feature (estimativa Noah):**  
Sprint 1 — F07 ~85% · F01 ~75% · F06 ~70%  
Sprint 2 — F02 ~80% · F09 ~75% · F03 ~70% *(↑ após smoke HTTP 2026-07-28)*

---

## 2. Inventário por épico

| Épico | Nome | US-BE | Status | Features tocadas |
|-------|------|------:|--------|------------------|
| **EP-01** | Score Vivo Event-Driven & PIT | 10 | 🟡 Em andamento | F07 · F01 · F06 · F02 · F09 · F03 |
| **EP-02** | Motor Decisão Explicável | 10 | ⚪ | — |
| **EP-03** | Copiloto GenAI PJ | 9 | ⚪ | — |
| **EP-04** | Sala de Risco / Portfólio | 9 | ⚪ | — |
| **EP-05** | Contestação + Console B2B | 9 | ⚪ | — |
| **EP-06** | Score Inclusão + Coach B2C | 9 | ⚪ | — |

**Épicos:** 0 concluídos · **1 em andamento** · 5 não iniciados  
**EP-01 features:** 0/10 DoD · **6/10 em andamento** · 4/10 não iniciadas (F04, F05, F08, F10)

---

## 3. Features EP-01 — detalhe

| Feature | Título | Status | Evidência principal |
|---------|--------|--------|---------------------|
| F01 | Publicação ordenada eventos crédito | 🟡 ~75% | API + Kafka `prisma.credit.events` + consumer + DLQ |
| **F02** | Leitura PIT atributos | 🟡 **~80%** | Flyway V9 · catalog/GET/batch · smoke ✅ |
| **F03** | Recálculo incremental score | 🟡 **~70%** | Flyway V11 · recalculate + coalescence 5s · smoke ✅ |
| F04 | Snapshot imutável | ⚪ | — |
| F05 | Decisão crédito síncrona | ⚪ | tabelas baseline apenas |
| F06 | Ingestão multi-fonte | 🟡 ~70% | OF callback · sources FE · replay 403 · Cad. Positivo RN002 |
| **F07** | Golden Record / identidade | 🟡 **~85%** | merge/undo · Kafka `prisma.identity.corrections` |
| F08 | Telemetria SLO | ⚪ | — |
| **F09** | Governança versões modelo | 🟡 **~75%** | Flyway V10 · list/promote/rollback · smoke list ✅ |
| F10 | Replay histórico | ⚪ | — |

---

## 4. Sprint 1 (referência — em `main`)

| Item | Detalhe |
|------|---------|
| Commit | `76509bd` `feat(backend): Sprint 1 EP-01 — identity, credit events e ingest hexagonal` |
| Remote | `origin/main` (`a117a58..76509bd`) |
| Escopo | F07 + F01 + F06 · Flyway V1–V8 · Correlation-ID · profile `infra` |

Pendente DoD residual Sprint 1: CT-08 Keycloak steward (`OIDC_ENABLED=true`), Splink/Neptune reais, coverage >80%.

---

## 5. Sprint 2 — estado atual (working tree)

### 5.1 Artefatos

| Camada | Conteúdo |
|--------|----------|
| Flyway | `V9__feature_store_f02` · `V10__model_registry_f09` · `V11__score_vivo_f03` |
| Domain/App | `domain/features` · `domain/scoring` · `application/features` · `application/scoring` |
| Infra | JPA adapters features/scoring · listener material → recalc · Security paths |
| API | `FeatureController` · `ModelController` · `ScoreController` |
| Docs | `DEV_RECORD_F02/F03/F09.md` · plano atualizado |
| Testes | **36** unitários **PASS** (JDK 21) — incl. CT-02 features, promote, coalescence |

### 5.2 Contratos REST Sprint 2

| Método | Path | Feature |
|--------|------|---------|
| GET | `/api/v1/features/catalog` | F02 |
| GET | `/api/v1/features/{documento}?asOf=&names=` | F02 |
| POST | `/api/v1/features/batch` | F02 |
| GET | `/api/v1/models` | F09 |
| POST | `/api/v1/models/{modelId}/promote` | F09 |
| POST | `/api/v1/models/{modelId}/rollback` | F09 |
| POST | `/api/v1/score/recalculate` | F03 |
| GET | `/api/v1/score/{documento}` | F03 |
| GET | `/api/v1/score/{documento}/history` | F03 |

Comportamentos: liveRead (`asOf` null) · leakage **422** · ambíguo **409** · not found **404** · score stub (sem ONNX) · coalescence 5s em recalc não-critical.

### 5.3 Smoke HTTP (2026-07-28 · `localhost:8080` · `OIDC_ENABLED=false`)

| Check | Resultado |
|-------|-----------|
| `GET /actuator/health` | `UP` |
| `GET /api/v1/features/catalog` | **2** features (`divida_aberta`, `qtd_negativacoes_12m`) |
| `GET /api/v1/features/12345678901` | `liveRead=true` · valores seed · `degraded=true` (idade > maxAge) |
| `GET /api/v1/models` | **2** versões `score-vivo` — **3.1.0 PRODUCTION** · **3.2.1 CANARY** |
| `POST /api/v1/score/recalculate` | `score=700.00` · `modelVersion=3.1.0` · `coalesced=false` |
| `GET /api/v1/score/12345678901` | espelha 700 / 3.1.0 |

### 5.4 Pendente DoD Sprint 2

- [ ] Feast online/offline + inferência ONNX reais (hoje stub)
- [ ] Roles Keycloak (model steward / data steward) com `OIDC_ENABLED=true`
- [ ] Smoke promote/rollback destrutivo controlado
- [ ] **Commit + push** Sprint 2 para `origin/main`
- [x] Unit tests verdes
- [x] Smoke GET catalog/features/models + recalculate

---

## 6. Plataforma transversal

| Item | Status |
|------|--------|
| Scaffold Hexagonal Maven | ✅ |
| Supabase + Flyway V1–V11 | ✅ (migrations aplicadas no projeto) |
| Redis / Kafka / Schema Registry / Keycloak (host lab) | ✅ profile `infra` |
| `X-Correlation-ID` (MDC + echo + error body) | ✅ |
| OpenAPI / Health | ✅ |
| OIDC Keycloak enforced | ❌ smoke com OIDC off |
| S3 WORM / Feast / ONNX produção | ❌ |
| Sprint 2 no remote | ❌ |

---

## 7. Percentuais gerenciais

| Escopo | % aprox. |
|--------|---------:|
| Catálogo 56 US-BE | **~6%** |
| EP-01 (10 US) | **~48%** |
| Sprint 0 plataforma | **~85%** |
| Sprint 1 bundle | **~75%** (pushado) |
| Sprint 2 bundle | **~75%** (local + smoke) |

---

## 8. Próximos passos (ordem)

1. **Commit + push Sprint 2** (quando aprovado — sem `.env`)
2. Opcional: smoke promote/rollback + OIDC CT steward
3. **Sprint 3:** F04 Snapshot imutável + F05 Decisão síncrona

---

## 9. Fontes

- `docs/PLANO_TRABALHO_BACKEND.md`
- `docs/DEV_RECORD_F02.md` · `DEV_RECORD_F03.md` · `DEV_RECORD_F09.md`
- `docs/DEV_RECORD_F06.md` · `DEV_RECORD_F07.md`
- `docs/PROVISIONAMENTO_REDIS_KAFKA_KEYCLOAK.md`
- User Stories EP-01 (catálogo US-BE)

---

_Gerado por Noah · não contabiliza US FE · “concluído” = DoD rigoroso da US._
