# PRISMA-EP-01-F05-US-BE-01 — Decisão de Crédito Síncrona (p95 < 250 ms)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F05-US-BE-01` |
| **Título** | Decisão de Crédito Síncrona (p95 < 250 ms) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F05` — API de Decisão Síncrona com Orçamento de Latência p95 < 250 ms |
| **US-FE relacionada** | `PRISMA-EP-01-F05-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** API de decisão B2B  
**Quero** orquestrar feature store, inferência, explicabilidade e snapshot no orçamento de latência  
**Para que** o cliente B2B receber a decisão em menos de 250 ms (p95)

---

## 3. Descrição

POST /decisions WebFlux: budget por etapa, degradação (omite etapa não crítica / score contingência). Emite decision_id, chama F02/F03/F04/EP-02 XAI conforme fatias. GET budget expõe consumo atual.

**Endpoints cobertos:** `POST /api/v1/decisions`, `GET /api/v1/decisions/{decisionId}`, `GET /api/v1/decisions/budget`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/decisions` | POST | Decide crédito síncrono | OAuth2 client credentials B2B | G |
| `GET /api/v1/decisions/{decisionId}` | GET | Consulta decisão | OAuth2 / JWT | P |
| `GET /api/v1/decisions/budget` | GET | Orçamento latência atual | JWT ROLE_SRE|B2B | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/decisions`

```
POST /api/v1/decisions
Headers:
  Authorization: Bearer {client_token}\nContent-Type: application/json\nX-Budget-Ms: 250
```

```json
{ "documento": "12345678901", "productCode": "SCORE_VIVO", "includeExplanation": true }
```

### Response de sucesso

```json
{ "decisionId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee05", "score": 712.4, "outcome": "APPROVE",
  "modelVersion": "score-v3.2.1", "latencyMs": 187, "partial": false,
  "degradedFlags": [], "explanationRef": "/api/v1/xai/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee05" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/decisions",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | happy path <250ms |
| **CA-02** | etapa não crítica omitida partial |
| **CA-03** | FS down usa contingência |
| **CA-04** | sem snapshot → 503 |
| **CA-05** | WORM fail → 503 |
| **CA-06** | GET decision |

Rastreáveis também via feature `PRISMA-EP-01-F05`.

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
| `tb_decision` | Reuso F04 | decision_id, latency_ms, degraded_flags, client_id |

```sql
ALTER TABLE tb_decision
  ADD COLUMN IF NOT EXISTS latency_ms INT,
  ADD COLUMN IF NOT EXISTS degraded_flags TEXT[],
  ADD COLUMN IF NOT EXISTS client_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS partial BOOLEAN NOT NULL DEFAULT FALSE;
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Budget distribuído | POST decisions | Fatias por etapa; aborta estouro | Não crítica omitida → partial | HTTP 200 |
| **RN002** | Degradação | FS offline | Score contingência do último snapshot | Sem snapshot → 503 | HTTP 503 |
| **RN003** | WORM obrigatório | antes response | F04 snapshot ok | Falha → 503 | HTTP 503 |
| **RN004** | SLO p95 250ms | métrica | Medido F08; alerta se violar | N/A HTTP | HTTP 200 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** OAuth2 client B2B · scopes decision:write

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| F02 Features | gRPC | PIT online | timeout fatia |
| F03/ONNX | Inferência | Score | timeout fatia |
| F04 Snapshot | WORM | Prova | fail-closed |
| EP-02 XAI | Opcional | Explicabilidade | omite se budget |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | happy path <250ms | 200 |
| **CT-02** | etapa não crítica omitida partial | 200 |
| **CT-03** | FS down usa contingência | 200 |
| **CT-04** | sem snapshot → 503 | 503 |
| **CT-05** | WORM fail → 503 | 503 |
| **CT-06** | GET decision | 200 |
| **CT-07** | budget endpoint | 200 |
| **CT-08** | auth inválida → 401 | 401 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F05-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F05-US-BE-01_
