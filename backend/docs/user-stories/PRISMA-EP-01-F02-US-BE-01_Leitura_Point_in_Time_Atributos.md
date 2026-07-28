# PRISMA-EP-01-F02-US-BE-01 — Leitura Point-in-Time de Atributos

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F02-US-BE-01` |
| **Título** | Leitura Point-in-Time de Atributos |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F02` — Feature Store Point-in-Time com Consistência Temporal |
| **US-FE relacionada** | `PRISMA-EP-01-F02-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** feature store online/offline  
**Quero** recuperar atributos de um titular com corte temporal exato  
**Para que** a decisão ser reproduzível e auditável no futuro

---

## 3. Descrição

API Feast-like: GET features com asOf obrigatório (senão now+flag), batch point-in-time, catálogo com SLO de frescor. Atributo stale → degradado com flag.

**Endpoints cobertos:** `GET /api/v1/features/{documento}`, `POST /api/v1/features/batch`, `GET /api/v1/features/catalog`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/features/{documento}` | GET | Features PIT do titular | JWT / mTLS decisão | G |
| `POST /api/v1/features/batch` | POST | Batch PIT para treino/replay | JWT ROLE_ML | G |
| `GET /api/v1/features/catalog` | GET | Catálogo de atributos | JWT ROLE_ANALISTA_RISCO | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/features/{documento}`

```
GET /api/v1/features/12345678901?asOf=2026-07-27T15:00:00Z&names=divida_aberta,qtd_negativacoes_12m
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{ "documento": "12345678901", "asOf": "2026-07-27T15:00:00Z",
  "features": {
    "divida_aberta": { "value": 4200.50, "eventTs": "2026-07-26T10:00:00Z", "degraded": false },
    "qtd_negativacoes_12m": { "value": 2, "eventTs": "2026-07-20T08:00:00Z", "degraded": true, "maxAgeSeconds": 86400 }
  } }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/features/{documento}",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | PIT com asOf |
| **CA-02** | sem asOf marca liveRead |
| **CA-03** | feature stale degraded |
| **CA-04** | leakage futuro batch → 422 |
| **CA-05** | identidade ambígua → 409 |
| **CA-06** | catalog lista ativos |

Rastreáveis também via feature `PRISMA-EP-01-F02`.

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
| `tb_feature_catalog` | Catálogo | name, entity, value_type, max_age_seconds, owner |
| `tb_feature_online` | Online (Redis mirror meta) | documento, feature_name, value_json, event_ts, written_at |

```sql
CREATE TABLE tb_feature_catalog (
  name VARCHAR(120) PRIMARY KEY,
  entity VARCHAR(40) NOT NULL,
  value_type VARCHAR(40) NOT NULL,
  max_age_seconds INT NOT NULL,
  owner VARCHAR(80) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tb_feature_online_audit (
  id BIGSERIAL PRIMARY KEY,
  documento CHAR(14) NOT NULL,
  feature_name VARCHAR(120) NOT NULL,
  event_ts TIMESTAMPTZ NOT NULL,
  written_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feat_online_doc ON tb_feature_online_audit(documento, feature_name, event_ts DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Corte temporal | GET/POST features | Só valores válidos em asOf | Sem asOf → now + flag liveRead | HTTP 200 |
| **RN002** | Frescor mínimo | leitura online | stale se > maxAge catálogo | Servido com degraded=true | HTTP 200 |
| **RN003** | Sem leakage futuro | batch PIT | Proibir feature com event_ts > asOf | Violação → 422 | HTTP 422 |
| **RN004** | Entity key canônica | documento | Resolver via Golden Record F07 | Identidade ambígua → 409 | HTTP 409 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** service decision · ROLE_ML · ROLE_ANALISTA_RISCO

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Feast + Redis | Online | Serving baixa latência | p99 < 20ms |
| Iceberg/S3 | Offline | Batch PIT | Spark |
| F07 Identity | Interno | Resolve documento | Sync |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | PIT com asOf | 200 |
| **CT-02** | sem asOf marca liveRead | 200 |
| **CT-03** | feature stale degraded | 200 |
| **CT-04** | leakage futuro batch → 422 | 422 |
| **CT-05** | identidade ambígua → 409 | 409 |
| **CT-06** | catalog lista ativos | 200 |
| **CT-07** | feature inexistente → 404 | 404 |
| **CT-08** | batch 1k entidades | 200 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F02-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F02-US-BE-01_
