# Dev Agent Record — Sofia · Portfólio / Sala de Risco live

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Plug EP-04 Portfólio (handoff Noah 15:40 · lab 9/9 · `9aa6fcf`) |
| **Modo** | `VITE_DATA_MODE=live` (fallback mock) |
| **BE** | `/api/v1/portfolio/*` · stubs Neptune/Trino |

## Naming

| Arquivo | Domínio produto |
|---------|-----------------|
| `src/api/portfolio.ts` | Sala de Risco / Portfólio |

## Telas live (F01–F09)

| US | Tela | Client |
|----|------|--------|
| F01 | CockpitPage | `GET /graph` |
| F02 | ContagionPage | `POST /contagion/simulate` · `GET /contagion/{id}` · `GET /contagion/critical` |
| F03 | StressPage | `GET /stress/scenarios` · `POST /stress/run` |
| F04 | ConcentrationPage | `GET /concentration` · `GET /alerts` · `POST /limits` |
| F05 | FreshnessPage | `GET /aggregates/freshness` · `POST /aggregates/refresh` |
| F06 | CommunitiesPage | `GET /communities` · `POST /communities/detect` |
| F07 | RetrospectivePage | `GET /snapshot` · `GET /timeline` |
| F08 | CommitteeReportPage | `POST /reports` · `GET .../download` (seções = mock modelo) |
| F09 | Graph2DPage | `GET /graph/2d` · `GET /graph/tabular` |

## Lab

- `LAB_PORTFOLIO_ID` = `aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee` (qualquer UUID válido)
- Mappers com defaults (BE stub ≪ mock rico)
- EP-03 Copiloto PJ **não** plugar (handoff: ADIADO GenAI)

## Qualidade

- `tsc --noEmit` + `npm test` — ver commit
