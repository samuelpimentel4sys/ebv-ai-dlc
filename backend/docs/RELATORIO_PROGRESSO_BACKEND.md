# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 12:40 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | S1 `76509bd` · S2 `1625460` · S3 `d5db9cb` em `origin/main` · **F08/F10 local** |

---

## 1. Quanto falta para fechar EP-01?

| Visão | Situação |
|-------|----------|
| **Cobertura de features (código lab)** | **10/10** tocadas — F08/F10 acabaram de entrar (local) |
| **DoD rigoroso das US** | **0/10** — nenhuma feature 100% (faltam S3 WORM real, Feast/ONNX, OTel/Prometheus, Airflow/Spark, OIDC CTs) |
| **EP-01 bundle “esqueleto R1”** | **~85–90%** endpoints/contratos principais |
| **EP-01 bundle “produção DoD”** | **~45–55%** — hardening + integrações reais |

### Features — status

| F | Título | Lab % | Falta p/ DoD |
|---|--------|------:|--------------|
| F01 | Eventos crédito | ~75% | Schema Registry Avro full · ordenação MSK prod |
| F02 | PIT features | ~80% | Feast online/offline |
| F03 | Score incremental | ~70% | ONNX real |
| F04 | Snapshot WORM | ~70% | **S3 Object Lock** (hoje FS) |
| F05 | Decisão síncrona | ~70% | Policy EP-02 · timeouts duros · p95 medido F08 |
| F06 | Ingest multi-fonte | ~70% | Adapters CadPos/OF produção |
| F07 | Golden Record | ~85% | Splink/Neptune · CT-08 OIDC steward |
| **F08** | Telemetria SLO | **~65%** | OTel Collector · Prometheus · Alertmanager freeze |
| F09 | Model registry | ~75% | Artifact store imutável |
| **F10** | Replay histórico | **~60%** | Airflow/Spark · Kafka sandbox consumer |

### Trabalho restante (estimado)

1. **Já no código (commit/push + smoke):** F08 + F10 lab — ~0,5 dia  
2. **Hardening DoD EP-01 (integrações):** S3 WORM · ONNX/Feast · OTel · sandbox Kafka — **~1–2 sprints**  
3. **OIDC CTs** (steward/SRE/DATA_ENG) — ~2–3 dias  

> **Resposta curta:** esqueleto EP-01 **quase fechado** (10/10 features lab). Para **DoD oficial** ainda falta **~half** do épico (infra real + compliance).

---

## 2. Resumo executivo

| Dimensão | Planejado | DoD 100% | Em andamento lab | Não iniciado |
|----------|----------:|---------:|-----------------:|-------------:|
| Épicos | 6 | 0 | 1 (EP-01) | 5 |
| Features EP-01 | 10 | 0 | **10** | **0** |
| Features catálogo 56 | 56 | 0 | 10 | 46 |

| Sprint | Escopo | Git |
|--------|--------|-----|
| 1 | F07 F01 F06 | ✅ `76509bd` |
| 2 | F02 F09 F03 | ✅ `1625460` |
| 3 | F04 F05 | ✅ `d5db9cb` |
| 4* | F08 F10 (adiantado do Sprint 6) | 🟡 local |

---

## 3. F08 / F10 — entregue (local)

| Método | Path |
|--------|------|
| GET | `/api/v1/observability/slo` |
| GET | `/api/v1/observability/traces/{decisionId}` |
| GET | `/api/v1/observability/budget` |
| POST | `/api/v1/replay/jobs` (202) |
| GET | `/api/v1/replay/jobs/{jobId}` |
| POST | `/api/v1/replay/jobs/{jobId}/abort` |

Flyway **V13** (SLO/trace) · **V14** (replay job) · `mvn test` PASS · DEV_RECORD_F08/F10

---

## 4. Próximos passos

1. Commit + push F08/F10  
2. Smoke HTTP observability + replay  
3. Hardening DoD (S3/ONNX/OTel) **ou** iniciar **EP-02** (plano Sprint 4 original)

---

_Gerado por Noah · “concluído” = DoD rigoroso da US._
