# PRISMA-EP-03-F09-US-BE-01 — Roteamento Econômico de Modelos

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F09-US-BE-01` |
| **Título** | Roteamento Econômico de Modelos |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F09` — Telemetria de Custo de Inferência e Roteamento de Modelos |
| **US-FE relacionada** | `PRISMA-EP-03-F09-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** roteador de inferência GenAI  
**Quero** direcionar cada tarefa à menor classe de modelo que atenda à qualidade  
**Para que** o custo unitário do parecer permanecer na premissa de ROI

---

## 3. Descrição

Policies de routing por complexidade de tarefa; telemetria de custo (tokens/USD); decisões auditáveis. Reprovação no guardrail promove classe superior. Teto de gasto com alerta e hard-stop em 120%.

**Endpoints cobertos:** `GET /api/v1/pj/telemetry/cost`, `POST /api/v1/pj/routing/policy`, `GET /api/v1/pj/routing/decisions`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/pj/telemetry/cost` | GET | Custo de inferência por período | JWT ROLE_OPS_AI|ROLE_FINANCE | M |
| `POST /api/v1/pj/routing/policy` | POST | Cria/atualiza policy de roteamento | JWT ROLE_OPS_AI | M |
| `GET /api/v1/pj/routing/decisions` | GET | Histórico de decisões de rota | JWT ROLE_OPS_AI|ROLE_ANALISTA_PJ | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/pj/telemetry/cost`

```
POST /api/v1/pj/routing/policy
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{
  "name": "pj-default-2026q3",
  "active": true,
  "rules": [
    { "taskType": "SECTION_DRAFT", "minClass": "SMALL", "maxClass": "MEDIUM" },
    { "taskType": "GUARDRAIL_RETRY", "minClass": "MEDIUM", "maxClass": "LARGE" }
  ],
  "budgetUsdMonth": 25000,
  "hardStopPct": 120
}
```

### Response de sucesso

```json
{
  "policyId": "99000000-8800-4700-8600-770000000009",
  "version": 3,
  "active": true
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/telemetry/cost",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    { "field": "campo", "message": "mensagem", "rejectedValue": "valor" }
  ]
}
```

Códigos previstos: **200/201/202/204/206**, **400**, **401**, **403**, **404**, **409**, **412**, **422**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | policy ACTIVE única |
| **CA-02** | segunda ACTIVE → 409 |
| **CA-03** | rota SMALL para SECTION_DRAFT |
| **CA-04** | promote após guardrail FAIL |
| **CA-05** | telemetry/cost agrega USD |
| **CA-06** | >120% sem override → 429 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F09`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F09`.
- Dependências típicas do épico: Bedrock, Textract, pgvector, IdP, bases cadastrais PJ.
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4: authZ → validação → RNs §8.4 → side-effects → auditoria (`X-Correlation-ID`) → DTO/erro.

**Transação:** escritas atômicas; jobs GenAI fora de transação longa de DB.  
**Idempotência:** `X-Idempotency-Key` em POST de efeito colateral.  
**Rate limit:** headers `X-RateLimit-*`.

### 8.2 Request / Response Schemas (DTOs)

Campos tipados, validações explícitas, datas ISO-8601 UTC (`...Z`). Error DTO único (§5).

### 8.3 Modelo de Dados

| Tabela | Descrição | Campos-chave |
| --- | --- | --- |
| `tb_pj_routing_policy` | Policy | id, name, rules_json, active, version |
| `tb_pj_routing_decision` | Decisão | id, task_type, model_chosen, reason, opinion_id, at |
| `tb_pj_inference_cost` | Custo | id, model, input_tokens, output_tokens, usd, at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_routing_policy (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rules_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_pj_routing_decision (
  id UUID PRIMARY KEY,
  task_type VARCHAR(40) NOT NULL,
  model_chosen VARCHAR(80) NOT NULL,
  reason VARCHAR(200) NOT NULL,
  opinion_id UUID,
  promoted BOOLEAN NOT NULL DEFAULT FALSE,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_pj_inference_cost (
  id UUID PRIMARY KEY,
  model VARCHAR(80) NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  usd NUMERIC(12,6) NOT NULL,
  task_type VARCHAR(40),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pj_cost_at ON tb_pj_inference_cost(at);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Roteamento por complexidade | início tarefa | Menor classe que atenda qualidade | Guardrail FAIL → promove classe | HTTP 200 |
| **RN002** | Teto de gasto | consumo acumulado | Alerta ao atingir budget; >120% exige liberação gestor | Sem override → 429 | HTTP 429 |
| **RN003** | Telemetria obrigatória | toda inferência | Registrar model, tokens, usd, task | Falha log não bloqueia (best effort) + métrica | HTTP 200 |
| **RN004** | Policy versionada | POST policy | Uma ACTIVE por escopo | Duas ACTIVE → 409 | HTTP 409 |

**Ordem:** formato → authZ/ownership → existência → RN → integrações/LLM → commit.

### 8.5 Camadas e Estrutura de Código

```
api/ (FastAPI routers)  ou  controller/ (Spring HITL)
service/ domain/
ports/ + adapters/ (Bedrock, Textract, Neptune, S3)
repository/ (SQLAlchemy / Spring Data)
dto/
```

### 8.6 Segurança e Autorizações

| Tema | Definição |
| --- | --- |
| Autenticação | OIDC / JWT Bearer (Keycloak) |
| Autorização | ROLE_OPS_AI · ROLE_FINANCE · ROLE_GESTOR_AI (override 120%) |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| LiteLLM / Bedrock | Gateway | Invocação multi-modelo | Retry |
| Prometheus/Grafana | Observabilidade | Séries de custo | Export |
| F06 Guardrails | Evento | Promote on FAIL | Async |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | policy ACTIVE única | 201 |
| **CT-02** | segunda ACTIVE → 409 | 409 |
| **CT-03** | rota SMALL para SECTION_DRAFT | 200 |
| **CT-04** | promote após guardrail FAIL | 200 |
| **CT-05** | telemetry/cost agrega USD | 200 |
| **CT-06** | >120% sem override → 429 | 429 |
| **CT-07** | decisions paginado | 200 |
| **CT-08** | sem ROLE_OPS_AI → 403 | 403 |

**Meta de cobertura:** > 80% services + contratos HTTP.  
**Stack de teste:** pytest/Testcontainers ou JUnit5 + WireMock/Bedrock stubs.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa
- [x] Códigos HTTP mapeados
- [x] Exemplos sucesso/erro
- [x] Segurança por endpoint
- [x] ≥ 5 cenários de teste

---

## 10. Handoff

| Destino | Uso |
| --- | --- |
| BMM Dev | Implementação FastAPI/Spring |
| BMM DBA | Migrations Flyway/Alembic |
| BMM TEA / GherkinFlow | Automatizar CT-* |
| Escritor Front | Contratos para `PRISMA-EP-03-F09-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F09-US-BE-01_
