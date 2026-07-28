# Mapa FE ↔ BE — Prisma

**Atualizado:** 2026-07-28 · Sofia (após handoff Noah `HANDOFF_SOFIA_EP01_FE.md`)  
**Legenda:** 🟢 plugar agora · 🟡 plugar com ressalva · ⚪ não (EP-02+) · 🔌 controller existe

---

## EP-01 — Score Vivo (Noah: 10/10 endpoints primários no lab)

| US | Tela FE | Rota | Endpoints | Status | Ordem Noah |
|----|---------|------|-----------|--------|----------:|
| F02 | FeatureCatalogPage | `/risco/features/catalogo` | catalog · `{doc}` · batch | 🟢 | 1 |
| F03 | ScoreTimelinePage | `/risco/score/:documento/historico` | score · history · recalculate | 🟢 | 2 |
| F09 | ModelRegistryPage | `/ml/models/registry` | models · promote · rollback | 🟢 | 3 |
| F07 | IdentityMergePage | `/dados/identidade/mesclagem` | candidates · `{doc}` · merge · undo | 🟢 | 4 |
| F05 | PlaygroundPage | `/integracao/playground/decisoes` | POST decisions · GET · budget | 🟢 | 5 |
| F04 | SnapshotComparePage | `/compliance/decisoes/comparar` | snapshot · GET · verify | 🟢 | 6 |
| F06 | ConnectorsPage | `/dados/ingestao/conectores` | sources · replay · OF callback | 🟢 | 7 |
| F01 | StreamHealthPage | `/plataforma/eventos/saude` | streams/health · events | 🟡 | 8 |
| F08 | SloPage | `/plataforma/observabilidade/slo` | slo · budget · traces | 🟡 | 9 |
| F10 | ReplayJobsPage | `/dados/replay/jobs` | jobs · GET · abort | 🟡 | 10 |

**Cobertura plugável agora:** 10/10 US-FE EP-01 · live via `src/api/scorePlatform.ts` · `VITE_DATA_MODE=live`  
**Registro:** `docs/DEV_RECORD_EP01_PLUG.md`

---

## EP-02 — Explicabilidade

| US | Endpoints âncora (índice) | BE | FE pasta |
|----|---------------------------|----|----------|
| F01…F10 | `/explain/*` · `/counterfactual/*` · `/dossier/*` · `/audit/*` · `/reasons/*` · `/reviews/*` · `/fairness/*` · `/subject-requests/*` · `/policy/*` | ⚪ | `explicabilidade/` |

**Ação:** Sprint 3 FE após Sprint 4 Noah.

---

## EP-03 — Copiloto PJ (R2)

| US | Prefixo típico | BE | FE pasta |
|----|----------------|----|----------|
| F01…F09 | `/api/v1/pj/*` (GenAI Emilly + HITL Noah) | ✅ lab | `copiloto-pj/` · `api/pjGenai.ts` · `api/pjHitl.ts` |

---

## EP-04 — Sala de Risco (R2)

| US | Prefixo típico | BE | FE pasta |
|----|----------------|----|----------|
| F01…F09 | `/api/v1/portfolio/*` | ✅ lab 9/9 (`9aa6fcf`) | `sala-risco/` · `api/portfolio.ts` |

**Sofia:** plug live 2026-07-28 · stubs Neptune/Trino · `DEV_RECORD_PORTFOLIO_PLUG.md`

---

## EP-05 — Contestação & Console B2B

| US | Prefixo típico | BE | FE pasta |
|----|----------------|----|----------|
| F01…F09 | `/disputes/*` · `/onboarding/*` · `/console/*` · `/self-service/*` | ⚪ | `contestacao/` |

**Gap doc:** telas FE existem; índice `00_INDICE_US-FE_PRISMA-EP-05.md` **não** está na pasta Frontend Downstream.

---

## EP-06 — Thin-file & Coach

| US | Prefixo típico | BE | FE pasta |
|----|----------------|----|----------|
| F01…F09 | `/alternative-data/*` · coach · consent · offers | ⚪ | `thinfile/` |

---

## Matriz de sincronização Sofia ↔ Noah

```
Noah entrega controller + OpenAPI + smoke
        ↓
Sofia: diff data.ts × OpenAPI
        ↓
Sofia: api client + useApiQuery + teste
        ↓
Sofia: VITE_DATA_MODE=live na tela
        ↓
Demo conjunta (Swagger + UI)
```

---

_Atualizar este mapa a cada sprint Noah / plug Sofia._
