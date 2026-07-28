# DEV RECORD — EP-03 F04 HITL (Noah)

| Campo | Valor |
|-------|-------|
| **US** | `PRISMA-EP-03-F04-US-BE-01` |
| **Data** | 2026-07-28 |
| **Status** | Lab HITL Java ✅ |
| **Handoff** | `HANDOFF_EMILLY_NOAH_EP03_F04.md` |

## Entregue

- Flyway `V50__ep03_f04_hitl.sql` — `tb_pj_approval_policy` + `tb_pj_approval_trail` + seed L1/L2/L3
- BC `pj`: submit / decide (APPROVE|REJECT|ESCALATE) / trail
- REST: `/api/v1/pj/opinions/{id}/submit|approve|trail`
- Lê/atualiza `tb_pj_opinion` (mesmo DB Emilly) via JDBC — **sem** HTTP Python no happy path
- Submit exige `READY_FOR_REVIEW`; bloqueia guardrail `FAILED`
- RN003 criador ≠ aprovador; L1 insuficiente → ESCALATE

## Decisões (aceitas Emilly)

| # | Decisão |
|---|----------|
| D1 | JDBC mesmo Supabase |
| D2 | Submit só `READY_FOR_REVIEW` |
| D3 | FE → Java `:8080` HITL |
| D4 | F04 only (sem Bedrock) |

## Lab

`OIDC_ENABLED=false` — `actorId` no body **ou** `prisma.lab.actor-fallback=true` (OBS-06).  
OIDC on: actor = JWT `sub` apenas.

## DoD US (OBS-10)

- [x] Paths + HTTP contratos F04
- [x] RNs unit (READY_FOR_REVIEW, guardrail, criador≠aprovador, escalate)
- [x] Integração: JDBC mesmo Supabase (lab) — documentado handoff
- [ ] OIDC on em staging demo
- [x] DEV_RECORD + auditoria ack

## Não feito

- Notificação SQS aprovador (stub omitido)
- Endpoint emitir/circular (CA-05) — fora F04 REST mínimo
- `PATCH .../status` HTTP Python — não necessário (JDBC)
