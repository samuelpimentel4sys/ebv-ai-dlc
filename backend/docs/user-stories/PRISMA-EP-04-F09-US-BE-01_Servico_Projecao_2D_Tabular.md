# PRISMA-EP-04-F09-US-BE-01 — Serviço de Projeção 2D e Tabular

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **P** (5 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F09-US-BE-01` |
| **Título** | Serviço de Projeção 2D e Tabular |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F09` — Modo Acessível 2D e Fallback sem WebGL |
| **US-FE relacionada** | `PRISMA-EP-04-F09-US-FE-01` — Acesso à Sala de Risco sem GPU |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | P (5 SP) |
| **Roles** | `ROLE_RISK_ANALYST` |

---

## 2. User Story

**Como** sistema  
**Quero** servir a mesma topologia em projeção bidimensional e em formato tabular  
**Para que** a análise permaneça acessível independentemente da capacidade gráfica

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F09` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Preservar em 2D toda informação disponível no 3D - Entregar formato tabular como último recurso - Manter os mesmos filtros e recortes do modo 3D

**Endpoints cobertos:** `GET /api/v1/portfolio/graph/2d`, `GET /api/v1/portfolio/graph/tabular`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `GET` | `/api/v1/portfolio/graph/2d` | Projeção 2D da topologia | JWT | P |
| `GET` | `/api/v1/portfolio/graph/tabular` | Fallback tabular a11y | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
GET /api/v1/portfolio/graph/2d?portfolioId={uuid}&filterId=flt-9c1
Authorization: Bearer {jwt}
```

### Response de sucesso

```json
{
  "nodes": [{"id": "n-1", "x": 0.2, "y": 0.7, "exposure": 1000, "riskBand": "B", "score": 700, "label": "CNPJ ..."}],
  "edges": [],
  "parityWith3d": true
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
| **CA-01** | Detectar a ausência de WebGL e trocar de modo automaticamente |
| **CA-02** | Disponibilizar em 2D toda informação presente no 3D |
| **CA-03** | Permitir navegação completa por teclado |
| **CA-04** | Preservar em 2D toda informação disponível no 3D |
| **CA-05** | Entregar formato tabular como último recurso |
| **CA-06** | Manter os mesmos filtros e recortes do modo 3D |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F09`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F09`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Serviço F01 graph · Redis.
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_RISK_ANALYST`).
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
CREATE TABLE portfolio.tb_graph_projection_cache (
  cache_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  projection VARCHAR(10) NOT NULL,
  filter_hash VARCHAR(64) NOT NULL,
  payload_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Degradação transparente | Ausência de suporte a WebGL no navegador | Carregar automaticamente o modo 2D sem exigir ação do usuário | Falha também no modo 2D exibe a versão tabular como último recurso | — |
| **RN002** | Equivalência de informação | Exibição de qualquer análise no modo alternativo | Garantir que nenhuma informação disponível no 3D esteja ausente | Análise sem equivalente 2D é substituída por tabela com aviso explícito | — |
| **RN003** | Paridade | mesmo filterId do 3D | parityWith3d=true | — | HTTP 200 |
| **RN004** | Filtros | tabular/2d | mesmos filtros do 3D | — | HTTP 200 |
| **RN005** | A11y | payload | labels para leitor de tela | — | HTTP 200 |

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
- RBAC: `ROLE_RISK_ANALYST`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

Serviço F01 graph · Redis

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 GET 2d parity true
- CT-02 GET tabular paginado
- CT-03 Mesmos filtros 3D
- CT-04 Portfolio 404
- CT-05 Auth 401
- CT-06 size>500 → 400
- CT-07 Cache hit
- CT-08 Labels presentes

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
