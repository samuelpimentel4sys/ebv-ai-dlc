# DEV RECORD — Auditoria OBS-01…11 (Noah)

| Campo | Valor |
|-------|-------|
| **Ref** | [`AUDITORIA_US_BE_vs_NOAH.md`](./AUDITORIA_US_BE_vs_NOAH.md) |
| **Data** | 2026-07-28 |
| **Status** | Pacote P0/P1 comunicação + segurança lab aplicado |

## Checklist OBS

| ID | Status | Evidência |
|----|--------|-----------|
| OBS-01 | [x] | `RELATORIO_PROGRESSO_BACKEND.md` — Lab % vs DoD % |
| OBS-02 | [x] | README + OpenAPI HITL tag + `MAPA_HOSTS_FE.md` |
| OBS-03 | [x] | Skeleton já em `main` (não re-tag); relatório atualizado |
| OBS-04 | [x] | Header `X-Prisma-Lab: true` (`LabMarkFilter`) + `lab:true` no HITL body |
| OBS-05 | [x] | `OidcMandatoryOnStagingProd` — fail-fast profiles `staging`/`prod` |
| OBS-06 | [x] | `LabActorResolver` + `prisma.lab.actor-fallback` (default lab true) |
| OBS-07 | [x] | `scripts/smoke_ct_auth.ps1` |
| OBS-08 | [x] | Matriz CT mínima documentada abaixo + smoke |
| OBS-09 | [x] | `LivenessSessionControllerWebTest` (MockMvc) |
| OBS-10 | [x] | Seção DoD US neste record + templates |
| OBS-11 | [x] | Doc WORM fs vs s3 no relatório + seção abaixo |
| OBS-21 | [x] | `MAPA_HOSTS_FE.md` |
| OBS-22 | [x] | Liveness = Noah BIO; tracking F01 separado no relatório |

## DoD US (template — OBS-10)

Para cada US Java P1 em re-auditoria:

- [ ] Path + método + HTTP batem US
- [ ] RNs críticas com teste automatizado
- [ ] Integração real **ou** ADR + flag lab + DoD % documentado
- [ ] OIDC on em demo staging
- [ ] Este checklist preenchido no DEV_RECORD da feature

### EP-03 F04 (exemplo preenchido)

- [x] Paths submit/approve/trail
- [x] Unit RN READY_FOR_REVIEW / guardrail / criador≠aprovador
- [x] JDBC mesmo DB Emilly (lab) — ADR handoff
- [ ] OIDC on demo staging (lab ainda off)
- [x] DEV_RECORD_EP03_F04 + este ack

### EP-05 F01 BIO Liveness

- [x] Paths consent + session
- [x] Unit CA consent/lockout/idempotency
- [x] Port stub/http — ADR WireMock (não LocalStack)
- [ ] AWS Face Liveness real
- [x] DEV_RECORD_EP05_LIVENESS

## WORM (OBS-11)

```env
# lab
PRISMA_WORM_BACKEND=fs
# staging/prod path
PRISMA_WORM_BACKEND=s3
PRISMA_WORM_S3_BUCKET=...
```

Adapter: `S3ObjectLockWormAdapter` (`e4e9a64`).

## Env lab recomendado

```env
PRISMA_LAB_MARK=true
PRISMA_LAB_ACTOR_FALLBACK=true
OIDC_ENABLED=false
```

Staging:

```env
SPRING_PROFILES_ACTIVE=staging,supabase,infra
OIDC_ENABLED=true
PRISMA_LAB_ACTOR_FALLBACK=false
PRISMA_LAB_MARK=false
```
