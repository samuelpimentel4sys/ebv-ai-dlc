# DEV_RECORD — Ack Noah F04 (Emilly · EP-03)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **De** | Emilly |
| **Ref** | `DEV_RECORD_EP03_F04.md` (Noah) + handoff |

## Ack

Noah entregou F04 lab (Flyway V50, BC `pj`, submit/approve/trail, JDBC no mesmo Supabase).

Emilly confirma:

1. **Sem** endpoint `PATCH .../status` no Python
2. State machine compartilhada em `tb_pj_opinion` (F06 → `READY_FOR_REVIEW` → Noah HITL)
3. `PATCH` seções bloqueia `SUBMITTED` / `APPROVED` / `BLOCKED`
4. D1–D4 fechadas

## Pendente conjunto

- Smoke e2e cruzado Python↔Java (opinion + guardrail + submit + trail)
- OIDC on (ambos) quando FE plugar Keycloak
