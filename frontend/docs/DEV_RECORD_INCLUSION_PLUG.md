# Dev Agent Record — Sofia · Inclusão & Coach live

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Plug Inclusão/Coach (handoff Noah EP-06 lab 9/9 · `e3ebc6f`) |
| **Modo** | `VITE_DATA_MODE=live` (fallback mock) |

## Naming

| Arquivo | Domínio produto |
|---------|-----------------|
| `src/api/inclusion.ts` | Inclusão & Coach (consent · utilities · alt-data · thin-file · coach · missões · ofertas · drift) |

## Telas live (ordem Noah)

| US | Tela | Client |
|----|------|--------|
| F04 | ConsentPage | consents CRUD |
| F08 | UtilityLinkPage | utilities link |
| F01 | CoveragePage | coverage/quality/ingest |
| F02 | ModelCardPage | model-card (+ score helper) |
| F03 | CoachJourneyPage | journey/progress |
| F05 | MissionsPage | missions/progress |
| F06 | SimulatorPage | simulate + history |
| F07 | OffersPage | offers/apply/eligibility |
| F09 | DriftPage | drift/monitoring/evaluate |

## Gaps lab
- Shapes BE ≠ mock rico — defaults nos mappers
- Consent list vazia até POST grant
- Marketplace apply exige `consentId` (sessão pós-grant)
- Stubs Serpro/ONNX/concessionária

## Qualidade
- `tsc --noEmit` PASS
- `npm test` — ver commit
