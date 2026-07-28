# PRISMA-EP-01-F03-US-BE-01 — Recálculo Incremental Disparado por Evento

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F03-US-BE-01` |
| **Título** | Recálculo Incremental Disparado por Evento |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F03` — Motor de Recálculo Incremental de Score por Evento |
| **US-FE relacionada** | `PRISMA-EP-01-F03-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** motor de score vivo  
**Quero** recalcular o score apenas com atributos afetados pelo evento  
**Para que** o score permanecer vivo sem custo de reprocessamento total

---

## 3. Descrição

Consumer Kafka Streams + ONNX: gatilho por materialidade, coalescência 5s (exceto crítico), persiste score atual e histórico. API manual recalculate + GET score/history.

**Endpoints cobertos:** `POST /api/v1/score/recalculate`, `GET /api/v1/score/{documento}`, `GET /api/v1/score/{documento}/history`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/score/recalculate` | POST | Força recálculo do titular | JWT ROLE_PLATFORM|interno | G |
| `GET /api/v1/score/{documento}` | GET | Score atual materializado | JWT ROLE_ANALISTA|API B2B | P |
| `GET /api/v1/score/{documento}/history` | GET | Histórico de scores | JWT ROLE_ANALISTA | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/score/recalculate`

```
POST /api/v1/score/recalculate
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "documento": "12345678901", "reason": "MANUAL", "critical": false }
```

### Response de sucesso

```json
{ "documento": "12345678901", "score": 712.4, "modelVersion": "score-v3.2.1",
  "updatedAt": "2026-07-27T15:00:05Z", "recalcMs": 38 }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/score/recalculate",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | evento material recalcula |
| **CA-02** | não material não muda score |
| **CA-03** | coalescência 5s 1 calc |
| **CA-04** | critical bypass coalescência |
| **CA-05** | GET score atual |
| **CA-06** | history paginado |

Rastreáveis também via feature `PRISMA-EP-01-F03`.

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
| `tb_score_current` | Score vivo | documento PK, score, model_version, updated_at, event_id |
| `tb_score_history` | Histórico | id, documento, score, model_version, reason, at |

```sql
CREATE TABLE tb_score_current (
  documento CHAR(14) PRIMARY KEY,
  score NUMERIC(6,2) NOT NULL,
  model_version VARCHAR(40) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  last_event_id UUID
);

CREATE TABLE tb_score_history (
  id BIGSERIAL PRIMARY KEY,
  documento CHAR(14) NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  model_version VARCHAR(40) NOT NULL,
  reason VARCHAR(80) NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_score_hist_doc ON tb_score_history(documento, at DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Materialidade | evento crédito | Só lista de triggers recalcula | Não material → só feature store | HTTP 200 |
| **RN002** | Coalescência 5s | rajada eventos | Um cálculo consolidado | critical=true ignora janela | HTTP 200 |
| **RN003** | Incremental | recalc | Só features dirty do evento | Fallback full se estado corrompido | HTTP 200 |
| **RN004** | Modelo pinned | inferência | Usar versão ACTIVE do registry F09 | Sem modelo → 503 | HTTP 503 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_PLATFORM · ROLE_ANALISTA · B2B score:read

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Kafka Streams | Consumer | Eventos materiais | KEDA scale |
| ONNX Runtime | Inferência | Modelo score | CPU/GPU |
| F02 Features | Online | Atributos dirty | Redis |
| F09 Registry | Versão | Modelo ACTIVE | Sync |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | evento material recalcula | 200 |
| **CT-02** | não material não muda score | 200 |
| **CT-03** | coalescência 5s 1 calc | 200 |
| **CT-04** | critical bypass coalescência | 200 |
| **CT-05** | GET score atual | 200 |
| **CT-06** | history paginado | 200 |
| **CT-07** | sem modelo ACTIVE → 503 | 503 |
| **CT-08** | documento inválido → 400 | 400 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F03-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F03-US-BE-01_
