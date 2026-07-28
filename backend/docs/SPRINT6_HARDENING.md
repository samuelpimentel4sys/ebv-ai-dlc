# Sprint 6 — Hardening R1 (sem GenAI)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Escopo** | Hardening lab → prod-ready |
| **Fora** | **EP-03 GenAI** (Python/Bedrock) — adiado por decisão Walter |

## Checklist

| Item | Status | Nota |
|------|--------|------|
| EP-01…02…04…05…06 lab APIs | ✅ | Sofia pode plugar |
| EP-03 GenAI | ⏭ ADIADO | Sem HITL GenAI neste ciclo |
| Handoff Sofia atualizado | ✅ | `HANDOFF_SOFIA_EP01_FE.md` |
| OIDC CTs (`OIDC_ENABLED=true`) | ✅ CT + 🟡 smoke lab | `OidcSecurityWebMvcTest` (JWT mock); smoke Keycloak § abaixo |
| Testcontainers Postgres Flyway | ✅ CI | `FlywayPostgresIT` + `.github/workflows/backend-ci.yml` |
| S3 Object Lock WORM | ✅ | `prisma.worm.backend=fs\|s3` — COMPLIANCE + unit tests |
| Neptune / ONNX / Fairlearn | ❌ | stubs documentados |

## OIDC smoke (manual)

1. Keycloak realm `prisma` up (`PROVISIONAMENTO_REDIS_KAFKA_KEYCLOAK.md`)
2. `.env`: `OIDC_ENABLED=true` · `OIDC_ISSUER_URI` · client credentials
3. `SPRING_PROFILES_ACTIVE=supabase,infra`
4. Token com role alvo → 200; sem role → 403; sem token → 401

| Path | Role mínima |
|------|-------------|
| `/api/v1/identity/**` | DATA_STEWARD |
| `/api/v1/features/**` | ML / ANALISTA_RISCO |
| `/api/v1/decisions/**` | B2B / COMPLIANCE |
| `/api/v1/portfolio/**` | RISK_ANALYST / PLATFORM |
| `/actuator/health` | public |

## Próximos hardening (quando pedir)

1. ~~IT Testcontainers no CI~~ ✅ `backend-ci.yml`
2. ~~Adapter S3 WORM~~ ✅ (lab `fs`; prod `s3` + Object Lock)
3. ~~OIDC CTs automatizados~~ ✅; smoke manual Keycloak lab (token real) ainda pendente
4. Reabrir EP-03 só se existir contrato Java HITL **sem** Bedrock no mesmo sprint

### Ativar S3 WORM

```bash
PRISMA_WORM_BACKEND=s3
PRISMA_AUDIT_WORM_BACKEND=s3
PRISMA_WORM_S3_BUCKET=prisma-worm-prod
PRISMA_WORM_S3_REGION=ca-central-1
# Bucket must have Object Lock enabled (COMPLIANCE)
```

Credenciais: AWS default chain.
