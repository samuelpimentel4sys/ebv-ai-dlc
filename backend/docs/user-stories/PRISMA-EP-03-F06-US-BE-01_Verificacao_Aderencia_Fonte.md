# PRISMA-EP-03-F06-US-BE-01 — Verificação Automática de Aderência à Fonte

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F06-US-BE-01` |
| **Título** | Verificação Automática de Aderência à Fonte |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F06` — Guardrails de Alucinação e Verificação de Citação |
| **US-FE relacionada** | `PRISMA-EP-03-F06-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** guardrail de grounding  
**Quero** confrontar cada afirmação factual com o trecho citado antes da liberação  
**Para que** o parecer não carregar afirmação inventada pelo modelo

---

## 3. Descrição

Verificador de entailment + checagem literal de números vs citação. Número sem lastro remove/reprova parágrafo. Cobertura 100% das claims factuais; falha do verificador bloqueia liberação.

**Endpoints cobertos:** `POST /api/v1/pj/guardrails/verify`, `GET /api/v1/pj/guardrails/report/{opinionId}`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/guardrails/verify` | POST | Verifica parecer/seções | JWT ROLE_ANALISTA_PJ|serviço F03 | G |
| `GET /api/v1/pj/guardrails/report/{opinionId}` | GET | Relatório de verificação | JWT ROLE_ANALISTA_PJ | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/guardrails/verify`

```
POST /api/v1/pj/guardrails/verify
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "opinionId": "d4444444-e555-4f66-8077-a88888888888" }
```

### Response de sucesso

```json
{
  "reportId": "ff000001-aa02-4bb3-8cc4-dd0000000006",
  "opinionId": "d4444444-e555-4f66-8077-a88888888888",
  "status": "FAILED",
  "findings": [
    {
      "sectionCode": "INDICES",
      "claim": "Margem líquida de 7,8% em 2025",
      "result": "REJECTED",
      "reason": "Número 7,8% não encontrado no trecho citado (fonte traz 5,1%)"
    }
  ]
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/guardrails/verify",
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
| **CA-01** | claims ok → PASSED |
| **CA-02** | número sem lastro → FAILED |
| **CA-03** | FAILED bloqueia liberação 422 no F03 |
| **CA-04** | verificador down → 503 |
| **CA-05** | report histórico versionado |
| **CA-06** | opinion inexistente → 404 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F06`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F06`.
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
| `tb_pj_guardrail_report` | Report | id, opinion_id, status, model, created_at |
| `tb_pj_guardrail_finding` | Finding | id, report_id, section_code, claim, result, reason |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_guardrail_report (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES tb_pj_opinion(id),
  status VARCHAR(20) NOT NULL,
  model VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_pj_guardrail_finding (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES tb_pj_guardrail_report(id),
  section_code VARCHAR(40) NOT NULL,
  claim TEXT NOT NULL,
  citation_id UUID,
  result VARCHAR(20) NOT NULL,
  reason TEXT
);
CREATE INDEX idx_guard_report_opinion ON tb_pj_guardrail_report(opinion_id, created_at DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Número com lastro | claim numérica | Número deve constar no trecho citado | Sem lastro → REJECTED | HTTP 200 |
| **RN002** | Cobertura integral | verify | Todas claims factuais verificadas | Verificador down → bloqueia + 503 | HTTP 503 |
| **RN003** | Liberação condicional | resultado | Só PASSED libera READY_FOR_REVIEW | FAILED → BLOCKED | HTTP 422 |
| **RN004** | Idempotência | re-verify | Novo report versionado; mantém histórico | N/A | HTTP 200 |

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
| Autorização | ROLE_ANALISTA_PJ · service F03 |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Modelo entailment (Bedrock) | LLM | Aderência claim↔chunk | Timeout 10s |
| F02 Citations | Interno | Trechos citados | Sync |
| F03 Opinions | Interno | Atualiza status BLOCKED/PASSED | Transacional |
| F09 Routing | Interno | Promote modelo se FAILED | Evento |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | claims ok → PASSED | 200 |
| **CT-02** | número sem lastro → FAILED | 200 |
| **CT-03** | FAILED bloqueia liberação 422 no F03 | 422 |
| **CT-04** | verificador down → 503 | 503 |
| **CT-05** | report histórico versionado | 200 |
| **CT-06** | opinion inexistente → 404 | 404 |
| **CT-07** | cobertura 100% claims | 200 |
| **CT-08** | sem auth → 401 | 401 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F06-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F06-US-BE-01_
