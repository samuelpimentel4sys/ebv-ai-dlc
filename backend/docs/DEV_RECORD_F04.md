# DEV_RECORD — F04 Snapshot Imutável WORM

| Campo | Valor |
|-------|-------|
| Feature | PRISMA-EP-01-F04 |
| Sprint | 3 |
| Data | 2026-07-28 |
| Status | Entregue |

## Entrega
- Flyway V12 `tb_decision` (nova; baseline `decisao` preservada)
- WORM local `./data/worm/{decisionId}.json` (refuse overwrite = Object Lock)
- Cadeia SHA-256 canônica (`prev_sha256` por documento)
- REST: GET metadata, GET snapshot, POST verify
- PUT/PATCH snapshot → 405
- Exceções: 404 / 503 / 409 no `GlobalExceptionHandler`
- Roles OIDC: COMPLIANCE, B2B, PLATFORM em `/api/v1/decisions/**`
- Config: `prisma.worm.fail` / `prisma.worm.base-path`

## Pendente
- S3 Object Lock real (Compliance mode)
- DynamoDB índice (Postgres cobre MVP)
- Métricas F08 de integridade de cadeia
