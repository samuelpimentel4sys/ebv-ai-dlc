# DEV_RECORD — F08 Grupo economico stub (Emilly · EP-03)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Agente** | Emilly (`dev-python-esp`) |
| **US** | `PRISMA-EP-03-F08-US-BE-01` |

## Entrega

- Port `GroupGraphGateway` + adapter `StubNeptuneGateway` (D6 — ate Neptune/EP-04)
- Tabelas: `tb_pj_group_snapshot`, `tb_pj_group_edge`, `tb_pj_related_alert`
- Alembic `003_ep03_f08` + SQL `docs/sql/ep03_f08_group.sql`
- Endpoints (JWT `ANALISTA_PJ` | `PLATFORM` | `RISCO_PJ`):
  - `GET /api/v1/pj/{cnpj}/group?depth=1..3`
  - `GET /api/v1/pj/{cnpj}/related-parties`
  - `POST /api/v1/pj/group/refresh` → **202**
- RN: depth max 3, truncate+warning, stale >7d, overlap opinions in-flight
- Timeout stub → **503**

## Config

```env
GROUP_GRAPH_BACKEND=stub
GROUP_MAX_NODES=50
GROUP_STALE_DAYS=7
```

## Testes

`tests/unit/test_f08_group.py` — depth 3 (15 nos), truncate, cap depth, timeout, CNPJ invalido.

## Fora deste slice

- Adapter Neo4j/Neptune real
- Job async Redis/Celery (refresh sincroniza no stub e responde 202)
- ACL carteira por CNPJ
