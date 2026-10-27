# 02 — Test Pyramid (PT) — Prisma AS-IS / TO-BE

| Campo | Valor |
|-------|-------|
| **Baseline** | 2026-07-29 · ~55 BE · ~7 PY · ~10 FE |
| **Meta** | Pirâmide saudável lab → staging |

---

## 1. AS-IS (diagnóstico)

```
        /\
       /E2E\          ← quase vazio (smoke scripts manuais / RAG smoke)
      /------\
     /Contrato\       ← poucos WebMvc; OBS-08 aberto
    /----------\
   /Integração  \     ← Testcontainers Flyway no CI; Kafka/Redis parciais
  /--------------\
 / Unitários lab  \   ← forte em services *Lab / stubs
/------------------\
```

| Nível | BE Java | Python | FE | Avaliação |
|-------|---------|--------|-----|-----------|
| Unit | Alto (`*ServiceTest`) | Médio | Médio (screens/journeys/a11y) | Bom para regressão lab |
| Integração | Médio (CI Maven + Docker) | Baixo | — | Expandir adapters reais |
| Contrato HTTP | Baixo | Baixo | — | **Gap P0** |
| E2E UI | — | — | Baixo | **Gap P0 demo** |
| Exploratório | — | — | Ad hoc | Formalizar EXP-01..03 |

## 2. TO-BE (alvo por release)

### Lab (agora)

| Nível | Meta | Owner |
|-------|------|-------|
| Unit | Manter ≥1 teste por service âncora; novos stubs com teste | Dev |
| Contrato | ≥1 MockMvc/RestAssured por US P0 (OBS-08) | Noah |
| Cross BFF | 1 smoke FE→8080→8090 (health + 1 opinion path) | Emilly+Noah |
| E2E UI | Playwright: 2 jornadas smoke (Maria corta + Aurora HITL) | QA/Sofia |
| Exploratório | 1 sessão/semana no caminho Maria | QA |

### Staging

| Nível | Meta |
|-------|------|
| Auth | Suite OBS-07 em todo deploy |
| Contrato | Suite R1 + EP-06 consent gate |
| E2E | Maria 20 min + Aurora full happy path |
| Performance | Budget p95 F05 amostrado |

## 3. Classificação: o que vai em cada nível

| Tipo de asserção | Unit | Contrato | E2E | Exploratório |
|------------------|:----:|:--------:|:---:|:------------:|
| Cálculo score stub / coalescence | ✅ | ❌ | ❌ | ❌ |
| HTTP status + schema OpenAPI | ❌ | ✅ | 🟡 | ❌ |
| RN HITL (criador ≠ aprovador) | ✅ | ✅ | ✅ | 🟡 |
| Browser não chama :8090 | ❌ | ❌ | ✅ | ✅ |
| Copy UX / empty/error states | ❌ | ❌ | 🟡 | ✅ |
| Imutabilidade WORM (PUT 405) | ✅ | ✅ | ❌ | 🟡 |
| A11y WCAG shell | ❌ | ❌ | 🟡 | ✅ (já Vitest a11y) |

## 4. Anti-padrões a evitar

1. E2E cobrindo matemática de score (frágil e lento).
2. Unit test que sobe browser.
3. Declarar “E2E verde” só com Vitest de rotas (isso é unit/component).
4. Duplicar 56 US em E2E — só caminhos críticos + amostragem.

## 5. Quota sugerida de esforço (próximas 2 sprints)

| Nível | % esforço QA+Dev |
|-------|-----------------:|
| Unit (manutenção) | 20% |
| Contrato HTTP R1 | **40%** |
| E2E smoke jornadas | **25%** |
| Exploratório + massa | 15% |
