# Dev Agent Record — Sofia · EP-01 plug live

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Sprint 0 HTTP + plug 10 US-FE EP-01 (handoff Noah) |
| **Modo** | `VITE_DATA_MODE=live` (fallback mock) |

## Entregue

### Sprint 0
- `src/lib/httpClient.ts` — fetch único + `X-Correlation-ID` + `HttpError`
- `src/lib/useDataQuery.ts` — mock ↔ live com mesma máquina de estados DS §21
- `src/lib/config.ts` — `VITE_DATA_MODE` / base URL
- Proxy Vite `/api` + `/actuator` → `localhost:8080`
- `.env.example` · badge **API live | mock** no TopBar

### Sprint 1 — EP-01 live (mappers BE → view-model FE)
| US | Tela | Client |
|----|------|--------|
| F02 | FeatureCatalogPage | catalog + PIT |
| F03 | ScoreTimelinePage | score + history + recalculate |
| F09 | ModelRegistryPage | list + promote + rollback |
| F07 | IdentityMergePage | candidates + merge |
| F05 | PlaygroundPage | POST decisions (+ sessionStorage ids) |
| F04 | SnapshotComparePage | compare 2 ids da sessão + verify |
| F06 | ConnectorsPage | sources + ingest replay |
| F01 | StreamHealthPage | streams/health (ressalva lab) |
| F08 | SloPage | slo + budget (traces vazios no lab) |
| F10 | ReplayJobsPage | create/abort (lista inicia vazia) |

Arquivo central: `src/api/ep01.ts`

## Qualidade
- `tsc --noEmit` PASS
- `npm test` — **200/200** PASS

## Como rodar
1. BE Noah up: `http://localhost:8080` (`OIDC_ENABLED=false`)
2. `cd Prisma/frontend && npm run dev` → `http://localhost:5173`
3. Badge **API live** no topo
4. F04: emitir ≥2 decisões no Playground antes de comparar

## Gaps conhecidos (contrato lab)
- Shapes BE ≠ mock rico (campos UI preenchidos com defaults/mapeamento)
- F01 sem lag/throughput real (stub Kafka)
- F08 sem traces até decisionId conhecido
- F10 sem list endpoint — fila local pós-create
- EP-02…06 permanecem mock

## Próximo
- Diff OpenAPI × `data.ts` com Noah (gap list)
- Smoke conjunto BE+FE
- Commit no monorepo quando usuário pedir
