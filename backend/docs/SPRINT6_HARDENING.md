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
| OIDC CTs (`OIDC_ENABLED=true`) | 🟡 doc | Ver § abaixo |
| Testcontainers Postgres Flyway | 🟡 | IT opcional (Docker) |
| S3 Object Lock real | ❌ | FS WORM lab permanece |
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

1. Rodar IT Testcontainers no CI com Docker
2. Adapter S3 WORM (`prisma.worm.backend=s3|fs`)
3. Reabrir EP-03 só se existir contrato Java HITL **sem** Bedrock no mesmo sprint
