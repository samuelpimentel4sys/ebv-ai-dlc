# PRISMA-EP-01-F06-US-BE-01 — Ingestão Normalizada Multi-Fonte (Open Finance / Cad. Positivo)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F06-US-BE-01` |
| **Título** | Ingestão Normalizada Multi-Fonte (Open Finance / Cad. Positivo) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F06` — Ingestão de Open Finance e Cadastro Positivo |
| **US-FE relacionada** | `PRISMA-EP-01-F06-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** conectores de ingestão  
**Quero** traduzir registros de cada fonte para o contrato canônico do barramento  
**Para que** o motor de score consumir um único formato independentemente da origem

---

## 3. Descrição

Callbacks Open Finance (FAPI/OAuth), conectores Cadastro Positivo, normalização → POST F01 events. Consentimento vigente obrigatório; dedup por chave natural; replay controlado.

**Endpoints cobertos:** `POST /api/v1/ingest/openfinance/callback`, `GET /api/v1/ingest/sources`, `POST /api/v1/ingest/replay`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/ingest/openfinance/callback` | POST | Callback dados OF | OAuth2 FAPI + mTLS | G |
| `GET /api/v1/ingest/sources` | GET | Status conectores | JWT ROLE_DATA_ENG | P |
| `POST /api/v1/ingest/replay` | POST | Reprocessa lote fonte | JWT ROLE_DATA_ENG | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/ingest/openfinance/callback`

```
POST /api/v1/ingest/openfinance/callback
Headers:
  Content-Type: application/json\nX-Idempotency-Key: {uuid}
```

```json
{ "consentId": "urn:consent:99", "documento": "12345678901", "resources": ["accounts", "credit-cards"] }
```

### Response de sucesso

```json
{ "accepted": true, "eventsPublished": 3, "deduplicated": 1, "status": "NORMALIZED" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/ingest/openfinance/callback",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | callback com consentimento |
| **CA-02** | consentimento expirado → 403 |
| **CA-03** | dedup descarta igual |
| **CA-04** | divergente → conciliação |
| **CA-05** | sources health |
| **CA-06** | replay sem approval → 403 |

Rastreáveis também via feature `PRISMA-EP-01-F06`.

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
| `tb_ingest_source` | Conector | code, type, status, last_success_at |
| `tb_ingest_dedup` | Dedup | source, natural_key, event_ts, payload_hash |
| `tb_consent_cache` | Consentimento | documento, purpose, expires_at, status |

```sql
CREATE TABLE tb_ingest_source (
  code VARCHAR(40) PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  last_success_at TIMESTAMPTZ
);

CREATE TABLE tb_ingest_dedup (
  source VARCHAR(40) NOT NULL,
  natural_key VARCHAR(200) NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  PRIMARY KEY (source, natural_key, event_ts)
);

CREATE TABLE tb_consent_cache (
  documento CHAR(14) NOT NULL,
  purpose VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (documento, purpose)
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Consentimento vigente | coleta OF | Só com consentimento ativo/finalidade | Expirado → para + renovação | HTTP 403 |
| **RN002** | Dedup chave natural | Cad. Positivo | Descarta mesmo key+ts | Divergente → conciliação | HTTP 200 |
| **RN003** | Canonical map | qualquer fonte | Emite schema F01 | Map fail → DLQ | HTTP 422 |
| **RN004** | Replay isolado | POST replay | Não bypassa consentimento | Sem approval → 403 | HTTP 403 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** connector service · ROLE_DATA_ENG

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Open Finance APIs | FAPI | Dados consentidos | OAuth+mTLS |
| Cadastro Positivo | Batch/API | Histórico positivo | NiFi |
| F01 Events | Barramento | Contrato canônico | Kafka |
| EventBridge/Lambda | Orquestração | Callbacks | Retry |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | callback com consentimento | 202 |
| **CT-02** | consentimento expirado → 403 | 403 |
| **CT-03** | dedup descarta igual | 200 |
| **CT-04** | divergente → conciliação | 200 |
| **CT-05** | sources health | 200 |
| **CT-06** | replay sem approval → 403 | 403 |
| **CT-07** | map fail → 422 DLQ | 422 |
| **CT-08** | publica eventos F01 | 202 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F06-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F06-US-BE-01_
