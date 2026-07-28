# Dev Agent Record — PRISMA-EP-04 (lab skeleton 9/9)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28 (atualizado OBS-17/18)  
**Status:** Lab stubs hexagonais · Flyway V40–V48 · commit em `main` · **DoD % = 0** até Neptune/Trino

## Entregue (Lab)

| F | Feature | Flyway | Âncoras |
|---|---------|--------|---------|
| F01 | Serviço grafo carteira | V40 | `GET /api/v1/portfolio/graph` · `/graph/node/{id}` · `POST /graph/filter` |
| F02 | Cálculo propagação | V41 | `POST /contagion/simulate` · `GET /contagion/{simId}` · `GET /contagion/critical` |
| F03 | Motor estresse agregados | V42 | `POST /stress/run` · `GET /stress/scenarios` · `GET /stress/{runId}` |
| F04 | Vigilância limites | V43 | `GET /concentration` · `POST /limits` · `GET /alerts` |
| F05 | Manutenção cubos | V44 | `GET /aggregates` · `POST /aggregates/refresh` · `GET /aggregates/freshness` |
| F06 | Comunidades Louvain | V45 | `POST /communities/detect` · `GET /communities` · `GET /communities/{id}` |
| F07 | Estado histórico | V46 | `GET /snapshot` · `POST /compare` · `GET /timeline` |
| F08 | Dossiê executivo | V47 | `POST /reports` · `GET /reports/{id}` · `GET /reports/{id}/download` |
| F09 | Projeção 2D/tabular | V48 | `GET /graph/2d` · `GET /graph/tabular` |

OpenAPI: `@Tag Portfolio` = **(lab stub — sem Neptune/Trino DoD)** (OBS-17).

## Plano de substituição (OBS-18) — DoD % permanece 0 até item

| Feature | Lab hoje | Substituição DoD | Owner / nota |
|---------|----------|------------------|--------------|
| F01/F09 | `GraphLabService` + JPA | **Neptune** (ou Neo4j lab bridge já em host `192.168.31.47`) + Cypher real | Adapter `PortfolioGraphPort` |
| F02 | Contágio stub | Neptune + algoritmo / Spark GraphX | Port out |
| F03/F05/F07 | Cubos SQL lab | **Trino / Iceberg** OLAP + refresh job | Adapter query |
| F06 | Comunidades stub | Louvain engine (Neptune Gremlin / Neo4j GDS) | — |
| F08 | PDF/report stub | PDFBox + S3 pré-assinado | — |
| Cache | — | Redis TTL grafo | profile `infra` |

### Critério de saída Lab → DoD

1. Adapter real atrás do mesmo port (sem mudar contrato REST FE).
2. Feature flag / health: `partial=false` + OpenAPI sem “lab stub”.
3. Teste integração com grafo/OLAP real + smoke FE Sofia.
4. Atualizar `RELATORIO_PROGRESSO_BACKEND.md` Lab % vs DoD % **por feature**.

## Gaps (DoD)

- [ ] Neptune / Neo4j real (F01/F02/F06/F09)
- [ ] Spark GraphX contágio (F02)
- [ ] Trino / Iceberg OLAP + refresh real (F03/F05/F07)
- [ ] Louvain / Graph algorithm engine (F06)
- [ ] PDF + S3 pré-assinado dossiê (F08)
- [ ] Redis cache TTL grafo
