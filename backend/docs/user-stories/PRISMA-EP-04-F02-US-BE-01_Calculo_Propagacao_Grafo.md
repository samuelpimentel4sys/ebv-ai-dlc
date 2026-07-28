# PRISMA-EP-04-F02-US-BE-01 — Cálculo de Propagação em Grafo

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · Neptune · Spark GraphX · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (13 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F02-US-BE-01` |
| **Título** | Cálculo de Propagação em Grafo |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F02` — Motor de Análise de Contágio em Grafo |
| **US-FE relacionada** | `PRISMA-EP-04-F02-US-FE-01` — Simulação de Efeito Dominó |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | G (13 SP) |
| **Roles** | `ROLE_RISK_ANALYST, ROLE_RISK_DIRECTOR` |

---

## 2. User Story

**Como** sistema  
**Quero** propagar o default pela topologia da carteira com fator de transmissão parametrizado  
**Para que** o risco sistêmico da carteira seja quantificável

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F02` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Respeitar o limite de ondas configurado - Retornar perda esperada por nível de propagação - Registrar as premissas usadas junto com o resultado

**Endpoints cobertos:** `POST /api/v1/portfolio/contagion/simulate`, `GET /api/v1/portfolio/contagion/{simId}`, `GET /api/v1/portfolio/contagion/critical`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `POST` | `/api/v1/portfolio/contagion/simulate` | Propaga default a partir de nó origem | JWT ROLE_RISK_ANALYST | G |
| `GET` | `/api/v1/portfolio/contagion/{simId}` | Resultado com perda por onda | JWT ROLE_RISK_ANALYST | M |
| `GET` | `/api/v1/portfolio/contagion/critical` | Ranking de nós sistêmicos | JWT ROLE_RISK_ANALYST | M |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/contagion/simulate
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "portfolioId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "originNodeId": "n-1001",
  "transmissionFactor": 0.35,
  "maxWaves": 4,
  "relationTypes": ["FORNECEDOR", "GRUPO_ECONOMICO"]
}
```

### Response de sucesso

```json
{
  "simId": "sim-77ab",
  "status": "RUNNING",
  "pollUrl": "/api/v1/portfolio/contagion/sim-77ab"
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
| **CA-01** | Permitir escolher o titular de origem da simulação |
| **CA-02** | Exibir a perda esperada por onda de propagação |
| **CA-03** | Listar os titulares mais críticos da carteira |
| **CA-04** | Respeitar o limite de ondas configurado |
| **CA-05** | Retornar perda esperada por nível de propagação |
| **CA-06** | Registrar as premissas usadas junto com o resultado |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F02`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F02`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Neptune/Neo4j · Spark GraphX · Redis.
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
CREATE TABLE portfolio.tb_contagion_simulation (
  sim_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  origin_node_id VARCHAR(64) NOT NULL,
  transmission_factor DECIMAL(5,4) NOT NULL CHECK (transmission_factor > 0 AND transmission_factor <= 1),
  max_waves SMALLINT NOT NULL CHECK (max_waves BETWEEN 1 AND 10),
  status VARCHAR(20) NOT NULL,
  expected_loss_total NUMERIC(18,2),
  extreme_flag BOOLEAN NOT NULL DEFAULT FALSE,
  premises_json JSONB NOT NULL,
  exportable BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE TABLE portfolio.tb_contagion_wave (
  wave_id UUID PRIMARY KEY,
  sim_id UUID NOT NULL REFERENCES portfolio.tb_contagion_simulation(sim_id),
  wave_number SMALLINT NOT NULL,
  node_count INTEGER NOT NULL,
  expected_loss NUMERIC(18,2) NOT NULL,
  critical_nodes JSONB NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Limite de profundidade da propagação | Execução de simulação de contágio | Interromper a propagação após o número de ondas configurado | Propagação que atinja mais da metade da carteira é sinalizada como cenário extremo | — |
| **RN002** | Transparência do fator de transmissão | Apresentação de resultado de contágio | Exibir sempre o fator de transmissão e as premissas usadas | Resultado sem premissas visíveis não pode ser exportado para o comitê | — |
| **RN003** | Exportação comitê | resultado sem premises | exportable=false | PREMISES_REQUIRED | HTTP 422 |
| **RN004** | Cenário extremo | propagação > 50% carteira | extremeFlag=true | — | HTTP 200 |
| **RN005** | Fator transmissão | fora (0,1] | rejeitar | FACTOR_INVALID | HTTP 400 |

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

Neptune/Neo4j · Spark GraphX · Redis

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 Simulate → 202 + simId
- CT-02 GET COMPLETED com waves
- CT-03 maxWaves=0 → 400
- CT-04 Origin inexistente → 404
- CT-05 extremeFlag >50%
- CT-06 Critical ranking ordenado
- CT-07 Premises persistidas
- CT-08 Sem role → 403

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
