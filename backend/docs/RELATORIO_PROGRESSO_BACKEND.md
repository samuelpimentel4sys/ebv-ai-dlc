# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Data** | 2026-07-28 |
| **Ambiente** | Java 21 · Spring Boot 3.4 · Supabase (`Prisma Equifax`) |

---

## 1. Resumo executivo

| Dimensão | Planejado (catálogo) | Concluído | Em andamento | Não iniciado |
|----------|---------------------:|----------:|-------------:|-------------:|
| **Épicos** | 6 | **0** | **1** (EP-01) | 5 |
| **Features (US-BE)** | 56 | **0** | **3** (F07, F01, F06) | 53 |
| **Endpoints documentados** | ~163 | **8** (+ health/platform) | — | ~155 |

> Critério **concluído** = DoD da US.  
> F07 ~85% · F01 ~75% · F06 ~40% (callback/sources/replay RN001/004). `X-Correlation-ID` conforme US.

---

## 2. Inventário por épico

| Épico | Nome | US-BE | Status épico | Features tocadas |
|-------|------|------:|--------------|------------------|
| **EP-01** | Score Vivo Event-Driven & PIT | 10 | 🟡 Em andamento | F07 (parcial) · DDL F01 (só tabelas) |
| **EP-02** | Motor Decisão Explicável | 10 | ⚪ Não iniciado | — |
| **EP-03** | Copiloto GenAI PJ | 9 | ⚪ Não iniciado | — |
| **EP-04** | Sala de Risco / Portfólio | 9 | ⚪ Não iniciado | — |
| **EP-05** | Contestação + Console B2B | 9 | ⚪ Não iniciado | — |
| **EP-06** | Score Inclusão + Coach B2C | 9 | ⚪ Não iniciado | — |

**Épicos concluídos: 0 / 6**  
**Épicos em andamento: 1 / 6 (EP-01)**

---

## 3. Features EP-01 (detalhe)

| Feature | US | Título | Status | Evidência |
|---------|-----|--------|--------|-----------|
| F01 | US-BE-01 | Publicação Ordenada Eventos Crédito | 🟡 Parcial ~65% | API + Kafka publish + consumer mínimo + receipt/DLQ |
| F02 | US-BE-01 | Leitura Point-in-Time Atributos | ⚪ | — |
| F03 | US-BE-01 | Recálculo Incremental Score | ⚪ | — |
| F04 | US-BE-01 | Snapshot Imutável | ⚪ | — |
| F05 | US-BE-01 | Decisão Crédito Síncrona | ⚪ | tabelas `decisao`/`score` existem (baseline) |
| F06 | US-BE-01 | Ingestão Multi-Fonte | 🟡 Parcial ~70% | OF + sources FE + replay janela + Cad. Positivo RN002 |
| **F07** | **US-BE-01** | **Golden Record / Identidade** | 🟡 **Parcial ~85%** | ver §4 |
| F08 | US-BE-01 | Telemetria SLO | ⚪ | — |
| F09 | US-BE-01 | Governança Versões Modelo | ⚪ | — |
| F10 | US-BE-01 | Replay Histórico | ⚪ | — |

**Features EP-01 concluídas: 0 / 10**  
**Features EP-01 em andamento: 1 / 10 (F07)**

---

## 4. O que está entregue em F07

### ✅ Feito
- Domain Hexagonal: `GoldenRecord`, VOs, `SimilarityBandService` (RN001)
- Use cases: Get Identity · Merge · **Undo** · List Candidates · Evaluate Pairing
- REST:
  - `GET /api/v1/identity/{documento}`
  - `POST /api/v1/identity/merge`
  - `POST /api/v1/identity/merge/undo` (CA-04)
  - `GET /api/v1/identity/candidates`
- Persistência Supabase + trilha MERGE/UNDO
- Kafka `prisma.identity.corrections` (MERGE + UNDO_MERGE) — smoke offset 0/1
- RN004 ciclo → 409 · version bump (RN003)
- Unit tests F07 **PASS** (JDK 21) · CT-04 undo

### ❌ Pendente para DoD F07
- JWT / `ROLE_DATA_STEWARD` (CT-08) — `OIDC_ENABLED=true`
- Splink/Neptune reais (hoje confidence informada na API)
- Coverage formal >80% + Testcontainers

---

## 5. Plataforma (fora de feature, Sprint 0)

| Item | Status |
|------|--------|
| Scaffold Maven Hexagonal | ✅ |
| Supabase projeto + `.env` | ✅ |
| Redis / Kafka / Keycloak (host `192.168.31.47`) + profile `infra` | ✅ smoke |
| F01 publish Kafka `prisma.credit.events` | ✅ |
| F01 consumer mínimo + DLQ path | ✅ |
| F07 undo + Kafka identity.corrections | ✅ |
| Flyway V1–V5 + migrations MCP | ✅ |
| Health / OpenAPI | ✅ |
| JDK 21 alinhado `pom` | ✅ |
| OIDC Keycloak enforced | ❌ (`OIDC_ENABLED=false` smoke) |
| S3 WORM / Feast / ONNX | ❌ |
| Commit/push incremento | ❌ |

---

## 6. Percentuais (visão gerencial)

| Escopo | % aproximado |
|--------|-------------:|
| Catálogo total 56 US | **~2%** |
| EP-01 (10 US) | **~15%** |
| Sprint 0 plataforma | **~85%** |
| F07 DoD | **~85%** |
| F01 DoD | **~65%** |

---

## 7. Próximos passos (ordem)

1. Commit/push incremento F07+F01 (sem `.env`)
2. `OIDC_ENABLED=true` + CT-08 steward
3. Completar Sprint 1: F06 ingest adapters

---

## 8. Fontes

- `docs/PLANO_TRABALHO_BACKEND.md`
- `docs/DEV_RECORD_F07.md`
- `docs/user-stories/00_INDICE_US-BE_PRISMA-EP-0*.md`
- Supabase project `jrpjrvttiqustpfedxdz` (Prisma Equifax)

---

_Gerado por Noah · não contabiliza US FE · critério rigoroso de “concluído”._
