# PRISMA-EP-03-F01-US-BE-01 — Extração Estruturada de Demonstrativos

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F01-US-BE-01` |
| **Título** | Extração Estruturada de Demonstrativos |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F01` — Extração Automatizada de Balanços e Demonstrativos |
| **US-FE relacionada** | `PRISMA-EP-03-F01-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** sistema de ingestão documental PJ  
**Quero** converter o documento recebido em dados estruturados com confiança por campo  
**Para que** a análise PJ partir de números conferíveis e rastreáveis à origem

---

## 3. Descrição

Recebe PDF/imagem de balanço/DF via multipart, guarda original imutável em S3, orquestra Textract/OCR+OpenCV e persiste campos estruturados com score de confiança. Campos abaixo do limiar ficam PENDING_REVIEW; PATCH correct registra correção humana sem alterar o original.

**Endpoints cobertos:** `POST /api/v1/pj/documents`, `GET /api/v1/pj/documents/{docId}/extraction`, `PATCH /api/v1/pj/documents/{docId}/correct`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/documents` | POST | Upload + inicia extração assíncrona | JWT ROLE_ANALISTA_PJ | G |
| `GET /api/v1/pj/documents/{docId}/extraction` | GET | Status e campos extraídos com confiança | JWT ROLE_ANALISTA_PJ | M |
| `PATCH /api/v1/pj/documents/{docId}/correct` | PATCH | Corrige campos abaixo do limiar | JWT ROLE_ANALISTA_PJ | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/documents`

```
POST /api/v1/pj/documents
Headers:
  Authorization: Bearer {jwt}\nContent-Type: multipart/form-data
```

(multipart) file=@balanco_2025.pdf; cnpj=12345678000199; fiscalYear=2025

### Response de sucesso

```json
{
  "documentId": "a1111111-b222-4c33-8d44-e55555555555",
  "status": "EXTRACTING",
  "cnpj": "12345678000199",
  "extractionId": "f6666666-a777-4b88-8c99-d00000000000",
  "pollUrl": "/api/v1/pj/documents/a1111111-b222-4c33-8d44-e55555555555/extraction"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/documents",
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
| **CA-01** | Upload PDF inicia EXTRAÇÃO |
| **CA-02** | Campo alta confiança AUTO_ACCEPTED |
| **CA-03** | Campo baixa confiança PENDING_REVIEW |
| **CA-04** | Falha S3 aborta processamento |
| **CA-05** | PATCH correct audita before/after |
| **CA-06** | Cross-CNPJ → 403 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F01`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F01`.
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
| `tb_pj_document` | Documento original | id, cnpj, filename, storage_uri, sha256, status, uploaded_by |
| `tb_pj_extraction` | Resultado extração | id, document_id, engine, status, completed_at |
| `tb_pj_extraction_field` | Campo | id, extraction_id, field_key, value_num, value_text, confidence, review_status |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_document (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_uri TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  status VARCHAR(30) NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pj_doc_cnpj ON tb_pj_document(cnpj);

CREATE TABLE tb_pj_extraction (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES tb_pj_document(id),
  engine VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  threshold NUMERIC(5,4) NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE tb_pj_extraction_field (
  id UUID PRIMARY KEY,
  extraction_id UUID NOT NULL REFERENCES tb_pj_extraction(id),
  field_key VARCHAR(80) NOT NULL,
  value_num NUMERIC(18,4),
  value_text TEXT,
  confidence NUMERIC(5,4) NOT NULL,
  review_status VARCHAR(30) NOT NULL,
  corrected_value_num NUMERIC(18,4),
  corrected_by UUID,
  corrected_at TIMESTAMPTZ
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Limite de confiança | Fim da extração | Aceite automático só se confidence >= threshold | Abaixo → PENDING_REVIEW | HTTP 200 |
| **RN002** | Preservação do original | POST documents | Original imutável em S3 Object Lock antes do parse | Falha guarda → aborta (503) | HTTP 503 |
| **RN003** | Isolation por CNPJ | Qualquer acesso | doc.cnpj no escopo do analista/sessão | IDOR → 403 | HTTP 403 |
| **RN004** | Correção auditável | PATCH correct | Grava before/after + actor; não sobrescreve original | Campo inexistente → 404 | HTTP 404 |

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
| Autorização | ROLE_ANALISTA_PJ · ROLE_SUPERVISOR_PJ |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon Textract | OCR/Tables | Extração de rubricas | Async + SNS callback |
| Amazon S3 Object Lock | Storage | Original imutável | Compliance |
| SQS | Fila | Jobs de extração | At-least-once |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | Upload PDF inicia EXTRAÇÃO | 202 |
| **CT-02** | Campo alta confiança AUTO_ACCEPTED | 200 |
| **CT-03** | Campo baixa confiança PENDING_REVIEW | 200 |
| **CT-04** | Falha S3 aborta processamento | 503 |
| **CT-05** | PATCH correct audita before/after | 200 |
| **CT-06** | Cross-CNPJ → 403 | 403 |
| **CT-07** | MIME inválido → 422 | 422 |
| **CT-08** | GET extraction polling até COMPLETED | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F01-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F01-US-BE-01_
