# DEV_RECORD — F09 Model Registry

| Campo | Valor |
|-------|-------|
| Feature | PRISMA-EP-01-F09 (gov. versões modelo) |
| Sprint | 2 |
| Data | 2026-07-28 |
| Status | Parcial ~70% |

## Entrega
- Domain `scoring` model registry
- Promote / rollback com RNs (canary metrics, approvers, emergency)
- Flyway V10 + seed score-vivo 3.1.0 PROD / 3.2.1 CANARY
- REST: `GET /api/v1/models`, promote, rollback
- Unit tests promote

## Pendente
- OIDC roles model steward
- Artifact store / imutabilidade WORM
