# Smoke APIs — 403 por role (Sofia → Noah)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-09-28 |
| **Via** | FE proxy `http://127.0.0.1:5173` + JWT Keycloak `prisma-lab` |
| **Users** | `platform` · `analista` · `titular` (senha lab `prisma`) |

## Veredicto

| User | Roles JWT | 403 no recorte | Comentário |
|------|-----------|---------------:|------------|
| **platform** | `PLATFORM` | **0** | Quase tudo abre; falhas restantes são 4xx/5xx de massa/bug, **não** auth |
| **analista** | `ANALISTA` | **25** | Role estreita — só score/explain em geral |
| **titular** | `TITULAR`, `TITULAR_B2C`, `CITIZEN`, `SUBJECT` | **20** | Só jornadas B2C (consent/coach/missions…) |

**Para “ver tudo funcionando” no console operador:** entrar como **`platform`**.  
403 de `analista`/`titular` são RBAC esperado — alinhar com Noah se o produto quiser roles mais amplas ou users com várias roles.

## platform — sem 403; outros erros a tratar com Noah

| Status | Path | Provável causa |
|-------:|------|----------------|
| 500 | `/api/v1/reviews/queue` | bug / schema |
| 500 | `/api/v1/subject-requests` | bug / schema |
| 500 | `/api/v1/policy/baseline` | bug / schema |
| 500 | `/api/v1/policy/versions` | bug / schema |
| 500 | `/api/v1/audit/trail` | bug / schema |
| 503 | `/api/v1/decisions/{id}/snapshot` | WORM indisponível |
| 400 | `/api/v1/explain/{id}/factors` | contrato / payload |
| 404 | `/api/v1/counterfactual/{id}` | massa seed |
| 404 | `/api/v1/disputes/indicators` | path FE ≠ BE |
| 405 | `/api/v1/replay/jobs` | GET não mapeado (só POST?) |

## 403 — analista (paths)

- `/api/v1/streams/health`
- `/api/v1/features/catalog`
- `/api/v1/models`
- `/api/v1/identity/candidates`
- `/api/v1/ingest/sources`
- `/api/v1/observability/slo`
- `/api/v1/reasons`
- `/api/v1/reviews/queue`
- `/api/v1/fairness/metrics`
- `/api/v1/subject-requests`
- `/api/v1/policy/versions`
- `/api/v1/audit/trail`
- `/api/v1/portfolio/graph`
- `/api/v1/portfolio/concentration`
- `/api/v1/disputes/queue`
- `/api/v1/console/usage`
- `/api/v1/alternative-data/coverage`
- `/api/v1/thinfile/model-card`
- `/api/v1/consents/{doc}`
- `/api/v1/coach/journey`
- `/api/v1/missions`
- `/api/v1/marketplace/offers`
- `/api/v1/pj/opinions/queue`
- `/api/v1/pj/{cnpj}/ratios`
- `/api/v1/pj/telemetry/cost`

## 403 — titular (paths)

Mesmo padrão de ops/risco/compliance/PJ/portfolio/console +:

- `/api/v1/score/{doc}/history` (titular **não** lê history com esse JWT)
- `/api/v1/explain/{decision}`

Titular **não** toma 403 em: consent, coach, missions, marketplace (B2C) — esperado.

## Pedido ao Noah

1. Confirmar matriz role × path (PLATFORM vs ANALISTA vs TITULAR*).  
2. Se demo precisa de um “operador pleno” além de PLATFORM: user `steward` com união de roles, ou ampliar `@PreAuthorize` de ANALISTA.  
3. Corrigir os **500** da lista platform (não são 403).  
4. Alinhar `disputes/indicators` e `replay/jobs` GET com o contrato FE.

_Sofia · smoke 403 · 2026-09-28_
