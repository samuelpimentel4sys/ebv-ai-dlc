# User Stories Backend — PRISMA-EP-03

**Épico:** Copiloto GenAI de Crédito PJ com Grounding Auditável  
**Agente:** Escritor Back (BMAD UpStream)  
**Data:** 2026-07-27  
**Fontes:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-03/*`  
**Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
**Release:** Release 2 (Estratégico · WSJF 4,00)

## Índice

| US-ID | Feature | Título | Endpoints | Complexidade | Prioridade | Arquivo |
| --- | --- | --- | :---: | :---: | :---: | --- |
| `PRISMA-EP-03-F01-US-BE-01` | `PRISMA-EP-03-F01` | Extração Estruturada de Demonstrativos | 3 | G | P2 | [arquivo](./PRISMA-EP-03-F01-US-BE-01_Extracao_Estruturada_Demonstrativos.md) |
| `PRISMA-EP-03-F02-US-BE-01` | `PRISMA-EP-03-F02` | Recuperação com Grounding Isolado por Cliente | 3 | G | P2 | [arquivo](./PRISMA-EP-03-F02-US-BE-01_Recuperacao_Grounding_Isolado.md) |
| `PRISMA-EP-03-F03-US-BE-01` | `PRISMA-EP-03-F03` | Geração Seccionada do Parecer | 3 | G | P2 | [arquivo](./PRISMA-EP-03-F03-US-BE-01_Geracao_Seccionada_Parecer.md) |
| `PRISMA-EP-03-F04-US-BE-01` | `PRISMA-EP-03-F04` | Controle de Alçada e Trilha de Aprovação | 3 | M | P2 | [arquivo](./PRISMA-EP-03-F04-US-BE-01_Controle_Alcada_Trilha_Aprovacao.md) |
| `PRISMA-EP-03-F05-US-BE-01` | `PRISMA-EP-03-F05` | Cálculo Padronizado de Índices Financeiros PJ | 3 | M | P2 | [arquivo](./PRISMA-EP-03-F05-US-BE-01_Calculo_Padronizado_Indices.md) |
| `PRISMA-EP-03-F06-US-BE-01` | `PRISMA-EP-03-F06` | Verificação Automática de Aderência à Fonte | 2 | G | P2 | [arquivo](./PRISMA-EP-03-F06-US-BE-01_Verificacao_Aderencia_Fonte.md) |
| `PRISMA-EP-03-F07-US-BE-01` | `PRISMA-EP-03-F07` | Ciclo de Vida do Documento Corporativo | 3 | M | P3 | [arquivo](./PRISMA-EP-03-F07-US-BE-01_Ciclo_Vida_Documento_Corporativo.md) |
| `PRISMA-EP-03-F08-US-BE-01` | `PRISMA-EP-03-F08` | Consolidação de Exposição por Grupo Econômico | 3 | G | P3 | [arquivo](./PRISMA-EP-03-F08-US-BE-01_Consolidacao_Exposicao_Grupo.md) |
| `PRISMA-EP-03-F09-US-BE-01` | `PRISMA-EP-03-F09` | Roteamento Econômico de Modelos | 3 | M | P3 | [arquivo](./PRISMA-EP-03-F09-US-BE-01_Roteamento_Economico_Modelos.md) |

**Total:** 9 US Backend · 26 endpoints · Σ SP = 60

## Mapa de Endpoints

| Método | Path | US |
| --- | --- | --- |
| `POST` | `/api/v1/pj/documents` | `PRISMA-EP-03-F01-US-BE-01` |
| `GET` | `/api/v1/pj/documents/{docId}/extraction` | `PRISMA-EP-03-F01-US-BE-01` |
| `PATCH` | `/api/v1/pj/documents/{docId}/correct` | `PRISMA-EP-03-F01-US-BE-01` |
| `POST` | `/api/v1/pj/rag/index` | `PRISMA-EP-03-F02-US-BE-01` |
| `POST` | `/api/v1/pj/rag/query` | `PRISMA-EP-03-F02-US-BE-01` |
| `GET` | `/api/v1/pj/rag/citations/{answerId}` | `PRISMA-EP-03-F02-US-BE-01` |
| `POST` | `/api/v1/pj/opinions` | `PRISMA-EP-03-F03-US-BE-01` |
| `GET` | `/api/v1/pj/opinions/{opinionId}` | `PRISMA-EP-03-F03-US-BE-01` |
| `PATCH` | `/api/v1/pj/opinions/{opinionId}` | `PRISMA-EP-03-F03-US-BE-01` |
| `POST` | `/api/v1/pj/opinions/{id}/submit` | `PRISMA-EP-03-F04-US-BE-01` |
| `POST` | `/api/v1/pj/opinions/{id}/approve` | `PRISMA-EP-03-F04-US-BE-01` |
| `GET` | `/api/v1/pj/opinions/{id}/trail` | `PRISMA-EP-03-F04-US-BE-01` |
| `POST` | `/api/v1/pj/ratios/calculate` | `PRISMA-EP-03-F05-US-BE-01` |
| `GET` | `/api/v1/pj/{cnpj}/ratios` | `PRISMA-EP-03-F05-US-BE-01` |
| `GET` | `/api/v1/pj/ratios/benchmarks` | `PRISMA-EP-03-F05-US-BE-01` |
| `POST` | `/api/v1/pj/guardrails/verify` | `PRISMA-EP-03-F06-US-BE-01` |
| `GET` | `/api/v1/pj/guardrails/report/{opinionId}` | `PRISMA-EP-03-F06-US-BE-01` |
| `POST` | `/api/v1/pj/library/documents` | `PRISMA-EP-03-F07-US-BE-01` |
| `GET` | `/api/v1/pj/library/{cnpj}` | `PRISMA-EP-03-F07-US-BE-01` |
| `DELETE` | `/api/v1/pj/library/documents/{docId}` | `PRISMA-EP-03-F07-US-BE-01` |
| `GET` | `/api/v1/pj/{cnpj}/group` | `PRISMA-EP-03-F08-US-BE-01` |
| `GET` | `/api/v1/pj/{cnpj}/related-parties` | `PRISMA-EP-03-F08-US-BE-01` |
| `POST` | `/api/v1/pj/group/refresh` | `PRISMA-EP-03-F08-US-BE-01` |
| `GET` | `/api/v1/pj/telemetry/cost` | `PRISMA-EP-03-F09-US-BE-01` |
| `POST` | `/api/v1/pj/routing/policy` | `PRISMA-EP-03-F09-US-BE-01` |
| `GET` | `/api/v1/pj/routing/decisions` | `PRISMA-EP-03-F09-US-BE-01` |

## Ordem de implementação sugerida

1. **F01** (extração) + **F07** (biblioteca) + **F02** (RAG grounding) — fundação de dados  
2. **F05** (índices) + **F03** (gerador parecer) + **F06** (guardrails) — núcleo copiloto  
3. **F04** (HITL/alçada) — governança  
4. **F08** (grupo econômico) + **F09** (roteamento/custo) — expansão Release 2

## Relação com EP-05

Pacote independente. EP-05 = Contestação/Console B2B. EP-03 = Copiloto GenAI PJ com grounding auditável.

---

_Documento índice · Escritor Back_
