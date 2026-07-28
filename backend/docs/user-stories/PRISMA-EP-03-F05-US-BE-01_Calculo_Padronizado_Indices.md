# PRISMA-EP-03-F05-US-BE-01 — Cálculo Padronizado de Índices Financeiros PJ

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F05-US-BE-01` |
| **Título** | Cálculo Padronizado de Índices Financeiros PJ |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F05` — Cálculo Automatizado de Índices Financeiros PJ |
| **US-FE relacionada** | `PRISMA-EP-03-F05-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** motor de índices PJ  
**Quero** calcular índices a partir do plano de contas canônico com rastreabilidade  
**Para que** todos os pareceres usarem a mesma régua de avaliação financeira

---

## 3. Descrição

Calcula liquidez, alavancagem, margem etc. a partir das rubricas F01. Persiste fórmula + inputs; rubrica ausente → NOT_COMPUTABLE (sem estimativa). Benchmarks por CNAE quando amostra suficiente.

**Endpoints cobertos:** `POST /api/v1/pj/ratios/calculate`, `GET /api/v1/pj/{cnpj}/ratios`, `GET /api/v1/pj/ratios/benchmarks`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/ratios/calculate` | POST | Calcula índices do CNPJ/exercício | JWT ROLE_ANALISTA_PJ|serviço | M |
| `GET /api/v1/pj/{cnpj}/ratios` | GET | Lista índices calculados | JWT ROLE_ANALISTA_PJ | P |
| `GET /api/v1/pj/ratios/benchmarks` | GET | Medianas setoriais CNAE | JWT ROLE_ANALISTA_PJ | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/ratios/calculate`

```
POST /api/v1/pj/ratios/calculate
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "cnpj": "12345678000199", "fiscalYear": 2025, "chartVersion": "CANON-2026.1" }
```

### Response de sucesso

```json
{
  "runId": "aa000001-bb02-4cc3-8dd4-ee0000000005",
  "ratios": [
    {
      "code": "MARGEM_LIQUIDA",
      "value": 0.051,
      "status": "COMPUTED",
      "formulaSnapshot": "lucro_liquido / receita_liquida",
      "sectorMedian": 0.038,
      "sectorSampleSize": 842
    },
    {
      "code": "LIQUIDEZ_CORRENTE",
      "status": "NOT_COMPUTABLE",
      "missingFields": ["ativo_circulante"]
    }
  ]
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/ratios/calculate",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    { "field": "campo", "message": "mensagem", "rejectedValue": "valor" }
  ]
}
```

Códigos previstos: **200/201/202/204/206**, **400**, **401**, **403**, **404**, **409**, **412**, **422**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | calculate COMPUTED com formula |
| **CA-02** | rubrica ausente NOT_COMPUTABLE |
| **CA-03** | forceEstimate → 422 |
| **CA-04** | benchmark omitido se amostra baixa |
| **CA-05** | GET ratios por CNPJ |
| **CA-06** | chartVersion divergente → 409 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F05`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F05`.
- Dependências típicas do épico: Bedrock, Textract, pgvector, IdP, bases cadastrais PJ.
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4: authZ → validação → RNs §8.4 → side-effects → auditoria (`X-Correlation-ID`) → DTO/erro.

**Transação:** escritas atômicas; jobs GenAI fora de transação longa de DB.  
**Idempotência:** `X-Idempotency-Key` em POST de efeito colateral.  
**Rate limit:** headers `X-RateLimit-*`.

### 8.2 Request / Response Schemas (DTOs)

Campos tipados, validações explícitas, datas ISO-8601 UTC (`...Z`). Error DTO único (§5).

### 8.3 Modelo de Dados

| Tabela | Descrição | Campos-chave |
| --- | --- | --- |
| `tb_pj_ratio_def` | Catálogo | code, formula_expr, required_fields[] |
| `tb_pj_ratio_run` | Execução | id, cnpj, fiscal_year, chart_version, calculated_at |
| `tb_pj_ratio_value` | Valor | run_id, code, value, status, formula_snapshot, inputs_json |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_ratio_def (
  code VARCHAR(40) PRIMARY KEY,
  formula_expr TEXT NOT NULL,
  required_fields TEXT[] NOT NULL
);

CREATE TABLE tb_pj_ratio_run (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  fiscal_year INT NOT NULL,
  chart_version VARCHAR(20) NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cnpj, fiscal_year, chart_version)
);

CREATE TABLE tb_pj_ratio_value (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES tb_pj_ratio_run(id),
  code VARCHAR(40) NOT NULL REFERENCES tb_pj_ratio_def(code),
  value NUMERIC(18,6),
  status VARCHAR(20) NOT NULL,
  formula_snapshot TEXT NOT NULL,
  inputs_json JSONB NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Rastreabilidade da fórmula | calculate | Gravar formula, rubricas, exercício | Rubrica ausente → NOT_COMPUTABLE | HTTP 200 |
| **RN002** | Comparabilidade setorial | GET ratios/benchmarks | Mediana CNAE quando n>=minSample | Amostra insuficiente → omit + motivo | HTTP 200 |
| **RN003** | Sem estimativa | rubrica faltante | Nunca imputar valor | Tentativa forceEstimate → 422 | HTTP 422 |
| **RN004** | Idempotência | calculate | Mesmo (cnpj,year,chartVersion) sobrescreve run | Conflict de versão → 409 | HTTP 409 |

**Ordem:** formato → authZ/ownership → existência → RN → integrações/LLM → commit.

### 8.5 Camadas e Estrutura de Código

```
api/ (FastAPI routers)  ou  controller/ (Spring HITL)
service/ domain/
ports/ + adapters/ (Bedrock, Textract, Neptune, S3)
repository/ (SQLAlchemy / Spring Data)
dto/
```

### 8.6 Segurança e Autorizações

| Tema | Definição |
| --- | --- |
| Autenticação | OIDC / JWT Bearer (Keycloak) |
| Autorização | ROLE_ANALISTA_PJ · service account F03 |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| F01 Extraction | Interno | Rubricas canônicas | Sync |
| Catálogo CNAE benchmarks | Batch | Medianas setoriais | Job mensal |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | calculate COMPUTED com formula | 200 |
| **CT-02** | rubrica ausente NOT_COMPUTABLE | 200 |
| **CT-03** | forceEstimate → 422 | 422 |
| **CT-04** | benchmark omitido se amostra baixa | 200 |
| **CT-05** | GET ratios por CNPJ | 200 |
| **CT-06** | chartVersion divergente → 409 | 409 |
| **CT-07** | CNPJ inválido → 400 | 400 |
| **CT-08** | sem role → 403 | 403 |

**Meta de cobertura:** > 80% services + contratos HTTP.  
**Stack de teste:** pytest/Testcontainers ou JUnit5 + WireMock/Bedrock stubs.

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa
- [x] Códigos HTTP mapeados
- [x] Exemplos sucesso/erro
- [x] Segurança por endpoint
- [x] ≥ 5 cenários de teste

---

## 10. Handoff

| Destino | Uso |
| --- | --- |
| BMM Dev | Implementação FastAPI/Spring |
| BMM DBA | Migrations Flyway/Alembic |
| BMM TEA / GherkinFlow | Automatizar CT-* |
| Escritor Front | Contratos para `PRISMA-EP-03-F05-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F05-US-BE-01_
