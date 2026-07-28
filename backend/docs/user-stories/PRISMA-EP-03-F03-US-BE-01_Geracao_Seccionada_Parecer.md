# PRISMA-EP-03-F03-US-BE-01 — Geração Seccionada do Parecer

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F03-US-BE-01` |
| **Título** | Geração Seccionada do Parecer |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F03` — Gerador de Parecer PJ em Menos de 3 Minutos |
| **US-FE relacionada** | `PRISMA-EP-03-F03-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** gerador de parecer PJ  
**Quero** gerar as seções do parecer com ancoragem factual e dentro do tempo alvo  
**Para que** a mesa PJ multiplicar capacidade sem perder rastreabilidade

---

## 3. Descrição

POST cria job de geração (Bedrock + RAG F02 + ratios F05). Meta < 3 min; estouro devolve parcial com seções READY/PENDING. Cada parágrafo factual carrega citationIds. PATCH permite edição humana pré-HITL.

**Endpoints cobertos:** `POST /api/v1/pj/opinions`, `GET /api/v1/pj/opinions/{opinionId}`, `PATCH /api/v1/pj/opinions/{opinionId}`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/opinions` | POST | Inicia geração de parecer | JWT ROLE_ANALISTA_PJ | G |
| `GET /api/v1/pj/opinions/{opinionId}` | GET | Status/seções do parecer | JWT ROLE_ANALISTA_PJ | M |
| `PATCH /api/v1/pj/opinions/{opinionId}` | PATCH | Edita seções antes do submit | JWT ROLE_ANALISTA_PJ | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/opinions`

```
POST /api/v1/pj/opinions
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{
  "cnpj": "12345678000199",
  "operationAmount": 2500000.00,
  "currency": "BRL",
  "sections": ["RESUMO", "INDICES", "RISCOS", "RECOMENDACAO"]
}
```

### Response de sucesso

```json
{
  "opinionId": "d4444444-e555-4f66-8077-a88888888888",
  "status": "GENERATING",
  "slaMs": 180000,
  "pollUrl": "/api/v1/pj/opinions/d4444444-e555-4f66-8077-a88888888888"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/opinions",
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
| **CA-01** | POST cria GENERATING |
| **CA-02** | completa < 3 min → READY_FOR_REVIEW |
| **CA-03** | timeout entrega parcial 206 |
| **CA-04** | parágrafo sem citação UNVERIFIED |
| **CA-05** | PATCH edita seção DRAFT |
| **CA-06** | PATCH após submit → 409 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F03`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F03`.
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
| `tb_pj_opinion` | Parecer | id, cnpj, status, model_route, started_at, completed_at, elapsed_ms |
| `tb_pj_opinion_section` | Seção | id, opinion_id, code, content_md, status, citation_ids[] |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_opinion (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  status VARCHAR(30) NOT NULL,
  model_route VARCHAR(40),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  elapsed_ms INT,
  created_by UUID NOT NULL
);
CREATE INDEX idx_pj_opinion_cnpj ON tb_pj_opinion(cnpj, status);

CREATE TABLE tb_pj_opinion_section (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES tb_pj_opinion(id),
  code VARCHAR(40) NOT NULL,
  content_md TEXT,
  status VARCHAR(20) NOT NULL,
  citation_ids UUID[] NOT NULL DEFAULT '{}',
  UNIQUE (opinion_id, code)
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Tempo máx. 3 min | POST opinions | Completar ou parcial com aviso | Timeout → 206/partial | HTTP 206 |
| **RN002** | Ancoragem por parágrafo | Geração factual | citationIds obrigatórios | Sem âncora → UNVERIFIED | HTTP 200 |
| **RN003** | Não emite sem HITL | status | DRAFT até F04 approve | Emitir direto → bloqueado F04 | HTTP 409 |
| **RN004** | Guardrail pré-liberação | antes de READY_FOR_REVIEW | Aciona F06 verify | Falha verify → BLOCKED | HTTP 422 |

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
| Autorização | ROLE_ANALISTA_PJ |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon Bedrock | LLM | Geração seccionada | Timeout 180s + parcial |
| F02 RAG | Interno | Grounding | Sync |
| F05 Ratios | Interno | Números do quadro | Sync |
| F06 Guardrails | Interno | Verify pré-liberação | Sync |
| F09 Routing | Interno | Escolha de modelo | Sync |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | POST cria GENERATING | 202 |
| **CT-02** | completa < 3 min → READY_FOR_REVIEW | 200 |
| **CT-03** | timeout entrega parcial 206 | 206 |
| **CT-04** | parágrafo sem citação UNVERIFIED | 200 |
| **CT-05** | PATCH edita seção DRAFT | 200 |
| **CT-06** | PATCH após submit → 409 | 409 |
| **CT-07** | guardrail falha → BLOCKED | 422 |
| **CT-08** | CNPJ sem docs → 412 | 412 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F03-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F03-US-BE-01_
