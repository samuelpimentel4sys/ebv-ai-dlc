# DEV_RECORD — F02 Feature Store PIT

| Campo | Valor |
|-------|-------|
| Feature | PRISMA-EP-01-F02 |
| Sprint | 2 |
| Data | 2026-07-28 |
| Status | Parcial ~75% |

## Entrega
- Domain `features` + ports in/out
- `GetFeaturesService` · batch · catalog
- JPA online store + catalog (Flyway V9)
- REST: catalog, GET by documento, batch
- Exceptions: leakage 422, ambiguous 409, not found 404
- Tests: liveRead CT-02

## Pendente
- Feast online/offline real
- Audit trail completa CT formal
- Smoke HTTP produção-like
