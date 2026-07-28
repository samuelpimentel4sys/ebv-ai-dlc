# Dev Agent Record — PRISMA-EP-04 (lab skeleton 9/9)

**Agente:** Noah (dev-java-esp)  
**Data:** 2026-07-28  
**Status:** Lab stubs hexagonais · Flyway V40–V48 · `mvn test` obrigatório · **sem commit**

## Entregue

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

Por feature: domain ports + application lab services + JPA adapter + `PortfolioController` + ≥1 unit test.  
SecurityConfig roles EP-04 · GlobalExceptionHandler NotFound/422.

## Gaps (DoD)

- [ ] Neptune / Neo4j real (F01/F02/F06/F09)
- [ ] Spark GraphX contágio (F02)
- [ ] Trino / Iceberg OLAP + refresh real (F03/F05/F07)
- [ ] Louvain / Graph algorithm engine (F06)
- [ ] PDF + S3 pré-assinado dossiê (F08)
- [ ] Redis cache TTL grafo
- [ ] Commit/push
