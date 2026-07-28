# PRISMA-EP-04-F04-US-BE-01 — Vigilância Contínua de Limites

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Flink · SNS · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F04-US-BE-01` |
| **Título** | Vigilância Contínua de Limites |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F04` — Radar de Concentração e Alertas de Portfólio |
| **US-FE relacionada** | `PRISMA-EP-04-F04-US-FE-01` — Acompanhamento de Concentração |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | M (8 SP) |
| **Roles** | `ROLE_PORTFOLIO_MANAGER, ROLE_RISK_ANALYST` |

---

## 2. User Story

**Como** sistema  
**Quero** reavaliar a concentração a cada atualização relevante da carteira  
**Para que** o estouro de apetite seja evitado e não apenas constatado

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F04` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Notificar ao atingir o percentual de antecipação configurado - Escalar a severidade conforme a duração da violação - Manter histórico das violações com providências registradas

**Endpoints cobertos:** `GET /api/v1/portfolio/concentration`, `POST /api/v1/portfolio/limits`, `GET /api/v1/portfolio/alerts`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `GET` | `/api/v1/portfolio/concentration` | Posição vs limites por dimensão | JWT ROLE_PORTFOLIO_MANAGER | M |
| `POST` | `/api/v1/portfolio/limits` | Cadastra/atualiza limites | JWT ROLE_PORTFOLIO_MANAGER | P |
| `GET` | `/api/v1/portfolio/alerts` | Alertas abertos/histórico | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/limits
Authorization: Bearer {jwt}
Content-Type: application/json

{"portfolioId": "a1b2...", "dimension": "SETOR", "thresholdPct": 30.0, "warnPct": 27.0}
```

### Response de sucesso

```json
{
  "portfolioId": "a1b2...",
  "dimensions": [
    {"dimension": "SETOR", "key": "VAREJO", "currentPct": 28.4, "thresholdPct": 30.0, "warnPct": 27.0, "status": "WARN"}
  ]
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
| **CA-01** | Exibir a posição atual frente ao limite em cada dimensão |
| **CA-02** | Destacar dimensões próximas do limite |
| **CA-03** | Registrar a providência tomada em cada alerta |
| **CA-04** | Notificar ao atingir o percentual de antecipação configurado |
| **CA-05** | Escalar a severidade conforme a duração da violação |
| **CA-06** | Manter histórico das violações com providências registradas |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F04`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F04`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Apache Flink · PostgreSQL · Amazon SNS.
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_PORTFOLIO_MANAGER, ROLE_RISK_ANALYST`).
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
CREATE TABLE portfolio.tb_concentration_limit (
  limit_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  dimension VARCHAR(40) NOT NULL,
  threshold_pct NUMERIC(6,3) NOT NULL,
  warn_pct NUMERIC(6,3) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE portfolio.tb_concentration_alert (
  alert_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  dimension VARCHAR(40) NOT NULL,
  current_pct NUMERIC(6,3) NOT NULL,
  threshold_pct NUMERIC(6,3) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  action_notes TEXT
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Alerta antecipado | Concentração atingindo percentual configurado do limite | Notificar o gestor antes que o limite seja efetivamente violado | Violação já consumada eleva a severidade e notifica também o comitê | — |
| **RN002** | Persistência da violação | Concentração acima do limite por período contínuo | Escalar a severidade conforme a duração da violação | Violação com plano de ação registrado mantém a severidade original | — |
| **RN003** | Antecipação | atinge warn_pct | SNS + severity WARN | — | HTTP 200 |
| **RN004** | Escalonamento | violação sustentada > N h | severity ESCALATED | — | HTTP 200 |
| **RN005** | Consistência limite | warn >= threshold | rejeitar | LIMIT_INVALID | HTTP 400 |

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
- RBAC: `ROLE_PORTFOLIO_MANAGER, ROLE_RISK_ANALYST`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

Apache Flink · PostgreSQL · Amazon SNS

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 GET concentration WARN
- CT-02 POST limits 201
- CT-03 warn>=threshold → 400
- CT-04 Evento Flink dispara alerta
- CT-05 ESCALATED por duração
- CT-06 GET alerts OPEN
- CT-07 Providência registrada
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
