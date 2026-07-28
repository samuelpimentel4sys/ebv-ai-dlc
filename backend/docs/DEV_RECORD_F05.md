# DEV_RECORD — F05 Decisão de Crédito Síncrona

| Campo | Valor |
|-------|-------|
| Feature | PRISMA-EP-01-F05 |
| Sprint | 3 |
| Data | 2026-07-28 |
| Status | Entregue |

## Entrega
- `CreateDecisionService`: score → features (não-crítico) → WORM → persist
- Budget `X-Budget-Ms` (default 250) + fatias; omit não-crítico → `partial=true`
- Contingência score do último snapshot se recalc falha; sem contingência → 503
- WORM obrigatório antes da response (fail-closed 503)
- Outcome stub: APPROVE≥700 / REVIEW≥500 / REJECT (pending EP-02 policy)
- REST: `POST /api/v1/decisions`, `GET /budget`, `GET /{id}` (shared F04)

## Pendente
- Policy engine EP-02 real
- XAI EP-02 (hoje só `explanationRef` stub)
- SLO p95 formal / F08 telemetria
- Timeout por fatia com cancelamento hard
