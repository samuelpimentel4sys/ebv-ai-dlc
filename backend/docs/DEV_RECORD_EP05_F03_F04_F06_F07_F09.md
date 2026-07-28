# Dev Agent Record — EP-05 F03 / F04 / F06 / F07 / F09 (lab close)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab skeleton 9/9 EP-05 · stubs OK · **sem commit**

## Entregue

| F | Feature | Flyway | Endpoints |
|---|---------|--------|-----------|
| F06 | SLA | V26 `tb_sla_policy`, `tb_sla_escalation` | GET status · POST policies · GET escalations |
| F03 | Onboarding | V27 `tb_onboarding` | POST start / verify / complete |
| F07 | Credentials | V28 `tb_api_credential` | POST · rotate · DELETE revoke |
| F04 | Console | V29 usage/invoice/contract + seed `demo-tenant` | GET usage/invoices/contracts |
| F09 | Analytics SAC | V30 `tb_sac_metric` seed | GET deflection / sac-cost / baseline |

## Detalhes lab

- **F06:** GET `/status` agrega onTrack/atRisk/overdue e cria escalations on-demand (idempotência 6h).
- **F03:** Serpro stub — CNPJ terminando em `9` → `MANUAL_QUEUE`; senão `VERIFIED`. Complete emite SANDBOX via F07.
- **F07:** SHA-256 hash only; plaintext secret só em create/rotate.
- **F04:** Sem JWT → query `tenantId` (default `demo-tenant`).
- **F09:** Agregados seed + delta vs baseline.

## Testes

- `SlaStatusServiceTest`
- `OnboardingServiceTest`
- `CredentialServiceTest`
- `ConsoleUsageServiceTest`
- `AnalyticsDeflectionServiceTest`

## Gaps (fora lab DoD)

- Scheduler SQS real / canais SMS-EMAIL
- Serpro/Receita real + antifraude
- Gateway rate-limit enforce
- JWT tenant segregation console
- Fairlearn-style reclass 48h real
