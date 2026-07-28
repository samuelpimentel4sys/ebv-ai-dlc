# PRISMA-EP-01-F09-US-BE-01 — Governança de Versões de Modelo de Score

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F09-US-BE-01` |
| **Título** | Governança de Versões de Modelo de Score |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F09` — Model Registry e Promoção Controlada de Versão de Score |
| **US-FE relacionada** | `PRISMA-EP-01-F09-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** model registry  
**Quero** manter registro imutável das versões com estágio e métricas  
**Para que** toda decisão poder ser associada à versão exata que a produziu

---

## 3. Descrição

MLflow/ONNX registry: list models, promote (shadow→canary→prod com métricas), rollback. Artefato imutável; emergência exige aprovação dupla.

**Endpoints cobertos:** `GET /api/v1/models`, `POST /api/v1/models/{modelId}/promote`, `POST /api/v1/models/{modelId}/rollback`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/models` | GET | Lista versões/estágios | JWT ROLE_ML_OPS|RISCO | P |
| `POST /api/v1/models/{modelId}/promote` | POST | Promove estágio | JWT ROLE_ML_OPS | G |
| `POST /api/v1/models/{modelId}/rollback` | POST | Rollback versão anterior | JWT ROLE_ML_OPS | M |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/models`

```
POST /api/v1/models/score-vivo/promote
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "version": "3.2.1", "toStage": "PRODUCTION", "canaryMetricsOk": true, "approverIds": ["u1","u2"] }
```

### Response de sucesso

```json
{ "modelId": "score-vivo", "version": "3.2.1", "stage": "PRODUCTION", "previousProduction": "3.1.0" }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/models",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | promote shadow→canary |
| **CA-02** | canary→prod com métricas |
| **CA-03** | métricas fail → 422 |
| **CA-04** | overwrite → 409 |
| **CA-05** | emergência dual approval |
| **CA-06** | rollback |

Rastreáveis também via feature `PRISMA-EP-01-F09`.

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
| `tb_model_version` | Versão | model_id, version, stage, artifact_uri, metrics_json, immutable |
| `tb_model_promotion` | Trilha promote | id, model_id, from_stage, to_stage, approvers[], at |

```sql
CREATE TABLE tb_model_version (
  model_id VARCHAR(80) NOT NULL,
  version VARCHAR(40) NOT NULL,
  stage VARCHAR(20) NOT NULL,
  artifact_uri TEXT NOT NULL,
  metrics_json JSONB,
  immutable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (model_id, version)
);

CREATE TABLE tb_model_promotion (
  id UUID PRIMARY KEY,
  model_id VARCHAR(80) NOT NULL,
  version VARCHAR(40) NOT NULL,
  from_stage VARCHAR(20) NOT NULL,
  to_stage VARCHAR(20) NOT NULL,
  approvers UUID[] NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Estágios obrigatórios | promote | shadow+canary antes de 100% | Emergência = dual approval | HTTP 200 |
| **RN002** | Artefato imutável | registry | Nunca sobrescreve versão | Overwrite → 409 incidente | HTTP 409 |
| **RN003** | Métricas gate | canary→prod | Aprovar thresholds | Fail métrica → 422 | HTTP 422 |
| **RN004** | Pin em decisão | F03/F05 | decision.model_version = ACTIVE | N/A | HTTP 200 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_ML_OPS · ROLE_RISCO_MODEL (aprovador)

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| MLflow | Registry | Metadados/artefatos | API |
| SageMaker/ONNX | Serving | Deploy | Argo Rollouts |
| F03 Motor | Consumer | Carrega ACTIVE | Hot reload |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | promote shadow→canary | 200 |
| **CT-02** | canary→prod com métricas | 200 |
| **CT-03** | métricas fail → 422 | 422 |
| **CT-04** | overwrite → 409 | 409 |
| **CT-05** | emergência dual approval | 200 |
| **CT-06** | rollback | 200 |
| **CT-07** | GET models | 200 |
| **CT-08** | sem role → 403 | 403 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F09-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F09-US-BE-01_
