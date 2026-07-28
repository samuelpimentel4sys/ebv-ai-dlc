# PRISMA-EP-04-F03-US-BE-01 — Motor de Estresse sobre Agregados

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · Trino · Arrow · SNS · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (13 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F03-US-BE-01` |
| **Título** | Motor de Estresse sobre Agregados |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F03` — Simulador de Estresse Macroeconômico em Menos de 5 Segundos |
| **US-FE relacionada** | `PRISMA-EP-04-F03-US-FE-01` — Execução de Cenário em Reunião |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | G (13 SP) |
| **Roles** | `ROLE_RISK_DIRECTOR, ROLE_RISK_ANALYST` |

---

## 2. User Story

**Como** sistema  
**Quero** aplicar o cenário macro aos agregados pré-calculados da carteira  
**Para que** a simulação seja rápida o bastante para uso em reunião

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F03` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Concluir em menos de 5 segundos no percentil 95 - Registrar variáveis, premissas e versão dos agregados - Enfileirar e notificar quando o cenário exceder o tempo

**Endpoints cobertos:** `POST /api/v1/portfolio/stress/run`, `GET /api/v1/portfolio/stress/scenarios`, `GET /api/v1/portfolio/stress/{runId}`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `POST` | `/api/v1/portfolio/stress/run` | Estresse macro sobre agregados OLAP | JWT ROLE_RISK_DIRECTOR | G |
| `GET` | `/api/v1/portfolio/stress/scenarios` | Lista cenários PRESET/CUSTOM | JWT | P |
| `GET` | `/api/v1/portfolio/stress/{runId}` | Consulta run (incl. enfileirado) | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/stress/run
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "portfolioId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "variables": {"selic": 15.75, "unemployment": 9.2, "inflation": 6.1, "fxUsdBrl": 5.85},
  "compareBaseline": true
}
```

### Response de sucesso

```json
{
  "runId": "run-55",
  "status": "COMPLETED",
  "elapsedMs": 1840,
  "aggregateVersion": "agg-2026-07-27T18:00:00Z",
  "baselineNpl": 4.20,
  "stressedNpl": 5.85,
  "expectedLossDelta": 13200000.00,
  "queued": false
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
| **CA-01** | Concluir a simulação em menos de 5 segundos |
| **CA-02** | Comparar o resultado com a linha de base vigente |
| **CA-03** | Salvar o cenário executado para a ata do comitê |
| **CA-04** | Concluir em menos de 5 segundos no percentil 95 |
| **CA-05** | Registrar variáveis, premissas e versão dos agregados |
| **CA-06** | Enfileirar e notificar quando o cenário exceder o tempo |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F03`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F03`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: Trino+Arrow · Redis · BACEN/IBGE · SNS · OLAP F05.
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
CREATE TABLE portfolio.tb_stress_scenario (
  scenario_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  variables JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE portfolio.tb_stress_run (
  run_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  scenario_id UUID REFERENCES portfolio.tb_stress_scenario(scenario_id),
  variables_snapshot JSONB NOT NULL,
  aggregate_version VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL,
  elapsed_ms INTEGER,
  baseline_npl NUMERIC(8,4),
  stressed_npl NUMERIC(8,4),
  expected_loss_delta NUMERIC(18,2),
  queued BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Tempo máximo de resposta | Execução de cenário de estresse | Concluir em menos de 5 segundos usando agregados pré-calculados | Cenário que exceda o tempo é enfileirado e o resultado notificado ao analista | — |
| **RN002** | Rastreabilidade do cenário | Conclusão de execução de estresse | Registrar variáveis, premissas, versão dos agregados e autor | Cenário sem registro completo não pode ser levado ao comitê de risco | — |
| **RN003** | Timeout reunião | p95 > 5000 ms | enfileira + SNS | QUEUED | HTTP 202 |
| **RN004** | Rastreabilidade | run sem versão agregados/autor | bloquear comitê | INCOMPLETE_TRACE | HTTP 422 |
| **RN005** | Frescor | agregados STALE (F05) | recusar run | AGGREGATE_STALE | HTTP 409 |

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

Trino+Arrow · Redis · BACEN/IBGE · SNS · OLAP F05

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 Run < 5s happy path
- CT-02 Timeout → QUEUED + notify
- CT-03 Agregado stale → 409
- CT-04 Variáveis inválidas → 400
- CT-05 GET scenarios
- CT-06 Compare baseline deltas
- CT-07 Persist premises
- CT-08 Auth 401/403

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
