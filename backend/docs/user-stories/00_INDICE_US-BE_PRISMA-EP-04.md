# User Stories Backend — PRISMA-EP-04

**Épico:** Sala de Risco Imersiva & Radar de Portfólio  
**Agente:** Escritor Back (BMAD UpStream)  
**Data:** 2026-07-27  
**Fontes:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-04/*` · Resumo Downstream · DBA/Arquitetura V2  
**Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · Trino/Iceberg · Neptune · OIDC (Keycloak)

## Índice

| US-ID | Feature | Título | Endpoints | Complexidade | Prioridade | Arquivo |
| --- | --- | --- | :---: | :---: | :---: | --- |
| `PRISMA-EP-04-F01-US-BE-01` | `PRISMA-EP-04-F01` | Serviço de Grafo de Carteira | 3 | M | P2 | [arquivo](./PRISMA-EP-04-F01-US-BE-01_Servico_Grafo_Carteira.md) |
| `PRISMA-EP-04-F02-US-BE-01` | `PRISMA-EP-04-F02` | Cálculo de Propagação em Grafo | 3 | G | P2 | [arquivo](./PRISMA-EP-04-F02-US-BE-01_Calculo_Propagacao_Grafo.md) |
| `PRISMA-EP-04-F03-US-BE-01` | `PRISMA-EP-04-F03` | Motor de Estresse sobre Agregados | 3 | G | P2 | [arquivo](./PRISMA-EP-04-F03-US-BE-01_Motor_Estresse_Agregados.md) |
| `PRISMA-EP-04-F04-US-BE-01` | `PRISMA-EP-04-F04` | Vigilância Contínua de Limites | 3 | M | P2 | [arquivo](./PRISMA-EP-04-F04-US-BE-01_Vigilancia_Continua_Limites.md) |
| `PRISMA-EP-04-F05-US-BE-01` | `PRISMA-EP-04-F05` | Manutenção Incremental dos Cubos | 3 | G | P2 | [arquivo](./PRISMA-EP-04-F05-US-BE-01_Manutencao_Incremental_Cubos.md) |
| `PRISMA-EP-04-F06-US-BE-01` | `PRISMA-EP-04-F06` | Detecção Algorítmica de Comunidades | 3 | G | P3 | [arquivo](./PRISMA-EP-04-F06-US-BE-01_Deteccao_Algoritmica_Comunidades.md) |
| `PRISMA-EP-04-F07-US-BE-01` | `PRISMA-EP-04-F07` | Reconstrução de Estado Histórico | 3 | M | P3 | [arquivo](./PRISMA-EP-04-F07-US-BE-01_Reconstrucao_Estado_Historico.md) |
| `PRISMA-EP-04-F08-US-BE-01` | `PRISMA-EP-04-F08` | Geração do Dossiê Executivo | 3 | M | P3 | [arquivo](./PRISMA-EP-04-F08-US-BE-01_Geracao_Dossie_Executivo.md) |
| `PRISMA-EP-04-F09-US-BE-01` | `PRISMA-EP-04-F09` | Serviço de Projeção 2D e Tabular | 2 | P | P3 | [arquivo](./PRISMA-EP-04-F09-US-BE-01_Servico_Projecao_2D_Tabular.md) |

**Total:** 9 US Backend · 26 endpoints · Σ SP = 81

## Mapa de Endpoints

| Método | Path | US |
| --- | --- | --- |
| `GET` | `/api/v1/portfolio/graph` | `PRISMA-EP-04-F01-US-BE-01` |
| `GET` | `/api/v1/portfolio/graph/node/{nodeId}` | `PRISMA-EP-04-F01-US-BE-01` |
| `POST` | `/api/v1/portfolio/graph/filter` | `PRISMA-EP-04-F01-US-BE-01` |
| `POST` | `/api/v1/portfolio/contagion/simulate` | `PRISMA-EP-04-F02-US-BE-01` |
| `GET` | `/api/v1/portfolio/contagion/{simId}` | `PRISMA-EP-04-F02-US-BE-01` |
| `GET` | `/api/v1/portfolio/contagion/critical` | `PRISMA-EP-04-F02-US-BE-01` |
| `POST` | `/api/v1/portfolio/stress/run` | `PRISMA-EP-04-F03-US-BE-01` |
| `GET` | `/api/v1/portfolio/stress/scenarios` | `PRISMA-EP-04-F03-US-BE-01` |
| `GET` | `/api/v1/portfolio/stress/{runId}` | `PRISMA-EP-04-F03-US-BE-01` |
| `GET` | `/api/v1/portfolio/concentration` | `PRISMA-EP-04-F04-US-BE-01` |
| `POST` | `/api/v1/portfolio/limits` | `PRISMA-EP-04-F04-US-BE-01` |
| `GET` | `/api/v1/portfolio/alerts` | `PRISMA-EP-04-F04-US-BE-01` |
| `GET` | `/api/v1/portfolio/aggregates` | `PRISMA-EP-04-F05-US-BE-01` |
| `POST` | `/api/v1/portfolio/aggregates/refresh` | `PRISMA-EP-04-F05-US-BE-01` |
| `GET` | `/api/v1/portfolio/aggregates/freshness` | `PRISMA-EP-04-F05-US-BE-01` |
| `POST` | `/api/v1/portfolio/communities/detect` | `PRISMA-EP-04-F06-US-BE-01` |
| `GET` | `/api/v1/portfolio/communities` | `PRISMA-EP-04-F06-US-BE-01` |
| `GET` | `/api/v1/portfolio/communities/{communityId}` | `PRISMA-EP-04-F06-US-BE-01` |
| `GET` | `/api/v1/portfolio/snapshot` | `PRISMA-EP-04-F07-US-BE-01` |
| `POST` | `/api/v1/portfolio/compare` | `PRISMA-EP-04-F07-US-BE-01` |
| `GET` | `/api/v1/portfolio/timeline` | `PRISMA-EP-04-F07-US-BE-01` |
| `POST` | `/api/v1/portfolio/reports` | `PRISMA-EP-04-F08-US-BE-01` |
| `GET` | `/api/v1/portfolio/reports/{reportId}` | `PRISMA-EP-04-F08-US-BE-01` |
| `GET` | `/api/v1/portfolio/reports/{reportId}/download` | `PRISMA-EP-04-F08-US-BE-01` |
| `GET` | `/api/v1/portfolio/graph/2d` | `PRISMA-EP-04-F09-US-BE-01` |
| `GET` | `/api/v1/portfolio/graph/tabular` | `PRISMA-EP-04-F09-US-BE-01` |

## Ordem de implementação sugerida

1. **F05** (OLAP / frescor) — fundação de latência < 5s  
2. **F01** (grafo) + **F09** (fallback 2D/tabular)  
3. **F02** (contágio) + **F03** (estresse) + **F04** (radar)  
4. **F06** (comunidades) + **F07** (time machine) + **F08** (dossiê comitê)

## Nota

Pacote cobre o programa **PRISMA-EP-04** (Explorer Cursor): Sala de Risco Imersiva & Radar de Portfólio.  
Formato alinhado às US-BE do `PRISMA-EP-05` já presentes nesta pasta.

---

_Documento índice · Escritor Back_
