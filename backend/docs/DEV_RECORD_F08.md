# Dev Agent Record — PRISMA-EP-01-F08-US-BE-01

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab-ready (agregação SQL + traces hot 7d; sem OTel/Prometheus real)

## Entregue

- Flyway `V13__observability_f08.sql` — `tb_slo_snapshot` + `tb_decision_trace`
- Domain `observability` — GetSlo · GetDecisionTrace · GetErrorBudget
- Latência agregada de `tb_decision.latency_ms` (p95/p99 nearest-rank)
- Error budget stub: `% decisões com latency_ms <= 250`; `burnAlert` se remaining &lt; 50
- `CreateDecisionService` grava spans (features/score/worm/persist) com `expires_at = now+7d`
- REST `/api/v1/observability/{slo,traces/{id},budget}` · Security SRE|B2B|PLATFORM
- Unit tests `ObservabilitySloServiceTest`

## Pendente DoD

- [ ] OpenTelemetry Collector / AMP Grafana real
- [ ] Alertmanager freeze deploys (RN002)
- [ ] Cold retention 90d
- [ ] Commit/push
