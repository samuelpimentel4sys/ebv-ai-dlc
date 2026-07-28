# User Stories Backend — PRISMA-EP-05

**Épico:** Central de Contestação Transparente & Console B2B  
**Agente:** Escritor Back (BMAD UpStream)  
**Data:** 2026-07-27  
**Fontes:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-05/*` · Resumo Downstream · DBA/Arquitetura V2  
**Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)

## Índice

| US-ID | Feature | Título | Endpoints | Complexidade | Prioridade | Arquivo |
| --- | --- | --- | :---: | :---: | :---: | --- |
| `PRISMA-EP-05-F01-US-BE-01` | `PRISMA-EP-05-F01` | Serviço de Rastreamento de Contestação | 2 | M | P1 | [arquivo](./PRISMA-EP-05-F01-US-BE-01_Servico_Rastreamento_Contestacao.md) |
| `PRISMA-EP-05-F02-US-BE-01` | `PRISMA-EP-05-F02` | Orquestração do Fluxo de Contestação | 3 | G | P1 | [arquivo](./PRISMA-EP-05-F02-US-BE-01_Orquestracao_Fluxo_Contestacao.md) |
| `PRISMA-EP-05-F03-US-BE-01` | `PRISMA-EP-05-F03` | Orquestração do Onboarding Automatizado PME | 3 | G | P1 | [arquivo](./PRISMA-EP-05-F03-US-BE-01_Orquestracao_Onboarding_PME.md) |
| `PRISMA-EP-05-F04-US-BE-01` | `PRISMA-EP-05-F04` | Serviços de Consumo e Faturamento (Console B2B) | 3 | G | P1 | [arquivo](./PRISMA-EP-05-F04-US-BE-01_Servicos_Consumo_Faturamento.md) |
| `PRISMA-EP-05-F05-US-BE-01` | `PRISMA-EP-05-F05` | Serviços de Autoatendimento do Titular | 3 | M | P1 | [arquivo](./PRISMA-EP-05-F05-US-BE-01_Servicos_Autoatendimento_Titular.md) |
| `PRISMA-EP-05-F06-US-BE-01` | `PRISMA-EP-05-F06` | Vigilância e Escalonamento de Prazos (SLA) | 3 | G | P2 | [arquivo](./PRISMA-EP-05-F06-US-BE-01_Vigilancia_Escalonamento_SLA.md) |
| `PRISMA-EP-05-F07-US-BE-01` | `PRISMA-EP-05-F07` | Ciclo de Vida das Credenciais de API | 3 | G | P2 | [arquivo](./PRISMA-EP-05-F07-US-BE-01_Ciclo_Vida_Credenciais_API.md) |
| `PRISMA-EP-05-F08-US-BE-01` | `PRISMA-EP-05-F08` | Custódia Íntegra de Evidências e Anexos | 3 | M | P2 | [arquivo](./PRISMA-EP-05-F08-US-BE-01_Custodia_Evidencias_Anexos.md) |
| `PRISMA-EP-05-F09-US-BE-01` | `PRISMA-EP-05-F09` | Apuração de Desvio e Economia de SAC | 3 | M | P3 | [arquivo](./PRISMA-EP-05-F09-US-BE-01_Apuracao_Desvio_Economia_SAC.md) |

**Total:** 9 US Backend · 26 endpoints · Σ SP = 60

## Mapa de Endpoints

| Método | Path | US |
| --- | --- | --- |
| `GET` | `/api/v1/disputes/{protocol}/tracking` | `PRISMA-EP-05-F01-US-BE-01` |
| `GET` | `/api/v1/disputes/{protocol}/timeline` | `PRISMA-EP-05-F01-US-BE-01` |
| `POST` | `/api/v1/disputes` | `PRISMA-EP-05-F02-US-BE-01` |
| `GET` | `/api/v1/disputes/queue` | `PRISMA-EP-05-F02-US-BE-01` |
| `PATCH` | `/api/v1/disputes/{id}/resolve` | `PRISMA-EP-05-F02-US-BE-01` |
| `POST` | `/api/v1/onboarding/start` | `PRISMA-EP-05-F03-US-BE-01` |
| `POST` | `/api/v1/onboarding/{id}/verify` | `PRISMA-EP-05-F03-US-BE-01` |
| `POST` | `/api/v1/onboarding/{id}/complete` | `PRISMA-EP-05-F03-US-BE-01` |
| `GET` | `/api/v1/console/usage` | `PRISMA-EP-05-F04-US-BE-01` |
| `GET` | `/api/v1/console/invoices` | `PRISMA-EP-05-F04-US-BE-01` |
| `GET` | `/api/v1/console/contracts` | `PRISMA-EP-05-F04-US-BE-01` |
| `POST` | `/api/v1/self-service/identify` | `PRISMA-EP-05-F05-US-BE-01` |
| `GET` | `/api/v1/self-service/records` | `PRISMA-EP-05-F05-US-BE-01` |
| `POST` | `/api/v1/self-service/disputes` | `PRISMA-EP-05-F05-US-BE-01` |
| `GET` | `/api/v1/sla/status` | `PRISMA-EP-05-F06-US-BE-01` |
| `POST` | `/api/v1/sla/policies` | `PRISMA-EP-05-F06-US-BE-01` |
| `GET` | `/api/v1/sla/escalations` | `PRISMA-EP-05-F06-US-BE-01` |
| `POST` | `/api/v1/credentials` | `PRISMA-EP-05-F07-US-BE-01` |
| `POST` | `/api/v1/credentials/{id}/rotate` | `PRISMA-EP-05-F07-US-BE-01` |
| `DELETE` | `/api/v1/credentials/{id}` | `PRISMA-EP-05-F07-US-BE-01` |
| `POST` | `/api/v1/disputes/{id}/attachments` | `PRISMA-EP-05-F08-US-BE-01` |
| `GET` | `/api/v1/disputes/{id}/attachments` | `PRISMA-EP-05-F08-US-BE-01` |
| `GET` | `/api/v1/disputes/{id}/evidence-pack` | `PRISMA-EP-05-F08-US-BE-01` |
| `GET` | `/api/v1/analytics/deflection` | `PRISMA-EP-05-F09-US-BE-01` |
| `GET` | `/api/v1/analytics/sac-cost` | `PRISMA-EP-05-F09-US-BE-01` |
| `GET` | `/api/v1/analytics/baseline` | `PRISMA-EP-05-F09-US-BE-01` |

## Ordem de implementação sugerida

1. **F05** (abertura) + **F02** (workflow/SLA) — tronco B2C  
2. **F01** (tracking) + **F08** (evidências) + **F06** (motor SLA)  
3. **F03** (onboarding) + **F07** (credenciais) + **F04** (console) — tronco B2B  
4. **F09** (analytics ROI) — após telemetria dos canais

## Nota — duas F01 no EP-05 (ownership Noah)

| US | Título | Status lab |
|----|--------|------------|
| `PRISMA-EP-05-F01-US-BE-01` | Tracking contestação | ✅ Sprint 5 |
| `EP05-F01-US-BE-01` (BIO) | Liveness Rekognition | 🟡 Sprint 5b · V51 |

A US Liveness vive no UpStream Escritor Back (`06_US-BE_EP05-F01-US-BE-01_Orquestracao_Sessao_Liveness_Rekognition.md`).  
**Não é produto externo** — é backlog Noah. Artefatos com rótulo “Nexus” no path são do mesmo programa Prisma.

---

_Documento índice · Escritor Back_
