# PRISMA-EP-01-F07-US-BE-01 — Consolidação de Identidade Dourada (Golden Record)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-01-F07-US-BE-01` |
| **Título** | Consolidação de Identidade Dourada (Golden Record) |
| **Épico** | `PRISMA-EP-01` — Score Vivo Event-Driven & Point-in-Time |
| **Feature** | `PRISMA-EP-01-F07` — Golden Record e Resolução de Identidade Pós-Fusão |
| **US-FE relacionada** | `PRISMA-EP-01-F07-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40 |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** serviço de identidade  
**Quero** parear registros das bases de origem e manter identidade consolidada versionada  
**Para que** o score vivo ser calculado sobre uma visão única do titular pós-fusão

---

## 3. Descrição

Record linkage (Splink): auto-merge acima limiar, descarte abaixo, fila humana no meio. Merge reversível com trilha; desfazer republica evento de correção.

**Endpoints cobertos:** `GET /api/v1/identity/{documento}`, `POST /api/v1/identity/merge`, `GET /api/v1/identity/candidates`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/identity/{documento}` | GET | Golden record atual | JWT ROLE_DATA_STEWARD|serviço | M |
| `POST /api/v1/identity/merge` | POST | Mescla identidades | JWT ROLE_DATA_STEWARD | G |
| `GET /api/v1/identity/candidates` | GET | Fila candidatos humanos | JWT ROLE_DATA_STEWARD | M |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/identity/{documento}`

```
POST /api/v1/identity/merge
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "survivorGrId": "g1", "mergedGrId": "g2", "confidence": 0.97, "reason": "SAME_CPF_HIGH_SCORE" }
```

### Response de sucesso

```json
{ "grId": "g1", "version": 4, "canonicalDocumento": "12345678901", "status": "ACTIVE", "links": 3 }
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/identity/{documento}",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [{ "field": "campo", "message": "mensagem", "rejectedValue": "valor" }]
}
```

Códigos: **200/201/202**, **400**, **401**, **403**, **404**, **405**, **409**, **422**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | auto-merge alto score |
| **CA-02** | faixa média → candidates |
| **CA-03** | merge humano |
| **CA-04** | undo merge |
| **CA-05** | ciclo → 409 |
| **CA-06** | GET identity |

Rastreáveis também via feature `PRISMA-EP-01-F07`.

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
| `tb_golden_record` | Identidade | gr_id, canonical_documento, version, status |
| `tb_identity_link` | Vínculo origem | gr_id, source_system, source_key, confidence |
| `tb_identity_merge_trail` | Trilha | id, action, from_gr, to_gr, actor, at |

```sql
CREATE TABLE tb_golden_record (
  gr_id UUID PRIMARY KEY,
  canonical_documento CHAR(14) NOT NULL,
  version INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_gr_doc_ver ON tb_golden_record(canonical_documento, version);

CREATE TABLE tb_identity_link (
  id UUID PRIMARY KEY,
  gr_id UUID NOT NULL REFERENCES tb_golden_record(gr_id),
  source_system VARCHAR(40) NOT NULL,
  source_key VARCHAR(120) NOT NULL,
  confidence NUMERIC(5,4) NOT NULL
);

CREATE TABLE tb_identity_merge_trail (
  id UUID PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  from_gr UUID,
  to_gr UUID,
  actor UUID NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Faixas similaridade | pareamento | Auto / humano / discard | Faixa média → fila | HTTP 200 |
| **RN002** | Merge reversível | merge | Preserva origem + trilha | Undo republica correção | HTTP 200 |
| **RN003** | Versionamento GR | qualquer | Nova versão em cada merge | Leitura pinável por version | HTTP 200 |
| **RN004** | Sem merge cíclico | merge | Detecta ciclos no grafo | Ciclo → 409 | HTTP 409 |

### 8.5 Camadas
`controller/router → service → ports/adapters (Kafka, Feast, ONNX, S3) → repository`

### 8.6 Segurança
JWT/OAuth2/mTLS conforme endpoint; isolation por `documento`/`client_id`; HTTPS.

**Roles:** ROLE_DATA_STEWARD · service score

### 8.7 Integrações

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Splink/Spark | Linkage | Scores similaridade | Batch |
| Neptune | Grafo | Relações identidade | Opcional |
| F01 Events | Correção | Undo/merge events | Kafka |

### 8.8 Testes

| ID | Cenário | HTTP |
| --- | --- | :---: |
| **CT-01** | auto-merge alto score | 200 |
| **CT-02** | faixa média → candidates | 200 |
| **CT-03** | merge humano | 200 |
| **CT-04** | undo merge | 200 |
| **CT-05** | ciclo → 409 | 409 |
| **CT-06** | GET identity | 200 |
| **CT-07** | version pin | 200 |
| **CT-08** | sem role → 403 | 403 |

Meta cobertura >80%. JUnit5/Testcontainers/WireMock ou pytest equivalente.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 · Seção 8 completa · HTTP · Exemplos · Segurança · ≥5 testes

---

## 10. Handoff

BMM Dev · DBA (Flyway) · TEA/GherkinFlow · Escritor Front (`PRISMA-EP-01-F07-US-FE-01`)

---

_Fim · Escritor Back · PRISMA-EP-01 · PRISMA-EP-01-F07-US-BE-01_
