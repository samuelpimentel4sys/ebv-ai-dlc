# 07 — Quality Metrics (MQ) — Prisma

| Campo | Valor |
|-------|-------|
| **Princípio** | Medir Lab e DoD **separados**; não vanidade de “% US feitas” |

---

## 1. North-star de qualidade

| Métrica | Definição | Meta lab | Meta staging |
|---------|-----------|----------|--------------|
| **Defect escape rate** | Bugs achados pós-demo / total bugs sprint | &lt; 20% | &lt; 10% |
| **CT P0 pass rate** | CTs OBS-08 verdes | 100% | 100% |
| **E2E smoke pass** | Maria + Aurora + BFF network | ≥ 95% (flaky GenAI) | 100% (2 runs) |
| **Lab≠DoD honesty** | Relatórios com colunas Lab% e DoD% | 100% handoffs | 100% |

## 2. Pirâmide e cobertura de código

| Métrica | BE | PY | FE | Meta próxima sprint |
|---------|----|----|----|---------------------|
| Line coverage (unit) | Jacoco | coverage.py | Vitest/v8 | Informativa; não gate único |
| Branch em services P0 | — | — | — | ≥ 70% nos pacotes decisão/HITL/dispute |
| # testes contrato HTTP / US P0 | hoje baixo | baixo | — | ≥ 1 por US OBS-08 |
| # E2E specs smoke | 0 → N | — | 0 → 3 | 3 suites |

**Atenção:** coverage alto em `*LabService` **não** prova DoD.

## 3. Produto / runtime

| Métrica | Origem | SLO / alerta |
|---------|--------|--------------|
| p95 `POST /decisions` | OTel / logs | &lt; 250 ms (F05) |
| Taxa 5xx BFF `/api/v1/pj/**` | Gateway | &lt; 1% lab; &lt; 0,1% staging |
| Guardrail FAILED rate | Python | Observar tendência (não “zerar”) |
| SLA contestação | EP-05 | % dentro do prazo (quando DoD) |
| Auth fail (401/403) | OBS-07 | Smoke 100% comportamento esperado |

## 4. Processo

| Métrica | Como coletar | Cadência |
|---------|--------------|----------|
| Ambiguidades SL abertas | Contagem SL-xx | Refinement |
| Bugs por épico | Board | Sprint |
| Tempo lead CT (escrito → verde CI) | Datas DEV_RECORD | Sprint |
| Sessões exploratórias | EXP-01..03 feitas? | Semanal |

## 5. Dashboard mínimo sugerido

1. **CI:** Maven test · Vitest · pytest (já parcialmente).
2. **QA board:** checklist G0–G3 do [`00_JORNADA_QA_COMPLETA.md`](./00_JORNADA_QA_COMPLETA.md).
3. **Grafana/OTel (lab):** latência decisão + erros BFF.
4. **Planilha Lab% vs DoD%** por épico (espelho do relatório Noah).

## 6. Gates numéricos para promote

| De → Para | Gate |
|-----------|------|
| PR → main lab | G0 + CTs tocados na PR |
| lab → demo interna | G1 + G2 smoke |
| demo → staging cliente | G1+G2+G3 + EXP-01 anexado |
| staging → “US Done” | DoD checklist US 100% (não só métricas CI) |
