# Dev Agent Record — EP-05 Sprint 5 (F05 · F02 · F01 · F08)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab slice 1 — autoatendimento + workflow + tracking + anexos (sem Camunda/ClamAV/S3 real)

## Entregue

| Feature | US | Entrega |
|---------|-----|---------|
| **F05** | Self-service | `POST/GET /api/v1/self-service/*` · session 15 min · lockout 3/30min |
| **F02** | Workflow | `POST /disputes` · `GET /queue` · `PATCH /{id}/resolve` · timeline |
| **F01** | Tracking | `GET /{protocol}/tracking|timeline` · confirmDocumento last4 |
| **F08** | Anexos | upload JSON/multipart · list · evidence-pack · FS WORM |

- Flyway **V25** `tb_dispute` / `tb_dispute_timeline` / `tb_dispute_attachment`
- Protocol lab: `CT-yyyyMMdd-XXXX` · SLA stub **+7 dias corridos**
- Status: `OPEN` · `IN_DILIGENCE` · `RESOLVED_FAVOR_TITULAR` · `RESOLVED_MAINTAIN` · `CANCELLED`
- Unit tests ≥1 por feature (`SelfService` · `DisputeWorkflow` · `DisputeTracking` · `DisputeAttachment`)

## Pendente DoD

- [ ] Camunda 8 process instance
- [ ] Calendário dias úteis EBV (hoje: dias corridos)
- [ ] ClamAV / S3 Object Lock reais
- [ ] Redis lockout compartilhado (hoje: in-memory)
- [ ] F06 SLA escalate · F03/F07/F04 console B2B
- [ ] Commit/push (quando pedir)

## Endpoints

```
POST   /api/v1/self-service/identify
GET    /api/v1/self-service/records?sessionToken=
POST   /api/v1/self-service/disputes
POST   /api/v1/disputes
GET    /api/v1/disputes/queue
PATCH  /api/v1/disputes/{id}/resolve
GET    /api/v1/disputes/{protocol}/tracking?confirmDocumento=
GET    /api/v1/disputes/{protocol}/timeline?confirmDocumento=
POST   /api/v1/disputes/{id}/attachments  (JSON | multipart)
GET    /api/v1/disputes/{id}/attachments
GET    /api/v1/disputes/{id}/evidence-pack
```
