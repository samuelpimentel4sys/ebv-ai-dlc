# Plano de Testes — EBV Prisma EP-05 F01–F04

| Campo | Valor |
|-------|-------|
| **Agente** | QA Master |
| **Versão esteira** | v1-20260729 |
| **Projeto** | EBV Prisma · Contestação & Console B2B |
| **Data** | 2026-07-29 |
| **Premissa** | Lab ≠ DoD |

## 1. Escopo

| Feature | Tela | Rota demo | CTs BDD |
|---------|------|-----------|--------:|
| F01 Tracking | DisputeTrackingPage | `/titular/contestacoes/CT-2026-448120` | 14 |
| F02 Fila | DisputeQueuePage | `/disputas/fila` | 12 |
| F03 Onboarding | OnboardingPage | `/b2b/onboarding` | 10 |
| F04 Console | ConsolePage | `/b2b/console` | 10 |
| **Total** | | | **46** |

## 2. Pirâmide

- Unit BE dispute/services: já existem no repo Prisma
- Contrato HTTP OBS-08 (F01/F02): backlog Noah — fora desta execução E2E FE
- E2E Playwright: smoke curated desta esteira
- Exploratório: EXP Maria contestação (pós-demo)

## 3. Prioridade automação (smoke E2E)

| ID | Motivo |
|----|--------|
| EP05-F01-01, F01-02 | Unlock + demo URL |
| EP05-F02-01, F02-03 | Fila + tratar |
| EP05-F03-01, F03-04 | Stepper + fluxo Vega |
| EP05-F04-01, F04-02 | Métricas + faturas |

Demais CTs: regressão nightly / manuais.

## 4. E2E

- BASE_URL `http://localhost:5173`
- Preferir `VITE_DATA_MODE=mock` se BE down; `live` quando :8080 UP
- Self-healing: L1 seletores; L2 Party+Sofia/Noah se app_bug; HALT se env_failure

## 5. Artefatos

- BDD: `outputs/cenarios-bdd/ebv-prisma/v1-20260729/`
- Massa: `outputs/massa-dados/ep05-dispute-massa-v1.*`
- Specs: `outputs/automacao/ep05-dispute/v1-20260729/`
