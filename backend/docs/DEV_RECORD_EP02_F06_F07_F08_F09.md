# Dev Agent Record — EP-02 F06 · F07 · F08 · F09 (Reviews · Fairness · Subject-requests · Policy simulate)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab-ready (stubs; Fairlearn/Spark/SQS later)

## Entregue

### F06 Reviews
- Flyway `V21__review_f06.sql` — `tb_review`
- Packages `domain.review` / `application.review` / `ReviewController`
- Endpoints:
  - `POST /api/v1/reviews` → **201** `{ reviewId, status, dueAt, ... }`
  - `GET /api/v1/reviews/queue` → 200 page
  - `PATCH /api/v1/reviews/{reviewId}/decide` → 200
- RNs lab: open only if decision exists; decide OPEN/IN_REVIEW; DECIDED → 409; `due_at = now+15d`

### F07 Fairness
- Flyway `V22__fairness_f07.sql` — `tb_fairness_run` · `tb_fairness_metric` · `tb_fairness_alert` + seed 1 metric + 1 alert
- Packages `domain.fairness` / `application.fairness` / `FairnessController`
- Endpoints:
  - `GET /api/v1/fairness/metrics` → 200
  - `GET /api/v1/fairness/alerts` → 200
  - `POST /api/v1/fairness/analyze` → **202** (QUEUED→DONE stub sync; alert se disparity > limit)

### F08 Subject requests (LGPD)
- Flyway `V23__subject_request_f08.sql` — `tb_subject_request`
- Packages `domain.subjectrequest` / `application.subjectrequest` / `SubjectRequestController`
- Endpoints:
  - `POST /api/v1/subject-requests` → **201**
  - `GET /api/v1/subject-requests` → 200
  - `PATCH /api/v1/subject-requests/{id}` → 200
- `due_at` stub: ACCESS=15d, DELETION=30d (e demais ACCESS-like = 15d)

### F09 Policy simulate
- Flyway `V24__policy_simulation_f09.sql` — `tb_policy_simulation`
- Packages `domain.policysim` / `application.policysim` / `PolicySimulateController`
- Endpoints:
  - `POST /api/v1/policy/simulate` → **202**
  - `GET /api/v1/policy/simulations/{id}` → 200
  - `GET /api/v1/policy/baseline?portfolio=&as_of_date=` → 200
- Baseline: latest PUBLISHED via `PolicyVersionRepositoryPort` ou stub `POL-LAB-BASELINE`
- Simulate: sandbox DONE com approve_rate vs baseline; `prod_writes=false`

### Wire
- Security: SUBJECT · MODEL_GOVERNANCE · POLICY_ANALYST · PLATFORM
- GlobalExceptionHandler: 404/409/422 para review/fairness/subjectrequest/policysim
- Unit tests: `ReviewServiceTest` · `FairnessServiceTest` · `SubjectRequestServiceTest` · `PolicySimServiceTest`

## Stubs / gaps (DoD produção)

| Item | Lab | Produção |
|------|-----|----------|
| Escalonamento &lt;24h / SQS | não | Amazon SQS + supervisor |
| Fairlearn / Athena | métricas fake sync | Python Fairlearn + job async |
| Identity proofing F08 | omitido | Identity Proofing fail-closed |
| Spark/Trino F09 | stub rates | job isolado 2h |
| DDL US completa (eventos/ações) | tabelas lab V21–V24 | `tb_human_review` / `tb_review_event` / artifacts |

## Pendente

- [ ] Fairlearn + Airflow
- [ ] Spark sandbox real
- [ ] Commit/push (quando pedir)
