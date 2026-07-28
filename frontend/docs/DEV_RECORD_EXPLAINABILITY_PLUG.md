# Dev Agent Record — Sofia · Explainability live plug

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Plug 10 US-FE Explicabilidade & Compliance (handoff Noah EP-02) |
| **Modo** | `VITE_DATA_MODE=live` (fallback mock) |

## Naming (propósito, não épico)

| Antes | Agora | Domínio produto |
|-------|-------|-----------------|
| `src/api/ep01.ts` | `src/api/scorePlatform.ts` | Score & Plataforma |
| `src/api/ep02.ts` | `src/api/explainability.ts` | Explicabilidade & Compliance |

US/épico continuam só em IDs de rastreio (`PRISMA-EP-02-…`), não em nomes de módulo FE.

## Entregue — live via `explainability.ts`

| US | Tela | Client |
|----|------|--------|
| F05 | ReasonsCatalogPage | list + create |
| F10 | PolicyVersionsPage | list + diff + publish |
| F01 | FactorsPage | explain (+ lastDecisionId) |
| F02 | CounterfactualPage | get + simulate |
| F06 | HumanReviewPage | queue + decide |
| F08 | SubjectRightsPage | list + patch |
| F04 | AuditTrailPage | trail + export |
| F03 | DossierPage | issue + download |
| F09 | PolicySandboxPage | simulate |
| F07 | FairnessPage | metrics/alerts + analyze |

Também: `createDecisionLive` em `scorePlatform.ts` passa `includeExplanation: true` (fluxo feliz Noah).

## Fluxo lab
1. Playground (live) → grava `decisionId` em `sessionStorage`
2. Fatores / Contrafactuais / Dossiê usam UUID da sessão se rota ainda tiver id mock

## Gaps (lab stubs Noah)
- SHAP / DiCE / PDF / Fairlearn = stub
- Shapes BE ≠ mock rico — mappers com defaults
- Fila review/subject vazia até seed/POST no BE

## Qualidade
- `tsc --noEmit` PASS
- `npm test` — ver commit
