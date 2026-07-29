# DEV_RECORD — Smoke F04 cruzado Emilly↔Noah

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Script** | `backend-python/scripts/smoke_f04_cross.py` |
| **Resultado** | **SMOKE_F04_CROSS_OK** |

## Fluxo

1. Python seed: `tb_pj_opinion` = `READY_FOR_REVIEW` + guardrail `PASSED`
2. Java `:8080` `POST .../submit` → `SUBMITTED` (L2)
3. Java `POST .../approve` (actor ≠ creator, L3) → `APPROVED`
4. Java `GET .../trail` → SUBMIT + APPROVE
5. Python relê DB → `APPROVED`

## Opinion smoke

`6c56a74d-a0a2-45ca-9ded-237b600cbfd7`

## Nota

Python HTTP `:8090` nao precisou estar up — seed via SQLAlchemy + HITL via Java.
