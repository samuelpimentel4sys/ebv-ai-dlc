# US Backend — PRISMA-EP-06-F01-US-BE-01: Ingestão Consentida de Dados Alternativos

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F01*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F01-US-BE-01
Título oficial:  Ingestão Consentida de Dados Alternativos
Feature:         PRISMA-EP-06-F01 — Ingestão de Dados Alternativos de Utilities
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F01-US-FE-01 — Acompanhamento de Cobertura por Parceiro
Endpoint âncora: POST /api/v1/alternative-data/ingest
Stack feature:   Apache NiFi, AWS Lambda, Amazon S3, Python 3.12, Great Expectations
Tabelas DDL:     tb_alt_data_batch, tb_alt_data_record, tb_alt_data_coverage, tb_alt_data_quality_report
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F01-US-BE-01` |
| **Título** | **Ingestão Consentida de Dados Alternativos** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F01` — Ingestão de Dados Alternativos de Utilities |
| **US-FE relacionada** | `PRISMA-EP-06-F01-US-FE-01` — Acompanhamento de Cobertura por Parceiro |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** receber, validar e normalizar os lotes das concessionárias parceiras,  
**Para que** o score thin-file seja construído sobre base legal e dado confiável.

---

## 3. Descrição

Trazer o histórico de pagamento de contas de consumo como evidência de comportamento para quem não tem histórico bancário.

Esta US Backend implementa a capacidade de serviço da feature **Ingestão de Dados Alternativos de Utilities**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/alternative-data/ingest`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_SYSTEM_INGEST, ROLE_DATA_PARTNER, ROLE_OPS_ALT_DATA`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Apache NiFi, AWS Lambda, Amazon S3, Python 3.12, Great Expectations`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `POST /api/v1/alternative-data/ingest` | Recebe lote de utilities, valida qualidade e normaliza | ROLE_SYSTEM_INGEST | G |
| `GET /api/v1/alternative-data/coverage` | Cobertura populacional por concessionária/região | ROLE_SYSTEM_INGEST | M |
| `GET /api/v1/alternative-data/quality` | Taxa de erro e qualidade dos últimos lotes | ROLE_SYSTEM_INGEST | M |

---

## 5. Contrato (Prévia) — POST /api/v1/alternative-data/ingest

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "partner_code": "CEMIG-MG",
  "utility_type": "ENERGIA",
  "source_uri": "s3://ebv-alt-data/cemig/2026-07-27/lote_001.parquet",
  "quality_limit": 0.02,
  "records": [
    {
      "documento": "12345678901",
      "account_ref": "UC-998877",
      "period_start": "2026-06-01",
      "period_end": "2026-06-30",
      "paid_on_time": true,
      "days_late": 0,
      "amount_cents": 18990
    }
  ]
}
```

### Response 200/201 (exemplo)

```json
{
  "batch_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "ACCEPTED",
  "record_count": 1,
  "accepted_count": 1,
  "discarded_no_consent": 0,
  "error_rate": 0.0,
  "normalized": true,
  "created_at": "2026-07-27T22:00:00Z"
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/alternative-data/ingest",
  "details": [{ "field": "campo", "message": "obrigatório", "rejectedValue": null }]
}
```

| HTTP | Quando |
|---|---|
| 400 | Payload inválido / validação de formato |
| 401 | JWT ausente ou inválido |
| 403 | Sem role necessária ou violação de ownership |
| 404 | Recurso não encontrado |
| 409 | Conflito de estado / duplicidade |
| 422 | Regra de negócio violada |
| 429 | Rate limit excedido |
| 500 | Erro inesperado |
| 503 | Dependência externa indisponível |

---

## 6. Critérios de Aceite

- Descartar registro de titular sem consentimento ativo
- Rejeitar lote com taxa de erro acima do limite contratado
- Normalizar o histórico para o modelo canônico de pontualidade

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Ingestão Consentida de Dados Alternativos
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/alternative-data/ingest com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F01-US-FE-01 |
| Stack | Apache NiFi, AWS Lambda, Amazon S3, Python 3.12, Great Expectations |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_SYSTEM_INGEST, ROLE_DATA_PARTNER, ROLE_OPS_ALT_DATA`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/alternative-data/ingest`
- **Controller:** `AlternativeDataController`
- **Service:** `AlternativeDataIngestService` (`@Transactional` em escritas)
- **Repository:** `AltDataBatchRepository`

Demais endpoints da feature herdam o mesmo envelope de erro e padrão de segurança.

### 8.2 Request / Response Schemas (DTOs)

| DTO | Direção | Campos-chave |
|---|---|---|
| Request do endpoint âncora | In | Ver JSON da §5 |
| Response do endpoint âncora | Out | Ver JSON da §5 |
| `ApiError` | Out | `timestamp, status, error, message, path, details[]` |

Validações típicas: `@NotNull`, `@Size`, `@Pattern` (documento 11 dígitos quando aplicável), enums fechados, UUID em path params.

### 8.3 Modelo de Dados (DDL PostgreSQL)

| Tabela | Propósito |
|---|---|
| `tb_alt_data_batch` | Lote recebido de concessionária |
| `tb_alt_data_record` | Registro normalizado de pontualidade por titular/conta |
| `tb_alt_data_coverage` | Agregado de cobertura por parceiro/região |
| `tb_alt_data_quality_report` | Relatório de qualidade e rejeições |

```sql
-- DDL PRISMA-EP-06-F01 / PRISMA-EP-06-F01-US-BE-01
CREATE TABLE tb_alt_data_batch (
  batch_id            UUID PRIMARY KEY,
  partner_code        VARCHAR(40) NOT NULL,
  utility_type        VARCHAR(20) NOT NULL CHECK (utility_type IN ('ENERGIA','AGUA','GAS','TELECOM')),
  source_uri          TEXT NOT NULL,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  record_count        INTEGER NOT NULL,
  error_rate          NUMERIC(7,4) NOT NULL,
  quality_limit       NUMERIC(7,4) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('RECEIVED','ACCEPTED','REJECTED','PARTIAL')),
  rejection_reason    TEXT,
  correlation_id      UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_alt_batch_partner_received ON tb_alt_data_batch (partner_code, received_at DESC);

CREATE TABLE tb_alt_data_record (
  record_id           UUID PRIMARY KEY,
  batch_id            UUID NOT NULL REFERENCES tb_alt_data_batch(batch_id),
  documento_hash      CHAR(64) NOT NULL,
  account_ref         VARCHAR(80) NOT NULL,
  utility_type        VARCHAR(20) NOT NULL,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  on_time_flag        BOOLEAN NOT NULL,
  days_late           INTEGER NOT NULL DEFAULT 0,
  amount_cents        BIGINT,
  canonical_punctuality SMALLINT NOT NULL CHECK (canonical_punctuality BETWEEN 0 AND 100),
  consent_id          UUID,
  discarded           BOOLEAN NOT NULL DEFAULT FALSE,
  discard_reason      VARCHAR(80),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_alt_record_doc ON tb_alt_data_record (documento_hash, period_end DESC);
CREATE INDEX ix_alt_record_batch ON tb_alt_data_record (batch_id);

CREATE TABLE tb_alt_data_coverage (
  coverage_id         UUID PRIMARY KEY,
  partner_code        VARCHAR(40) NOT NULL,
  region_code         VARCHAR(10) NOT NULL,
  population_covered  BIGINT NOT NULL,
  population_base     BIGINT NOT NULL,
  coverage_pct        NUMERIC(7,4) NOT NULL,
  as_of_date          DATE NOT NULL,
  UNIQUE (partner_code, region_code, as_of_date)
);

CREATE TABLE tb_alt_data_quality_report (
  report_id           UUID PRIMARY KEY,
  batch_id            UUID NOT NULL REFERENCES tb_alt_data_batch(batch_id),
  error_rate          NUMERIC(7,4) NOT NULL,
  invalid_docs        INTEGER NOT NULL DEFAULT 0,
  missing_consent     INTEGER NOT NULL DEFAULT 0,
  schema_errors       INTEGER NOT NULL DEFAULT 0,
  details_json        JSONB NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Consentimento como pré-condição | Ingestão de registro de utilities de um titular | Só processar dado de titular com consentimento específico ativo | Registro sem consentimento é descartado e não é armazenado | 422 |
| **RN002** | Limite de qualidade do lote | Recebimento de lote de concessionária | Rejeitar o lote inteiro quando a taxa de erro exceder o limite contratado | Lote rejeitado é devolvido ao parceiro com relatório de inconsistências | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
AlternativeDataController          // @RestController — mapeia HTTP ↔ DTO
  └─ AlternativeDataIngestService        // @Service — RN + @Transactional
       ├─ AltDataBatchRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Apache NiFi, AWS Lambda, Amazon S3, Python 3.12, Great Expectations`).

### 8.6 Segurança e Autorizações

| Prática | Definição |
|---|---|
| AuthN | JWT Bearer (OIDC) |
| AuthZ | RBAC + ownership do `documento` do titular |
| Dados | CPF apenas como hash (`documento_hash`) em repouso |
| Transporte | TLS 1.2+ |
| LGPD | Consentimento F04 como pré-condição quando houver utilities/score/marketplace |
| Rate limit | Headers `X-RateLimit-*` |

### 8.7 Integrações

| Integração | Uso | Resiliência |
|---|---|---|
| Amazon S3 | Leitura do lote parquet/csv | timeout 30s, retry 3x |
| Consent Service (F04) | GET consentimento ativo por finalidade UTILITIES_SCORE | fail-closed |
| Great Expectations / Lambda | Validação de schema e qualidade | timeout 60s |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Happy path — lote aceito e normalizado | Pass |
| 02 | CT-02 Registro sem consentimento descartado (RN-01) | Pass |
| 03 | CT-03 Lote rejeitado por error_rate acima do limite (RN-02) | Pass |
| 04 | CT-04 GET coverage retorna agregados por região | Pass |
| 05 | CT-05 GET quality lista últimos lotes com taxa de erro | Pass |
| 06 | CT-06 401 sem JWT / 403 sem ROLE_SYSTEM_INGEST | Pass |

**Meta de cobertura:** >80% linhas do service + contratos RestAssured/WebTestClient.

---

## 9. Checklist de Qualidade (Gate G5)

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa (endpoints, DTOs, DDL, RN, camadas, segurança, integrações, testes)
- [x] Todos endpoints da feature listados
- [x] Códigos HTTP mapeados
- [x] RNs explícitas com HTTP
- [x] ≥5 cenários de teste
- [x] Exemplos request/response
- [x] US-FE pareada rastreável
- [x] Sem estimativa proibida além do indicativo SP

---

## 10. Resumo Executivo

| Métrica | Valor |
|---|---|
| Endpoints | 3 |
| Entidades/tabelas | 4 |
| RNs documentadas | 4 |
| Testes | 6 |
| Complexidade | G |

**Status:** Pronta para desenvolvimento ✅

---

_Documento elaborado com agente **Escritor Back** (BMAD UpStream) · PRISMA-EP-06 · 2026-07-27_
