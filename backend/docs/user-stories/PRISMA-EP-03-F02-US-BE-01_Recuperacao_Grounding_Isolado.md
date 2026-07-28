# PRISMA-EP-03-F02-US-BE-01 — Recuperação com Grounding Isolado por Cliente

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F02-US-BE-01` |
| **Título** | Recuperação com Grounding Isolado por Cliente |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F02` — Pipeline RAG com Grounding Auditável |
| **US-FE relacionada** | `PRISMA-EP-03-F02-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** pipeline RAG do copiloto PJ  
**Quero** recuperar trechos exclusivamente do índice do CNPJ em análise, com citação  
**Para que** o copiloto nunca misturar informação de clientes diferentes

---

## 3. Descrição

API RAG: indexa chunks (POST index), consulta com filtro obrigatório de CNPJ (POST query) e expõe citações (documento, página, offsets) por answerId. Trechos sem origem rastreável são descartados.

**Endpoints cobertos:** `POST /api/v1/pj/rag/index`, `POST /api/v1/pj/rag/query`, `GET /api/v1/pj/rag/citations/{answerId}`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/rag/index` | POST | Indexa documento no índice do CNPJ | JWT ROLE_ANALISTA_PJ|serviço interno | G |
| `POST /api/v1/pj/rag/query` | POST | Recupera trechos com grounding | JWT ROLE_ANALISTA_PJ | G |
| `GET /api/v1/pj/rag/citations/{answerId}` | GET | Lista citações da resposta | JWT ROLE_ANALISTA_PJ | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/rag/index`

```
POST /api/v1/pj/rag/query
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{
  "cnpj": "12345678000199",
  "query": "Qual a evolução da margem líquida nos últimos 3 exercícios?",
  "topK": 8
}
```

### Response de sucesso

```json
{
  "answerId": "b2222222-c333-4d44-8e55-f66666666666",
  "cnpj": "12345678000199",
  "chunks": [
    {
      "chunkId": "c3333333-d444-4e55-8f66-a77777777777",
      "documentId": "a1111111-b222-4c33-8d44-e55555555555",
      "page": 12,
      "start": 1040,
      "end": 1388,
      "score": 0.8712,
      "excerpt": "A margem líquida passou de 4,2% em 2023 para 5,1% em 2025..."
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
  "path": "/api/v1/pj/rag/index",
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
| **CA-01** | query com CNPJ retorna citações |
| **CA-02** | query sem CNPJ → 400 |
| **CA-03** | chunk de outro CNPJ nunca retorna |
| **CA-04** | chunk sem offsets descartado |
| **CA-05** | index versão divergente → 409 |
| **CA-06** | citations por answerId |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F02`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F02`.
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
| `tb_pj_rag_chunk` | Chunk vetorial | id, cnpj, document_id, page, start_offset, end_offset, content, embedding vector |
| `tb_pj_rag_answer` | Resposta/consulta | id, cnpj, query_text, model, created_at |
| `tb_pj_rag_citation` | Citação | id, answer_id, chunk_id, score |

#### DDL (PostgreSQL 16)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE tb_pj_rag_chunk (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  document_id UUID NOT NULL,
  page INT NOT NULL,
  start_offset INT NOT NULL,
  end_offset INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  index_version VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rag_chunk_cnpj ON tb_pj_rag_chunk(cnpj);
CREATE INDEX idx_rag_chunk_embedding ON tb_pj_rag_chunk USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE tb_pj_rag_answer (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  query_text TEXT NOT NULL,
  model VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_pj_rag_citation (
  id UUID PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES tb_pj_rag_answer(id),
  chunk_id UUID NOT NULL REFERENCES tb_pj_rag_chunk(id),
  score NUMERIC(8,6) NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Isolamento por cliente | query/index | Filtro cnpj obrigatório no retrieval | Sem CNPJ → 400 | HTTP 400 |
| **RN002** | Citação obrigatória | query response | Cada chunk: docId, page, start, end | Sem origem → descartado | HTTP 200 |
| **RN003** | Tenant/CNPJ ownership | acesso | Analista só consulta CNPJs da carteira | 403 | HTTP 403 |
| **RN004** | Versionamento de índice | index | embeddingModel + indexVersion gravados | Modelo divergente → 409 | HTTP 409 |

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
| Autorização | ROLE_ANALISTA_PJ · service account copiloto |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon Bedrock Embeddings | LLM | Vetorização | Timeout 3s |
| pgvector | DB | Similarity search filtrada por CNPJ | IVFFlat |
| Redis | Cache | Queries quentes por CNPJ | TTL 5 min |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | query com CNPJ retorna citações | 200 |
| **CT-02** | query sem CNPJ → 400 | 400 |
| **CT-03** | chunk de outro CNPJ nunca retorna | 200 |
| **CT-04** | chunk sem offsets descartado | 200 |
| **CT-05** | index versão divergente → 409 | 409 |
| **CT-06** | citations por answerId | 200 |
| **CT-07** | CNPJ fora da carteira → 403 | 403 |
| **CT-08** | topK > 50 → 400 | 400 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F02-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F02-US-BE-01_
