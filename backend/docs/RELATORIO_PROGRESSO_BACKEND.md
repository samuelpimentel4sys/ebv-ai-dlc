# Relatório de Progresso — Backend Prisma (Noah)

| Campo | Valor |
|-------|-------|
| **Agente** | Noah · `dev-java-esp` |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` · [ebv-ai-dlc](https://github.com/samuelpimentel4sys/ebv-ai-dlc) |
| **Atualizado em** | 2026-07-28 20:15 (America/Sao_Paulo) |
| **Ambiente** | Java 21 · Spring Boot 3.4 · profiles `supabase,infra` |
| **Git** | `origin/main` · F04 `0b537cd` · Liveness `688728d` · lab EP-02/04/05/06 commits |
| **Linguagem** | **Lab %** ≠ **DoD %** — nunca “concluído” sem DoD US |

Auditoria: [`AUDITORIA_US_BE_vs_NOAH.md`](./AUDITORIA_US_BE_vs_NOAH.md) · Ack OBS: [`DEV_RECORD_AUDITORIA_OBS.md`](./DEV_RECORD_AUDITORIA_OBS.md)

---

## 0. Regra (OBS-01)

| Termo | Significado |
|-------|-------------|
| **Lab %** | API + Flyway + stub/adapter lab plugável FE |
| **DoD %** | Integrações + RNs + CTs da US em produção |

`lab-ready` / `esqueleto R1` **≠** `US Done`.

---

## 1. Scorecard Lab % vs DoD %

| Épico | Features lab | Lab % (médio) | DoD % | Nota |
|-------|-------------:|--------------:|------:|------|
| **EP-01** Score Vivo | 10/10 | ~85–90 | **~0–10** | WORM S3 switch existe; Feast/OTel/Airflow pendentes |
| **EP-02** Explicável | 10/10 | ~70 | **~0–15** | SHAP/DiCE/PDF stubs |
| **EP-03** Copiloto | F04 Java | F04 ~70 lab | F04 ~40 | GenAI = Emilly `:8090` (N/A Java) |
| **EP-04** Portfólio | 9/9 | ~55 | **~0–10** | LabService + Neo4j lab; sem Neptune DoD |
| **EP-05** Contestação | 9/9 | ~40 | **~5–15** | Sem Camunda/ClamAV |
| **EP-05 BIO** Liveness | 1 US | ~50 lab | **~10** | stub/WireMock; sem AWS Face Liveness real |
| **EP-06** Inclusão | 9/9 | ~50 | **~0–15** | ONNX/consent gate parciais |

---

## 2. EP-01 — Lab 10/10 · DoD 0/10

| Visão | Situação |
|-------|----------|
| Cobertura lab | **10/10** tocadas |
| DoD rigoroso US | **0/10** features com DoD 100% |
| Esqueleto R1 | ~85–90% lab |

---

## 3. EP-03 — Java = somente F04 HITL (OBS-02)

| Parte | Host | Status |
|-------|------|--------|
| HITL submit/approve/trail | Java `:8080` | Lab OK · V50 |
| GenAI | Python `:8090` | Emilly |

Mapa: [`MAPA_HOSTS_FE.md`](./MAPA_HOSTS_FE.md)

---

## 4. EP-05 Contestação (lab 9/9) + BIO separado (OBS-22)

| Faixa | Lab % | DoD % | Escopo |
|-------|------:|------:|--------|
| F01–F09 Contestação/Console | ~40 | ~10 | Tracking ≠ biometria |
| F01 BIO Liveness | ~50 | ~10 | Noah · V51 · WireMock `:8093` |

---

## 5. EP-04 / EP-06

- EP-04: OpenAPI tag **(lab stub — sem Neptune)**. DoD %=0 até grafo/OLAP reais.
- EP-06: lab 9/9 · DoD baixo (consent gate / ONNX).

---

## 6. WORM (OBS-11)

| Profile | Backend |
|---------|---------|
| Lab default | `prisma.worm.backend=fs` |
| Prod path | `prisma.worm.backend=s3` (Object Lock Compliance — adapter já existe) |

---

## 7. Próximos passos (pós OBS-01…11)

1. OBS-12…16 hardening R1 (score, Kafka, OTel, Camunda, XAI)
2. OBS-17…20 EP-04/06 adapters
3. CTs HTTP ampliados (≥1 por US P1)

---

_Noah · Lab % e DoD % sempre separados._
