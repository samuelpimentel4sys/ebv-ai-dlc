# PRISMA-EP-01-F08-US-BE-01 — Coleta e Agregação de Telemetria de Decisão (SLO)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F08-US-BE-01` |
| **Título** | Coleta e Agregação de Telemetria de Decisão (SLO) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F08` — Observabilidade de Latência e SLO de Decisão |
| **US-FE relacionada** | `PRISMA-EP-01-F08-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** plataforma de observabilidade  
**Quero** coletar métricas e trilhas correlacionadas por decision_id  
**Para que** a latência prometida ser verificável e auditável por cliente

---

## 3. Descrição

APIs sobre OTel/Prometheus: SLO atual, trace por decision_id, budget de erro. Correlação obrigatória; queima rápida de error budget escala alerta e pode freeze deploys.

**Endpoints cobertos:** `GET /api/v1/observability/slo`, `GET /api/v1/observability/traces/{decisionId}`, `GET /api/v1/observability/budget`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/observability/slo` | GET | SLO p95/p99 e compliance | JWT ROLE_SRE|B2B | M |
| `GET /api/v1/observability/traces/{decisionId}` | GET | Trace correlacionado | JWT ROLE_SRE | M |
| `GET /api/v1/observability/budget` | GET | Error budget restante | JWT ROLE_SRE | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/observability/slo`

```
GET /api/v1/observability/slo?window=1h&clientId=fintech_x
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{ "window": "1h", "clientId": "fintech_x", "targetP95Ms": 250, "p95Ms": 198.4, "p99Ms": 312.0,
  "compliance": true, "errorBudgetRemainingPct": 72.5 }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/observability/slo",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | slo compliance true |
| **CA-02** | trace por decisionId |
| **CA-03** | trace expirado → 404 |
| **CA-04** | cross-tenant → 403 |
| **CA-05** | budget restante |
| **CA-06** | alerta queima >50% |

Rastreáveis também via feature `PRISMA-EP-01-F08`.

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
| `tb_slo_snapshot` | Snapshot SLO | at, client_id, p95_ms, p99_ms, error_rate, budget_remaining_pct |

```sql
CREATE TABLE tb_slo_snapshot (
  id BIGSERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL,
  client_id VARCHAR(64),
  p95_ms NUMERIC(10,2) NOT NULL,
  p99_ms NUMERIC(10,2) NOT NULL,
  error_rate NUMERIC(8,6) NOT NULL,
  budget_remaining_pct NUMERIC(5,2) NOT NULL
);
CREATE INDEX idx_slo_at ON tb_slo_snapshot(at DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Correlação obrigatória | decisão | Propagar decision_id | Sem correlação → alerta instrumentação | HTTP 200 |
| **RN002** | Queima error budget | consumo SLO | Escala alerta por velocidade | >50%/24h freeze deploys | HTTP 200 |
| **RN003** | Multi-tenant view | GET slo | Filtro por client_id | Cross-tenant → 403 | HTTP 403 |
| **RN004** | Retenção traces | storage | Hot 7d / cold 90d | Expirado → 404 | HTTP 404 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_SRE · B2B observability:read

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| OpenTelemetry | Traces | Spans decisão | OTel Collector |
| AMP/Grafana | Metrics | SLO dashboards | PromQL |
| Alertmanager | Alertas | Queima budget | Pager |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | slo compliance true | 200 |
| **CT-02** | trace por decisionId | 200 |
| **CT-03** | trace expirado → 404 | 404 |
| **CT-04** | cross-tenant → 403 | 403 |
| **CT-05** | budget restante | 200 |
| **CT-06** | alerta queima >50% | 200 |
| **CT-07** | sem decision_id instrumentação | 200 |
| **CT-08** | auth → 401 | 401 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F08-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F08-US-BE-01_
