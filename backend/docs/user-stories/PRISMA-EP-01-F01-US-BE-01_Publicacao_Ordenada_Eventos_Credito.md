# PRISMA-EP-01-F01-US-BE-01 — Publicação Ordenada de Eventos de Crédito

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F01-US-BE-01` |
| **Título** | Publicação Ordenada de Eventos de Crédito |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F01` — Barramento de Eventos de Crédito & Contrato de Schemas |
| **US-FE relacionada** | `PRISMA-EP-01-F01-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** barramento de eventos de crédito  
**Quero** publicar eventos particionados por titular e validados contra o contrato registrado  
**Para que** todo consumidor de score receber os eventos na ordem correta e com schema compatível

---

## 3. Descrição

Gateway de ingestão Kafka: valida Avro via Schema Registry (BACKWARD), particiona por hash do documento (CPF/CNPJ), desvia inválidos para DLQ. Expõe health de streams e consulta de evento por id.

**Endpoints cobertos:** `POST /api/v1/events/credit`, `GET /api/v1/events/{eventId}`, `GET /api/v1/streams/health`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/events/credit` | POST | Publica evento de crédito canônico | mTLS / API Key produtor | G |
| `GET /api/v1/events/{eventId}` | GET | Consulta metadados do evento | JWT ROLE_PLATFORM | P |
| `GET /api/v1/streams/health` | GET | Saúde tópicos/lag/consumers | JWT ROLE_SRE | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/events/credit`

```
POST /api/v1/events/credit
Headers:
  Authorization: Bearer {producer_token}\nContent-Type: application/json\nX-Idempotency-Key: {uuid}
```

```json
{ "eventType": "NEGATIVACAO", "documento": "12345678901", "occurredAt": "2026-07-27T15:00:00Z",
  "payload": { "credor": "BANCO_X", "valor": 1500.00, "contrato": "C-99881" } }
```

### Response de sucesso

```json
{ "eventId": "11111111-2222-4333-8444-555555555501", "topic": "credit.events.v1",
  "partition": 17, "offset": 982341, "schemaVersion": "Negativacao:3", "status": "ACCEPTED" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/events/credit",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | Publica com schema válido |
| **CA-02** | Sem documento → DLQ 422 |
| **CA-03** | Schema incompatível → 409 |
| **CA-04** | Idempotência mesma key |
| **CA-05** | Mesmo documento mesma partition |
| **CA-06** | GET eventId |

Rastreáveis também via feature `PRISMA-EP-01-F01`.

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
| `tb_event_receipt` | Recibo publicação | event_id, documento_hash, topic, partition, offset, schema_version, received_at |
| `tb_event_dlq` | Dead letter | id, raw_payload, reason, received_at |

```sql
CREATE TABLE tb_event_receipt (
  event_id UUID PRIMARY KEY,
  documento CHAR(14) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  partition_id INT NOT NULL,
  offset_id BIGINT NOT NULL,
  schema_version VARCHAR(40) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_event_receipt_doc ON tb_event_receipt(documento, received_at DESC);

CREATE TABLE tb_event_dlq (
  id UUID PRIMARY KEY,
  raw_payload JSONB NOT NULL,
  reason VARCHAR(200) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Ordenação por titular | POST events | Partition key = hash(documento) | Sem documento → DLQ 422 | HTTP 422 |
| **RN002** | Compatibilidade schema | registro/schema | Só evoluções BACKWARD | Incompatível → 409 bloqueia deploy | HTTP 409 |
| **RN003** | Idempotência | eventId/natural key | Dedup janela configurável | Duplicate → 200 com same eventId | HTTP 200 |
| **RN004** | DLQ obrigatória | validação falha | Persistir raw + motivo | DLQ cheia → 503 | HTTP 503 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_EVENT_PRODUCER · ROLE_PLATFORM · ROLE_SRE

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon MSK / Kafka | Streaming | Tópico credit.events.v1 | ISR/acks=all |
| Schema Registry | Contrato | Avro BACKWARD | Gate CI |
| DLQ topic | Erro | Eventos inválidos | Retry manual |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | Publica com schema válido | 202 |
| **CT-02** | Sem documento → DLQ 422 | 422 |
| **CT-03** | Schema incompatível → 409 | 409 |
| **CT-04** | Idempotência mesma key | 200 |
| **CT-05** | Mesmo documento mesma partition | 202 |
| **CT-06** | GET eventId | 200 |
| **CT-07** | streams/health com lag | 200 |
| **CT-08** | DLQ overflow → 503 | 503 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F01-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F01-US-BE-01_
