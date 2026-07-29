# DEV_RECORD — F09 Routing + telemetria custo (Emilly · EP-03)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Agente** | Emilly (`dev-python-esp`) |
| **US** | `PRISMA-EP-03-F09-US-BE-01` |

## Entrega

- Domain `routing.py`: classes SMALL/MEDIUM/LARGE, promote, estimate USD, hard-stop
- Tabelas: `tb_pj_routing_policy`, `tb_pj_routing_decision`, `tb_pj_inference_cost`
- Alembic `004_ep03_f09` + SQL `docs/sql/ep03_f09_routing.sql`
- Endpoints:
  - `POST /api/v1/pj/routing/policy` → **201** (`OPS_AI`|`PLATFORM`) · 2a ACTIVE → **409**
  - `GET /api/v1/pj/routing/decisions` (`OPS_AI`|`ANALISTA_PJ`|`PLATFORM`)
  - `POST /api/v1/pj/routing/resolve` — lab resolve+grava (promote / budgetOverride)
  - `GET /api/v1/pj/telemetry/cost` (`OPS_AI`|`FINANCE`|`PLATFORM`)
- Hard-stop >120% budget sem override → **429** (`BudgetExceededError`)

## CAs cobertos (unit)

| CA | Teste |
|----|-------|
| CA-01/02 | segunda ACTIVE → ConflictActivePolicyError |
| CA-03 | SECTION_DRAFT → SMALL |
| CA-04 | promote → MEDIUM |
| CA-05 | estimate_usd + telemetry use case |
| CA-06 | hard-stop sem override → BudgetExceededError |

## Fora deste slice

- Hook automatico em todo `GenerateOpinion` (best-effort RN003 parcial via `/routing/resolve`)
- LiteLLM gateway real
- Prometheus export
