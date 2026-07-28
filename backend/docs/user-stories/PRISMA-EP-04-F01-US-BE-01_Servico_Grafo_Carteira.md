# PRISMA-EP-04-F01-US-BE-01 — Serviço de Grafo de Carteira

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · Neo4j/Neptune · Trino · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F01-US-BE-01` |
| **Título** | Serviço de Grafo de Carteira |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F01` — Cockpit WebGL de Grafo 3D de Carteira |
| **US-FE relacionada** | `PRISMA-EP-04-F01-US-FE-01` — Exploração Visual da Carteira |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | M (8 SP) |
| **Roles** | `ROLE_RISK_ANALYST, ROLE_RISK_DIRECTOR` |

---

## 2. User Story

**Como** sistema  
**Quero** servir a topologia da carteira com agregação por nível de detalhe  
**Para que** o cockpit renderize carteiras grandes sem travar o navegador

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F01` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Entregar o grafo agregado conforme o nível de detalhe solicitado - Responder em menos de 2 segundos para o recorte padrão - Recusar recorte acima do limite de nós com orientação de filtro

**Endpoints cobertos:** `GET /api/v1/portfolio/graph`, `GET /api/v1/portfolio/graph/node/{nodeId}`, `POST /api/v1/portfolio/graph/filter`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `GET` | `/api/v1/portfolio/graph` | Topologia agregada por LOD | JWT ROLE_RISK_ANALYST | M |
| `GET` | `/api/v1/portfolio/graph/node/{nodeId}` | Detalhe do nó + vizinhança | JWT ROLE_RISK_ANALYST | P |
| `POST` | `/api/v1/portfolio/graph/filter` | Aplica filtros e recalcula recorte | JWT ROLE_RISK_ANALYST | M |

---

## 5. Contrato de API (prévia)

### Request principal

```
GET /api/v1/portfolio/graph?portfolioId={uuid}&lod=2&maxNodes=50000
Headers:
  Authorization: Bearer {jwt}
  X-Tenant-Id: {tenant}
  X-Correlation-ID: {uuid}
```

### Response de sucesso

```json
{
  "portfolioId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "lod": 2,
  "nodeCount": 18420,
  "edgeCount": 51230,
  "aggregateVersion": "agg-2026-07-27T18:00:00Z",
  "latencyMs": 842,
  "nodes": [
    {"id": "n-1001", "exposure": 1250000.50, "riskBand": "C", "score": 612, "x": 0.12, "y": 0.44, "z": 0.08}
  ],
  "edges": [
    {"source": "n-1001", "target": "n-2044", "weight": 0.37, "relationType": "FORNECEDOR"}
  ],
  "truncated": false
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/portfolio/...",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    {"field": "portfolioId", "message": "Campo obrigatório", "rejectedValue": null}
  ]
}
```

Códigos previstos: **200/201/202/204**, **400**, **401**, **403**, **404**, **409**, **422**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | Manter no mínimo 30 quadros por segundo na carga de referência |
| **CA-02** | Dimensionar nós por exposição e colorir por faixa de risco |
| **CA-03** | Abrir painel lateral com o detalhe do nó selecionado |
| **CA-04** | Entregar o grafo agregado conforme o nível de detalhe solicitado |
| **CA-05** | Responder em menos de 2 segundos para o recorte padrão |
| **CA-06** | Recusar recorte acima do limite de nós com orientação de filtro |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F01`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F01`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: OLAP/Trino · Neptune/Neo4j · Score Vivo EP-01 · Redis (TTL 5 min).
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_RISK_ANALYST, ROLE_RISK_DIRECTOR`).
2. Validar path/query/body (Bean Validation).
3. Aplicar RNs da §8.4 na ordem: formato → existência → negócio → persistência/integração.
4. Persistir auditoria (`X-Correlation-ID`).
5. Retornar DTO de sucesso ou Error DTO padronizado.

**Transação:** `@Transactional` em escritas; leituras `readOnly=true`.  
**Idempotência:** `X-Idempotency-Key` em POST de efeito colateral (simulate/run/refresh/reports).  
**Rate limit:** 120 req/min por usuário na sala de risco · headers `X-RateLimit-*`.

### 8.2 Request / Response Schemas (DTOs)

- **Request DTOs:** tipados, `@NotNull` / `@Size` / `@DecimalMin` conforme exemplos da §5.
- **Response DTOs:** sem segredos; datas ISO-8601 UTC.
- **Error DTO:** schema único (§5).

### 8.3 Modelo de Dados

#### DDL (PostgreSQL 16 · schema `portfolio`)

```sql
CREATE SCHEMA IF NOT EXISTS portfolio;

CREATE TABLE portfolio.tb_graph_cache (
  cache_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  lod_level SMALLINT NOT NULL CHECK (lod_level BETWEEN 0 AND 5),
  node_count INTEGER NOT NULL,
  edge_count INTEGER NOT NULL,
  payload_uri TEXT NOT NULL,
  payload_digest BYTEA NOT NULL,
  aggregate_version VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_graph_cache_lookup ON portfolio.tb_graph_cache (tenant_id, portfolio_id, lod_level);

CREATE TABLE portfolio.tb_graph_access_audit (
  audit_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  endpoint VARCHAR(120) NOT NULL,
  lod_level SMALLINT,
  node_count INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Nível de detalhe por distância | Renderização de grafo com mais de 50 mil nós | Agregar nós distantes em super-nós e detalhar apenas a região focada | Recorte que exceda o limite de nós exige filtro adicional antes de renderizar | — |
| **RN002** | Preservação de contexto na navegação | Foco em um nó específico | Manter visível a vizinhança imediata do nó focado | Nó sem relações é exibido com aviso de isolamento na carteira | — |
| **RN003** | Limite de nós | maxNodes > 50000 sem filtro | Recusar com orientação de filtro | NODE_LIMIT_EXCEEDED | HTTP 422 |
| **RN004** | LOD válido | lod fora 0..5 | Rejeitar payload | LOD_INVALID | HTTP 400 |
| **RN005** | SLA grafo | recorte padrão | p95 < 2000 ms | — | HTTP SLA |

**Ordem de validação:** (1) formato DTO → (2) existência tenant/portfolio → (3) regras de negócio → (4) persistência/integração.

### 8.5 Camadas e Estrutura

| Camada | Responsabilidade |
| --- | --- |
| Controller | REST, `@Valid`, HTTP mapping |
| Service | RNs, orquestração OLAP/grafo, `@Transactional` |
| Repository / Ports | JPA + adapters Trino/Neptune/S3/SNS/Flink |
| Mapper | Entity ↔ DTO · minimização de PII |

### 8.6 Segurança

- JWT Bearer (OIDC) · claims `sub`, `tenant_id`, `roles`
- RBAC: `ROLE_RISK_ANALYST, ROLE_RISK_DIRECTOR`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

OLAP/Trino · Neptune/Neo4j · Score Vivo EP-01 · Redis (TTL 5 min)

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 GET /graph LOD=2 happy path < 2s
- CT-02 Recorte > 50k → 422 NODE_LIMIT_EXCEEDED
- CT-03 GET node inexistente → 404
- CT-04 Sem JWT → 401
- CT-05 Sem role → 403
- CT-06 POST filter riskBand inválido → 400
- CT-07 Cache Redis hit
- CT-08 Auditoria persiste latency_ms

**Meta de cobertura:** >80% service + contract tests (RestAssured / Testcontainers).

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 (contratos) completa
- [x] Todos endpoints documentados
- [x] Request/Response + Error DTO
- [x] DDL PostgreSQL
- [x] RNs numeradas com HTTP
- [x] Segurança / roles
- [x] ≥5 cenários de teste

**Status:** Pronta para desenvolvimento ✅  
**Handoff:** BMM Dev · DBA (`portfolio`) · TEA · OpenAPI

---

_Documento elaborado com agente Escritor Back (BMAD UpStream) · EBV Prisma · 2026-07-27_
