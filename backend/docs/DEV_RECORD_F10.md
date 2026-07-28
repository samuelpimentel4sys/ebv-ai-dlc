# Dev Agent Record — PRISMA-EP-01-F10-US-BE-01

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab-ready (job sandbox isolado; sem Airflow/Spark/Kafka sandbox real)

## Entregue

- Flyway `V14__replay_f10.sql` — `tb_replay_job` (CHECK `target_env <> 'PRODUCTION_BUS'`)
- Domain `replay` — Create · Get · Abort
- REST `POST/GET /api/v1/replay/jobs` · `POST .../abort` (create → 202 QUEUED)
- RNs: prod bus 403 · sem justificativa 422 · sem approver 403 · abort DONE 409
- `outputUri` sandbox auditável `s3://prisma-sandbox/replay/{jobId}/`
- Security DATA_ENG|PLATFORM
- Unit tests `ReplayJobServiceTest`

## Pendente DoD

- [ ] Consumers Kafka sandbox / Spark Iceberg backfill
- [ ] Approval service dual-control real (ROLE_COMPLIANCE)
- [ ] Transição assíncrona QUEUED → RUNNING → DONE
- [ ] Commit/push
