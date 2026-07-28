# PRISMA-EP-04-F06-US-BE-01 — Detecção Algorítmica de Comunidades

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Spark GraphX · Louvain · Neptune · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F06-US-BE-01` |
| **Título** | Detecção Algorítmica de Comunidades |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F06` — Detecção de Comunidades e Clusters de Risco |
| **US-FE relacionada** | `PRISMA-EP-04-F06-US-FE-01` — Análise de Bolsões de Risco |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | G (8 SP) |
| **Roles** | `ROLE_RISK_ANALYST` |

---

## 2. User Story

**Como** sistema  
**Quero** agrupar titulares por densidade de relações e calcular o perfil de risco  
**Para que** bolsões de risco correlacionado sejam encontrados sem inspeção manual

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F06` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Descartar agrupamentos abaixo do tamanho mínimo - Preservar identificadores estáveis entre execuções - Calcular score médio e exposição por comunidade

**Endpoints cobertos:** `POST /api/v1/portfolio/communities/detect`, `GET /api/v1/portfolio/communities`, `GET /api/v1/portfolio/communities/{communityId}`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `POST` | `/api/v1/portfolio/communities/detect` | Executa Louvain e materializa | JWT ROLE_RISK_ANALYST | G |
| `GET` | `/api/v1/portfolio/communities` | Lista comunidades ordenáveis | JWT | M |
| `GET` | `/api/v1/portfolio/communities/{communityId}` | Detalhe + membros | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/communities/detect
{"portfolioId": "a1b2...", "minCommunitySize": 5, "algorithm": "LOUVAIN"}
```

### Response de sucesso

```json
{"runId": "comm-run-1", "status": "RUNNING"}
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
| **CA-01** | Ordenar comunidades por exposição total |
| **CA-02** | Exibir score médio e inadimplência observada por comunidade |
| **CA-03** | Realçar a comunidade selecionada no cockpit 3D |
| **CA-04** | Descartar agrupamentos abaixo do tamanho mínimo |
| **CA-05** | Preservar identificadores estáveis entre execuções |
| **CA-06** | Calcular score médio e exposição por comunidade |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F06`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F06`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Spark GraphX + Louvain · Neptune.
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
CREATE TABLE portfolio.tb_risk_community (
  community_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  stable_key VARCHAR(64) NOT NULL,
  run_id UUID NOT NULL,
  member_count INTEGER NOT NULL,
  avg_score NUMERIC(8,2),
  total_exposure NUMERIC(18,2),
  observed_npl NUMERIC(8,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, portfolio_id, stable_key, run_id)
);
CREATE TABLE portfolio.tb_community_member (
  community_id UUID NOT NULL REFERENCES portfolio.tb_risk_community(community_id),
  node_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (community_id, node_id)
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Tamanho mínimo de comunidade | Execução da detecção | Descartar agrupamentos abaixo do tamanho mínimo configurado | Comunidade pequena com exposição relevante é mantida com marcação especial | — |
| **RN002** | Estabilidade entre execuções | Nova execução da detecção | Manter o identificador da comunidade quando a composição permanecer majoritariamente igual | Comunidade que se fragmenta recebe novos identificadores com vínculo à anterior | — |
| **RN003** | Tamanho mínimo | comunidade < minSize | descartar | — | HTTP 200 |
| **RN004** | Estabilidade | overlap alto entre runs | preservar stable_key | — | HTTP 200 |
| **RN005** | minSize | < 2 | rejeitar | MIN_SIZE_INVALID | HTTP 400 |

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

Spark GraphX + Louvain · Neptune

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 Detect 202
- CT-02 Comunidades pequenas descartadas
- CT-03 stable_key estável
- CT-04 Sort por exposição
- CT-05 Detail 404
- CT-06 minSize inválido 400
- CT-07 Membros persistidos
- CT-08 Auth 401

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
