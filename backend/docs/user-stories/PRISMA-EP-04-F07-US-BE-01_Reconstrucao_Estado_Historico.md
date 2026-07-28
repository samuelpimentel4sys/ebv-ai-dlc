# PRISMA-EP-04-F07-US-BE-01 — Reconstrução de Estado Histórico

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Iceberg time travel · Trino · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (8 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F07-US-BE-01` |
| **Título** | Reconstrução de Estado Histórico |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F07` — Time Machine de Portfólio |
| **US-FE relacionada** | `PRISMA-EP-04-F07-US-FE-01` — Retrospectiva de Decisão de Carteira |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | M (8 SP) |
| **Roles** | `ROLE_RISK_DIRECTOR, ROLE_RISK_ANALYST` |

---

## 2. User Story

**Como** sistema  
**Quero** recuperar o estado da carteira em data passada usando viagem no tempo  
**Para que** decisões de portfólio possam ser avaliadas com contexto correto

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F07` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Atender apenas datas dentro da janela de retenção - Refletir os snapshots de decisão vigentes na data - Alertar divergências entre a reconstrução e os snapshots

**Endpoints cobertos:** `GET /api/v1/portfolio/snapshot`, `POST /api/v1/portfolio/compare`, `GET /api/v1/portfolio/timeline`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `GET` | `/api/v1/portfolio/snapshot` | Estado as-of date (time travel) | JWT ROLE_RISK_DIRECTOR | M |
| `POST` | `/api/v1/portfolio/compare` | Compara dois instantes | JWT | M |
| `GET` | `/api/v1/portfolio/timeline` | Eventos de impacto | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
GET /api/v1/portfolio/snapshot?portfolioId={uuid}&date=2026-01-15
Authorization: Bearer {jwt}
```

### Response de sucesso

```json
{
  "asOfDate": "2026-01-15",
  "aggregateVersion": "hist-...",
  "nodeCount": 15000,
  "divergenceFlag": false,
  "summary": {"totalExposure": 1200000000.0, "npl": 3.9}
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
| **CA-01** | Selecionar qualquer data dentro da janela de retenção |
| **CA-02** | Comparar dois instantes com destaque nas diferenças |
| **CA-03** | Marcar na linha do tempo os eventos de maior impacto |
| **CA-04** | Atender apenas datas dentro da janela de retenção |
| **CA-05** | Refletir os snapshots de decisão vigentes na data |
| **CA-06** | Alertar divergências entre a reconstrução e os snapshots |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F07`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F07`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Iceberg time travel · Trino.
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_RISK_DIRECTOR, ROLE_RISK_ANALYST`).
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
CREATE TABLE portfolio.tb_snapshot_request (
  request_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  as_of_date DATE NOT NULL,
  iceberg_snap VARCHAR(128),
  status VARCHAR(20) NOT NULL,
  divergence_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Limite da janela de retrospectiva | Solicitação de estado da carteira em data passada | Atender apenas datas dentro do período de retenção configurado | Data fora da janela devolve erro explícito com o limite disponível | — |
| **RN002** | Coerência com decisões emitidas | Reconstrução de estado passado | Refletir exatamente os snapshots de decisão vigentes naquela data | Divergência detectada gera alerta de inconsistência ao time de dados | — |
| **RN003** | Retenção | data fora da janela | recusar | RETENTION_WINDOW | HTTP 422 |
| **RN004** | Divergência | reconstrução ≠ snapshot decisão | divergenceFlag + aviso | — | HTTP 200 |
| **RN005** | Ordem datas | dateA > dateB | rejeitar | DATE_ORDER | HTTP 400 |

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
- RBAC: `ROLE_RISK_DIRECTOR, ROLE_RISK_ANALYST`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

Iceberg time travel · Trino

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 Snapshot válido
- CT-02 Fora retenção 422
- CT-03 Compare deltas
- CT-04 Timeline
- CT-05 divergenceFlag
- CT-06 dateA>dateB 400
- CT-07 Auth
- CT-08 Portfolio 404

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
