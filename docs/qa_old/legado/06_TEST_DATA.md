# 06 — Test Data Strategy (TD) — Prisma

| Campo | Valor |
|-------|-------|
| **Fonte canônica FE** | `frontend/src/app/story.ts` · `personas.ts` |
| **Regra** | Nenhum mock inventa valores próprios para Maria / Aurora / Vega |

---

## 1. Personas e IDs canônicos

| Persona | Documento | Papel nos testes | Épicos |
|---------|-----------|------------------|--------|
| **Maria Souza** | CPF `123.456.789-01` → normalizar `12345678901` | Decisão, explica, contesta, thin-file | 01, 02, 05, 06 |
| **Aurora Alimentos S.A.** | CNPJ `12.345.678/0001-90` → `12345678000190` | GenAI, HITL, portfólio | 03, 04 |
| **Fintech Vega** | CNPJ `45.998.211/0001-33` | Console B2B self-service | 05 |
| **Camila Prado** | (persona ops) | Promote modelo | 01 |
| **Helena Braga** | DPO | Explicabilidade | 02 |
| **Bruno Tavares** | Analista PJ | Criador parecer | 03 |
| **Aprovador HITL** | UUID distinto do criador | RN003 | 03 |

### Números de negócio (assertar)

| Campo | Valor canônico | Uso |
|-------|----------------|-----|
| Score Maria | **486** | EP-01/02/06 |
| Decisão | Recusa em **2026-07-27** | EP-01/02 |
| Apontamentos | 2 (1 indevido) | EP-05 |
| Rating Aurora | **BB−** | EP-03 |
| Exposição Aurora | **R$ 48,2 mi** | EP-03/04 |

## 2. Estratégia por camada

| Camada | Estratégia | Onde |
|--------|------------|------|
| FE unit/Vitest | Factories a partir de `story.ts` | `src/test/**` |
| BE unit | Builders no pacote `testfixtures` (criar se não existir) | `src/test/java/.../fixtures` |
| BE contrato | Seed Flyway `V9xx__qa_seed_maria_aurora.sql` (profile test) **ou** API setup | Testcontainers |
| PY unit | Fixtures F01 já existentes + JWT test | `tests/unit` |
| E2E | Prefere API seed no `beforeAll` + UI | Playwright globalSetup |
| Lab manual | Scripts smoke existentes + DEMO_SCRIPT | Ops |

## 3. Massa mínima por CT P0

| CT | Dados necessários |
|----|-------------------|
| EP-01 F05/F04 | Titular Maria, atributos PIT, model_version fixa, decision_id |
| EP-02 | decision_id da recusa Maria |
| EP-03 F04 | case_id Aurora, parecer, guardrail OK/FAILED, actorId criador, actorId aprovador |
| EP-05 | apontamento_id indevido, titular Maria, protocolo |
| EP-06 | consentimento off→on, sinais alt-data |
| EP-04 | CNPJ Aurora ligado a ≥1 contraparte lab |

## 4. Isolamento e limpeza

- **Testcontainers:** DB efêmero por suite CI.
- **Lab compartilhado:** prefixar protocolos `QA-{timestamp}-*` e nunca apagar massa demo Maria/Aurora.
- **WORM:** não tentar “limpar” snapshot — criar novos `decision_id`.
- **Kafka:** topics de teste ou consumer group `qa-*`.

## 5. Privacidade

- Massa demonstrativa **sintética** (não CPFs reais de clientes).
- Em staging: mascarar logs; proibir export de dump completo sem ticket.
- LGPD subject-request: usar titulares QA, nunca produção.

## 6. Anti-deriva FE×BE

Checklist semanal:

- [ ] `story.ts` score/datas = seed BE
- [ ] OpenAPI examples alinhados aos CTs
- [ ] Handoff Sofia/Noah menciona IDs canônicos
- [ ] Quebra → abrir bug “DATA-DRIFT” severidade alta p/ demo
