# PRISMA-EP-01-F10-US-BE-01 — Reprocessamento Isolado de Janela Histórica (Replay)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F10-US-BE-01` |
| **Título** | Reprocessamento Isolado de Janela Histórica (Replay) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F10` — Replay de Eventos e Backfill Histórico Auditável |
| **US-FE relacionada** | `PRISMA-EP-01-F10-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** serviço de replay/backfill  
**Quero** reprocessar eventos de uma janela em ambiente isolado com trilha de aprovação  
**Para que** ser possível reconstruir e auditar decisões históricas sem contaminar produção

---

## 3. Descrição

Jobs Airflow/Spark: cria replay isolado (não publica no barramento prod), exige justificativa+aprovador, status/abort. Saída em tópicos/sandbox Iceberg.

**Endpoints cobertos:** `POST /api/v1/replay/jobs`, `GET /api/v1/replay/jobs/{jobId}`, `POST /api/v1/replay/jobs/{jobId}/abort`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/replay/jobs` | POST | Cria job de replay | JWT ROLE_DATA_ENG + approval | G |
| `GET /api/v1/replay/jobs/{jobId}` | GET | Status do job | JWT ROLE_DATA_ENG | P |
| `POST /api/v1/replay/jobs/{jobId}/abort` | POST | Aborta job | JWT ROLE_DATA_ENG | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/replay/jobs`

```
POST /api/v1/replay/jobs
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "windowStart": "2026-01-01T00:00:00Z", "windowEnd": "2026-01-31T23:59:59Z",
  "targetEnv": "SANDBOX", "approverId": "u-approver", "justification": "Auditoria STJ case 2026-441" }
```

### Response de sucesso

```json
{ "jobId": "r1000000-2000-4000-8000-300000000010", "status": "QUEUED", "targetEnv": "SANDBOX" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/replay/jobs",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | job sandbox com approval |
| **CA-02** | target prod bus → 403 |
| **CA-03** | sem justificativa → 422 |
| **CA-04** | GET status |
| **CA-05** | abort RUNNING |
| **CA-06** | abort DONE → 409 |

Rastreáveis também via feature `PRISMA-EP-01-F10`.

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
| `tb_replay_job` | Job | id, window_start, window_end, status, approver, justification, output_uri |

```sql
CREATE TABLE tb_replay_job (
  id UUID PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL,
  requester UUID NOT NULL,
  approver UUID NOT NULL,
  justification TEXT NOT NULL,
  output_uri TEXT,
  target_env VARCHAR(20) NOT NULL CHECK (target_env <> 'PRODUCTION_BUS'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Isolamento prod | start replay | Proibido target=PRODUCTION bus | Tentativa → 403 | HTTP 403 |
| **RN002** | Aprovação obrigatória | POST jobs | justificativa + aprovador | Sem approval → 403 | HTTP 403 |
| **RN003** | Auditabilidade | job | Grava janela, filtros, actor, output URI | N/A | HTTP 200 |
| **RN004** | Abort seguro | abort | Para consumers sem side-effect prod | Job DONE → 409 | HTTP 409 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_DATA_ENG · ROLE_COMPLIANCE (approver)

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Kafka sandbox | Replay | Tópicos isolados | ACL deny prod |
| Spark/Iceberg | Backfill | Recompute features/score | Airflow |
| Approval service | Governança | Dual control | Sync |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | job sandbox com approval | 202 |
| **CT-02** | target prod bus → 403 | 403 |
| **CT-03** | sem justificativa → 422 | 422 |
| **CT-04** | GET status | 200 |
| **CT-05** | abort RUNNING | 200 |
| **CT-06** | abort DONE → 409 | 409 |
| **CT-07** | sem approver → 403 | 403 |
| **CT-08** | output URI auditável | 200 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F10-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F10-US-BE-01_
