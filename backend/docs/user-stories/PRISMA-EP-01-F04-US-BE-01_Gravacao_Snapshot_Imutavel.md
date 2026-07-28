# PRISMA-EP-01-F04-US-BE-01 — Gravação de Snapshot Imutável (decision_id WORM)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F04-US-BE-01` |
| **Título** | Gravação de Snapshot Imutável (decision_id WORM) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F04` — Snapshot Imutável por decision_id (WORM) |
| **US-FE relacionada** | `PRISMA-EP-01-F04-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** serviço de prova de decisão  
**Quero** persistir entradas, versões e resultado em storage com object lock  
**Para que** toda decisão ser reproduzível e à prova de adulteração

---

## 3. Descrição

Antes de responder decisão: grava snapshot WORM (S3 Object Lock) + metadados Dynamo/Postgres, encadeia SHA-256 com decisão anterior do titular. verify recalcula hash. Falha WORM aborta decisão.

**Endpoints cobertos:** `GET /api/v1/decisions/{decisionId}`, `GET /api/v1/decisions/{decisionId}/snapshot`, `POST /api/v1/decisions/{decisionId}/verify`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/decisions/{decisionId}` | GET | Metadados da decisão | JWT ROLE_COMPLIANCE|B2B | P |
| `GET /api/v1/decisions/{decisionId}/snapshot` | GET | Payload imutável completo | JWT ROLE_COMPLIANCE | M |
| `POST /api/v1/decisions/{decisionId}/verify` | POST | Verifica integridade/cadeia | JWT ROLE_COMPLIANCE | M |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/decisions/{decisionId}`

```
POST /api/v1/decisions/{decisionId}/verify
Headers:
  Authorization: Bearer {jwt}
```

```json
{ "checkChain": true }
```

### Response de sucesso

```json
{ "decisionId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee04", "integrity": "VALID",
  "chainValid": true, "sha256": "e3b0c44298fc1c149afbf4c8996fb924...", "lockedUntil": "2031-07-27" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/decisions/{decisionId}",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | snapshot WORM gravado |
| **CA-02** | falha S3 aborta decisão |
| **CA-03** | verify VALID |
| **CA-04** | quebra cadeia → 409 |
| **CA-05** | GET snapshot |
| **CA-06** | sem update in-place 405 |

Rastreáveis também via feature `PRISMA-EP-01-F04`.

---

## 7. Dependências e Observações

- Épico `PRISMA-EP-01` (fundação do fio único Release 1).
- Dependências cruzadas típicas: F01↔F06, F02↔F03↔F05, F04↔F05, F09↔F03, F08↔F05, F10 isolado.
- Fora de escopo: Out of Scope da feature Explorer.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints
AuthZ → validação → RNs → side-effects (Kafka/WORM/ONNX) → auditoria `X-Correlation-ID` / `decision_id`.

### 8.2 DTOs
Tipados; datas ISO-8601 UTC; Error DTO único (§5).

### 8.3 Modelo de Dados

| Tabela | Descrição | Campos-chave |
| --- | --- | --- |
| `tb_decision` | Decisão | decision_id PK, documento, score, model_version, sha256, prev_sha256, storage_uri |

```sql
CREATE TABLE tb_decision (
  decision_id UUID PRIMARY KEY,
  documento CHAR(14) NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  model_version VARCHAR(40) NOT NULL,
  outcome VARCHAR(40),
  sha256 CHAR(64) NOT NULL,
  prev_sha256 CHAR(64),
  storage_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_decision_doc ON tb_decision(documento, created_at DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Imutabilidade | emissão decisão | WORM antes da response | Falha → aborta 503 | HTTP 503 |
| **RN002** | Cadeia SHA-256 | novo snapshot | prevHash do titular | Quebra → alerta + bloqueia writes | HTTP 409 |
| **RN003** | Retenção legal | Object Lock | Retention mode COMPLIANCE | Delete antecipado impossível | HTTP 200 |
| **RN004** | Sem update in-place | qualquer | Só append nova decisão | PUT/PATCH snapshot → 405 | HTTP 405 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_COMPLIANCE · B2B decision:read · service F05

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| S3 Object Lock | WORM | Snapshot JSON | Compliance |
| DynamoDB/Postgres | Meta | Índice decision_id | HA |
| F05 Decisions | Caller | Grava antes do return | Sync fail-closed |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | snapshot WORM gravado | 200 |
| **CT-02** | falha S3 aborta decisão | 503 |
| **CT-03** | verify VALID | 200 |
| **CT-04** | quebra cadeia → 409 | 409 |
| **CT-05** | GET snapshot | 200 |
| **CT-06** | sem update in-place 405 | 405 |
| **CT-07** | decision inexistente 404 | 404 |
| **CT-08** | encadeamento prevHash | 200 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F04-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F04-US-BE-01_
