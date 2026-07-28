# PRISMA-EP-03-F07-US-BE-01 — Ciclo de Vida do Documento Corporativo

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F07-US-BE-01` |
| **Título** | Ciclo de Vida do Documento Corporativo |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F07` — Base Vetorial de Documentos Corporativos |
| **US-FE relacionada** | `PRISMA-EP-03-F07-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** biblioteca documental PJ  
**Quero** controlar ingresso, indexação, acesso e expurgo por cliente  
**Para que** o copiloto operar sobre base governada e com prazo de guarda respeitado

---

## 3. Descrição

CRUD de biblioteca por CNPJ: upload (Tika parse + dispara F02 index), listagem, delete lógico. Acesso só a analistas designados. Job de retenção expurga doc+vetores; litígio marca legal_hold.

**Endpoints cobertos:** `POST /api/v1/pj/library/documents`, `GET /api/v1/pj/library/{cnpj}`, `DELETE /api/v1/pj/library/documents/{docId}`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/library/documents` | POST | Ingressa documento na biblioteca | JWT ROLE_ANALISTA_PJ | M |
| `GET /api/v1/pj/library/{cnpj}` | GET | Lista docs do CNPJ | JWT ROLE_ANALISTA_PJ | P |
| `DELETE /api/v1/pj/library/documents/{docId}` | DELETE | Expurga (se sem legal hold) | JWT ROLE_ANALISTA_PJ|ROLE_DATA_STEWARD | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/library/documents`

```
POST /api/v1/pj/library/documents
Headers:
  Authorization: Bearer {jwt}\nContent-Type: multipart/form-data
```

(multipart) file=@estatuto.pdf; cnpj=12345678000199; docType=CONTRATO; retentionYears=5

### Response de sucesso

```json
{
  "documentId": "11000000-2200-4300-8400-550000000007",
  "status": "INDEXING",
  "retentionUntil": "2031-07-27",
  "legalHold": false
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/library/documents",
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
| **CA-01** | upload + INDEXING |
| **CA-02** | list só ACL |
| **CA-03** | sem ACL → 403 |
| **CA-04** | DELETE com legal_hold → 409 |
| **CA-05** | DELETE remove chunks F02 |
| **CA-06** | docType inválido → 422 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F07`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F07`.
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
| `tb_pj_library_document` | Biblioteca | id, cnpj, doc_type, storage_uri, retention_until, legal_hold, status |
| `tb_pj_library_acl` | ACL | cnpj, user_id, role |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_library_document (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  doc_type VARCHAR(40) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  storage_uri TEXT NOT NULL,
  retention_until DATE NOT NULL,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pj_lib_cnpj ON tb_pj_library_document(cnpj);

CREATE TABLE tb_pj_library_acl (
  cnpj CHAR(14) NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(40) NOT NULL,
  PRIMARY KEY (cnpj, user_id)
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Acesso restrito | GET/POST/DELETE | Só time designado ao CNPJ | Negado + audit 403 | HTTP 403 |
| **RN002** | Expurgo por retenção | Job/DELETE | Remove doc + vetores F02 | legal_hold → 409 | HTTP 409 |
| **RN003** | Indexação acoplada | POST library | Após store, enfileira rag/index | Falha index → status INDEX_FAILED | HTTP 202 |
| **RN004** | Classificação documental | POST | docType obrigatório (BALANCO, CONTRATO, ...) | Tipo inválido → 422 | HTTP 422 |

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
| Autorização | ROLE_ANALISTA_PJ (ACL) · ROLE_DATA_STEWARD |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Apache Tika | Parse | Metadados/texto | Timeout |
| S3 | Storage | Objeto + lifecycle | KMS |
| F02 rag/index | Interno | Vetorização | SQS |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | upload + INDEXING | 202 |
| **CT-02** | list só ACL | 200 |
| **CT-03** | sem ACL → 403 | 403 |
| **CT-04** | DELETE com legal_hold → 409 | 409 |
| **CT-05** | DELETE remove chunks F02 | 204 |
| **CT-06** | docType inválido → 422 | 422 |
| **CT-07** | job retenção expurga vencidos | 200 |
| **CT-08** | INDEX_FAILED visível no GET | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F07-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F07-US-BE-01_
