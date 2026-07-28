# Dev Agent Record — Sofia · Dispute + B2B Console live

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Plug Contestação & Console B2B (handoff Noah EP-05 lab 9/9) |
| **Modo** | `VITE_DATA_MODE=live` (fallback mock) |

## Naming (propósito)

| Arquivo | Domínio produto |
|---------|-----------------|
| `src/api/dispute.ts` | Contestações · portal titular · SLA · anexos |
| `src/api/b2bConsole.ts` | Onboarding · credenciais · consumo · analytics |

## Telas live

| Área | Tela | Client |
|------|------|--------|
| F05 | TitularPortalPage | identify/records/disputes self-service |
| F02 | DisputeQueuePage | queue + resolve |
| F01 | DisputeTrackingPage | tracking + timeline |
| F08 | AttachmentsPage | list/upload/evidence-pack |
| F06 | SlaRiskPage | status + escalations |
| F03 | OnboardingPage | start → verify → complete |
| F07 | CredentialsPage | create/rotate/revoke (+ sessão) |
| F04 | ConsolePage | usage/invoices/contracts |
| F09 | DeflectionPage | deflection/sac-cost/baseline |

## Sessão FE
- `prisma.selfService.sessionToken` — portal titular
- `prisma.lastDisputeId` — anexos / evidências
- `prisma.b2b.tenantId` / `prisma.b2b.credentials` — console (BE sem list credentials)

## Gaps lab
- Credenciais: sem GET list no BE → lista em sessionStorage pós-create
- Anexos precisam UUID de disputa (fila/resolve)
- Tracking: `confirmDocumento` last4 stub
- Shapes BE ≠ mock rico

## Qualidade
- `tsc --noEmit` PASS
- `npm test` — ver commit
