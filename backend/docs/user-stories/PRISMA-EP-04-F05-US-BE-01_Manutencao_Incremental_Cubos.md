# PRISMA-EP-04-F05-US-BE-01 — Manutenção Incremental dos Cubos

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Iceberg · Trino · dbt · Airflow · S3 · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (13 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F05-US-BE-01` |
| **Título** | Manutenção Incremental dos Cubos |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F05` — Camada de Agregação OLAP de Carteira |
| **US-FE relacionada** | `PRISMA-EP-04-F05-US-FE-01` — Verificação de Frescor dos Dados |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | G (13 SP) |
| **Roles** | `ROLE_DATA_ENGINEER (write), ROLE_RISK_ANALYST (read)` |

---

## 2. User Story

**Como** sistema  
**Quero** atualizar apenas as partições afetadas a cada carga de dados  
**Para que** a sala de risco responda em segundos sobre dados recentes

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F05` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Reprocessar somente as partições impactadas - Expor a idade de cada cubo pela API de frescor - Agendar reconstrução completa quando o incremental falhar

**Endpoints cobertos:** `GET /api/v1/portfolio/aggregates`, `POST /api/v1/portfolio/aggregates/refresh`, `GET /api/v1/portfolio/aggregates/freshness`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `GET` | `/api/v1/portfolio/aggregates` | Agregados + metadados de frescor | JWT | M |
| `POST` | `/api/v1/portfolio/aggregates/refresh` | Refresh incremental ou FULL | JWT ROLE_DATA_ENGINEER | G |
| `GET` | `/api/v1/portfolio/aggregates/freshness` | Idade vs SLA por cubo | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/aggregates/refresh
Authorization: Bearer {jwt}
Content-Type: application/json

{"cubeName": "exposure_by_sector", "mode": "INCREMENTAL", "partitions": ["2026-07-27"]}
```

### Response de sucesso

```json
{"jobId": "job-88", "status": "RUNNING", "mode": "INCREMENTAL"}
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
| **CA-01** | Exibir a idade do agregado em cada análise |
| **CA-02** | Alertar quando o agregado ultrapassar o limite de frescor |
| **CA-03** | Permitir solicitar reconstrução de um cubo específico |
| **CA-04** | Reprocessar somente as partições impactadas |
| **CA-05** | Expor a idade de cada cubo pela API de frescor |
| **CA-06** | Agendar reconstrução completa quando o incremental falhar |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F05`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F05`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Iceberg+S3 · Trino/dbt · Airflow.
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_DATA_ENGINEER (write), ROLE_RISK_ANALYST (read)`).
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
CREATE TABLE portfolio.tb_olap_cube (
  cube_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  cube_name VARCHAR(80) NOT NULL,
  aggregate_version VARCHAR(64) NOT NULL,
  last_refresh_at TIMESTAMPTZ NOT NULL,
  freshness_sla_min INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  iceberg_snapshot VARCHAR(128) NOT NULL
);
CREATE TABLE portfolio.tb_olap_refresh_job (
  job_id UUID PRIMARY KEY,
  cube_id UUID NOT NULL REFERENCES portfolio.tb_olap_cube(cube_id),
  mode VARCHAR(20) NOT NULL,
  partitions JSONB,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Frescor visível | Exibição de qualquer análise de carteira | Apresentar a idade do agregado que sustenta o número mostrado | Agregado mais velho que o limite exibe aviso de desatualização na tela | — |
| **RN002** | Atualização incremental por partição | Chegada de novos dados de carteira | Reprocessar apenas as partições afetadas | Falha na atualização incremental agenda reconstrução completa do cubo | — |
| **RN003** | Fallback FULL | incremental falha | agenda FULL | — | HTTP 202 |
| **RN004** | STALE | age > SLA | status STALE na API | — | HTTP 200 |
| **RN005** | RBAC write | refresh sem engineer | negar | FORBIDDEN | HTTP 403 |

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
- RBAC: `ROLE_DATA_ENGINEER (write), ROLE_RISK_ANALYST (read)`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

Iceberg+S3 · Trino/dbt · Airflow

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 GET aggregates versão
- CT-02 POST refresh INCREMENTAL 202
- CT-03 Falha → agenda FULL
- CT-04 Freshness breached
- CT-05 Sem ROLE engineer → 403
- CT-06 Job FAILED + error_message
- CT-07 Partições inválidas → 400
- CT-08 Isolamento multi-tenant

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
