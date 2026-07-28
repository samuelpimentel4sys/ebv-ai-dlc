# DEV_RECORD — F03 Recálculo Incremental Score

| Campo | Valor |
|-------|-------|
| Feature | PRISMA-EP-01-F03 |
| Sprint | 2 |
| Data | 2026-07-28 |
| Status | Parcial ~65% |

## Entrega
- `RecalculateScore` + get current/history
- Flyway V11 `tb_score_current` / `tb_score_history`
- Coalescence 5s (não-critical)
- Listener eventos material → trigger recalc
- Score stub (sem ONNX)
- REST: `POST /api/v1/score/recalculate`, GET score + history

## Pendente
- ONNX/Feast scoring real
- SLO p95 formal
- Smoke E2E evento → score
