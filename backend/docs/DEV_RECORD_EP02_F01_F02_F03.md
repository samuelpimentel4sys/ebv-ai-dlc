# Dev Agent Record — EP-02 F01 · F02 · F03 (Explain · Counterfactual · Dossier)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab-ready (stubs; sem Python/SHAP/DiCE/PDFBox/S3)

## Entregue

### F01 Explain (SHAP stub)
- Flyway `V18__explain_f01.sql` — `tb_explanation`
- Packages `domain.explain` / `application.explain` / `ExplainController`
- Endpoints:
  - `GET /api/v1/explain/{decisionId}?includeLabels=` → 200
  - `POST /api/v1/explain/batch` `{ decision_ids[], include_factors }` → 200 (max 100)
  - `GET /api/v1/explain/{decisionId}/factors?direction=&limit=` → 200
- Persistência no `CreateDecisionService` quando `includeExplanation=true` (fatores stub: divida_aberta/qtd_negativacoes NEGATIVE + baseline POSITIVE)
- GET **não recalcula** — lê snapshot imutável; ausente → 404

### F02 Counterfactual (DiCE stub)
- Flyway `V19__counterfactual_f02.sql` — `tb_counterfactual`
- Packages `domain.counterfactual` / `application.counterfactual` / `CounterfactualController`
- Endpoints:
  - `GET /api/v1/counterfactual/{decisionId}?max_actions=` → 200
  - `POST /api/v1/counterfactual/simulate` `{ decision_id, changes[], target_band }` → 200 `would_approve`
- Stub actions em create para REJECT/REVIEW (utilization / negativações); APPROVE → `[]`
- Simulate: +40 score por change acionável; threshold 700

### F03 Dossier (PDFBox stub)
- Flyway `V20__dossier_f03.sql` — `tb_dossier`
- Packages `domain.dossier` / `application.dossier` / `DossierController`
- Endpoints:
  - `POST /api/v1/dossier` → **201**
  - `GET /api/v1/dossier/{dossierId}` → 200
  - `GET /api/v1/dossier/{dossierId}/download?format=PDF|JSON` → 200
- Artifact JSON em `./data/dossier/{id}.json`; PDF = bytes stub `%PDF-1.4` (PDFBox real later)
- Audit `DOSSIER_ISSUED` via `AppendAuditEventUseCase`

### Wire
- Security: explain/counterfactual → ANALISTA · DPO · COMPLIANCE · PLATFORM; dossier → DPO · COMPLIANCE · PLATFORM
- GlobalExceptionHandler: Explanation/Counterfactual/Dossier NotFound → 404
- Unit tests: `ExplainServiceTest` · `CounterfactualServiceTest` · `DossierServiceTest` (+ CreateDecision mocks)

## Stubs / gaps (DoD produção)

| Item | Lab | Produção |
|------|-----|----------|
| SHAP TreeExplainer | `ExplanationStubFactory` | Serviço Python + ONNX |
| DiCE | `CounterfactualStubFactory` | FastAPI DiCE |
| PDF | text/`%PDF-1.4` stub | Apache PDFBox + Thymeleaf |
| Storage dossiê | FS `./data/dossier` | S3 Object Lock |
| DDL US completa | tabelas lab V18–V20 | `tb_explanation_snapshot` / factor / set / action / regulatory_dossier |

## Pendente

- [ ] Integração Python SHAP/DiCE
- [ ] PDFBox real + assinatura KMS
- [ ] Commit/push (quando pedir)
