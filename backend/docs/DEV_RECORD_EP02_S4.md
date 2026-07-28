# Dev Agent Record — EP-02 Sprint 4 start (F10 · F05 · F04 + CORS)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab-ready (stubs; sem Drools/Git/S3 Object Lock/QLDB/Athena)

## Entregue

### A) CORS (Sofia FE)
- `prisma.cors.allowed-origins` default `http://localhost:5173,http://localhost:3000`
- `CorsConfig` — WebMvcConfigurer + CorsConfigurationSource
- SecurityFilterChain com `.cors()` + OPTIONS permitAll

### B) F10 Policy versions
- Flyway `V15__policy_f10.sql` — `tb_policy_version` + seed 2 DRAFT + 1 PUBLISHED
- Domain/application/persistence `policy` · `PolicyController`
- `GET /api/v1/policy/versions` · `GET .../{a}/diff/{b}` · `POST .../{id}/publish` (201)
- RNs lab: DRAFT→PUBLISHED+immutable · hash mismatch 422 · já publicada 409 · diff JSON+business_effect stub

### C) F05 Reasons
- Flyway `V16__reasons_f05.sql` — `tb_reason_version` + seed UTILIZATION_HIGH APPROVED
- `GET/POST /api/v1/reasons` · `GET /api/v1/reasons/resolve/{decisionId}?channel=`
- Resolve: APPROVE → [] · REJECT/REVIEW → catálogo APPROVED (stub sem SHAP)

### D) F04 Audit trail WORM
- Flyway `V17__audit_trail_f04.sql` — `tb_audit_event` + `tb_audit_export`
- FS WORM `./data/audit-worm/{id}.json` (refuse overwrite)
- `GET /api/v1/audit/trail` · `GET .../trail/{documento}` · `POST /api/v1/audit/export` (202)
- Hook `CreateDecisionService` → `DECISION_ISSUED` encadeado por hash

### Wire
- Security roles (OIDC on): POLICY_ANALYST · LEGAL_EDITOR · COMPLIANCE_AUDITOR · PLATFORM
- GlobalExceptionHandler 404/409/422/503
- Unit tests: `PolicyVersionServiceTest` · `ReasonServiceTest` · `AuditTrailServiceTest`

## Pendente DoD

- [ ] Drools compile/validate policy artifact
- [ ] Git signed commit as source of truth
- [ ] S3 Object Lock + QLDB chain + Athena export
- [ ] SHAP mapping real (F01) para resolve motivos
- [ ] Tabelas auxiliares US (`tb_policy_approval`, `tb_reason`, `tb_reason_mapping`, `tb_audit_event_index`)
- [ ] Commit/push
