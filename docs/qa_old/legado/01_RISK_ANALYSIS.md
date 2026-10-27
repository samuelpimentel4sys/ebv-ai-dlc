# 01 — Risk Analysis (RA) — Prisma

| Campo | Valor |
|-------|-------|
| **Método** | Impacto × Probabilidade × Detectabilidade (FMEA leve) |
| **Horizonte** | R1 lab → staging → demo cliente |
| **Data** | 2026-07-29 |

---

## 1. Matriz de risco (top 12)

| ID | Risco | Épico | Impacto | Prob. | Detect. | Score | Prioridade QA |
|----|-------|-------|:-------:|:-----:|:-------:|:-----:|---------------|
| **R01** | Decisão incorreta / não reproduzível (score stub ≠ policy) | EP-01/02 | 5 | 4 | 3 | **60** | P0 — CT F04/F05 + replay |
| **R02** | HITL GenAI: aprovador = criador / guardrail bypass | EP-03 | 5 | 3 | 2 | **30** | P0 — CT F04 RN003 |
| **R03** | Contestação altera estado sem trilha imutável | EP-05/02 | 5 | 3 | 3 | **45** | P0 — CT F01/F02 + WORM |
| **R04** | FE chama Python direto (quebra BFF / CORS / auth) | EP-03 | 4 | 2 | 2 | **16** | P0 — E2E rede + mapa hosts |
| **R05** | OIDC off em staging + LAB_ACTOR default | Transversal | 5 | 3 | 2 | **30** | P0 — OBS-05/06/07 |
| **R06** | Lab reportado como DoD (aceite falso) | Transversal | 5 | 5 | 4 | **100** | P0 — gate linguagem + header lab |
| **R07** | LGPD subject request fora de SLA / dado vazado | EP-02 F08 | 5 | 2 | 3 | **30** | P1 — CT direitos |
| **R08** | Fairness / bias não medido (stub) | EP-02 F07 | 4 | 3 | 4 | **48** | P1 — métrica + alerta |
| **R09** | Contágio portfólio fantasma (LabService) | EP-04 | 4 | 4 | 4 | **64** | P1 — marcar lab; CT só contrato |
| **R10** | Liveness biometria falsa positiva (WireMock) | EP-05 BIO | 5 | 3 | 3 | **45** | P1 — smoke stub vs AWS |
| **R11** | p95 decisão > 250 ms sob carga | EP-01 F05 | 3 | 3 | 2 | **18** | P1 — budget + SLO |
| **R12** | Massa Maria/Aurora divergente FE×BE | Demo | 3 | 4 | 2 | **24** | P1 — fixtures canônicas |

Score = Impacto × Probabilidade × Detectabilidade (1–5). Quanto maior, mais urgente.

## 2. Priorização de cobertura (effort QA)

| Ordem | Pacote de risco | Cobertura mínima | Ferramenta |
|------:|-----------------|------------------|
| 1 | **R06 + R01 + R03** | CTs contrato + imutabilidade | MockMvc / RestAssured |
| 2 | **R02 + R04** | HITL + BFF não vaza :8090 | API + Playwright network |
| 3 | **R05** | Auth smoke 401/403/200 | Script OBS-07 |
| 4 | **R12** | Fixtures `story.ts` ↔ seed BE | TD + asserts |
| 5 | **R07–R11** | Conforme sprint DoD | Unit + IT + exploratório |

## 3. O que NÃO priorizar agora

- Neptune / Trino / Iceberg reais (EP-04 DoD) — até infra: só contrato + flag lab.
- SHAP/DiCE reais — CT de contrato stub + `partial=true`.
- Appium / mobile coach — EP-06 B2C futuro.

## 4. Exploratório obrigatório (não automatizar 100%)

| Sessão | Foco | Duração |
|--------|------|---------|
| EXP-01 | Demo Maria 20 min (explica → contesta → thin-file) com `?state=error/partial` | 45 min |
| EXP-02 | Parecer Aurora: upload → grounding → submit → approve (segundo ator) | 45 min |
| EXP-03 | Console Vega self-service + SLA fila | 30 min |

## 5. Decisão QA Master

**Nesta sprint:** fechar **G1 Contrato R1** (OBS-08) + smoke auth + smoke BFF.  
**Antes de demo cliente staging:** G2 + G3.  
**DoD US 100%:** fora do escopo lab atual — não prometer cobertura DoD com stubs.
