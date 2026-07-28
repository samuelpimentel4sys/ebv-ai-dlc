# PRISMA-EP-04-F08-US-BE-01 — Geração do Dossiê Executivo

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · WeasyPrint/PDF · S3 · OIDC  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-04-F08-US-BE-01` |
| **Título** | Geração do Dossiê Executivo |
| **Épico** | `PRISMA-EP-04` — Sala de Risco Imersiva & Radar de Portfólio |
| **Feature** | `PRISMA-EP-04-F08` — Exportação Executiva e Dossiê de Comitê |
| **US-FE relacionada** | `PRISMA-EP-04-F08-US-FE-01` — Montagem do Dossiê de Comitê |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Complexidade** | M (5 SP) |
| **Roles** | `ROLE_COMMITTEE_SECRETARY, ROLE_RISK_DIRECTOR` |

---

## 2. User Story

**Como** sistema  
**Quero** compor o documento preservando premissas e data dos dados de cada análise  
**Para que** a deliberação do comitê fique documentada com contexto completo

---

## 3. Descrição

Backend da feature `PRISMA-EP-04-F08` no domínio `/api/v1/portfolio/*`. Autenticação OIDC/JWT multi-tenant (`X-Tenant-Id`), auditoria de acesso e Error DTO padronizado do programa Prisma.

**Critérios Explorer da US:** - Incluir premissas e filtros junto de cada análise - Gerar sumário executivo com os principais números - Bloquear exportação de análise sem premissas registradas

**Endpoints cobertos:** `POST /api/v1/portfolio/reports`, `GET /api/v1/portfolio/reports/{reportId}`, `GET /api/v1/portfolio/reports/{reportId}/download`

---

## 4. Serviços / Endpoints

| Método | Endpoint | Descrição | Auth | Tam. |
| --- | --- | --- | --- | :---: |
| `POST` | `/api/v1/portfolio/reports` | Gera dossiê PDF com premissas | JWT ROLE_COMMITTEE_SECRETARY | M |
| `GET` | `/api/v1/portfolio/reports/{reportId}` | Status + sumário executivo | JWT | P |
| `GET` | `/api/v1/portfolio/reports/{reportId}/download` | URL pré-assinada S3 | JWT | P |

---

## 5. Contrato de API (prévia)

### Request principal

```
POST /api/v1/portfolio/reports
{
  "portfolioId": "a1b2...",
  "title": "Comitê Jul/2026",
  "watermarkTo": "Diretoria de Risco",
  "sections": [
    {"analysisType": "STRESS", "analysisRef": "run-55", "sortOrder": 1},
    {"analysisType": "CONTAGION", "analysisRef": "sim-77ab", "sortOrder": 2}
  ]
}
```

### Response de sucesso

```json
{"reportId": "rep-01", "status": "GENERATING"}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/portfolio/...",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    {"field": "portfolioId", "message": "Campo obrigatório", "rejectedValue": null}
  ]
}
```

Códigos previstos: **200/201/202/204**, **400**, **401**, **403**, **404**, **409**, **422**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | Permitir selecionar e ordenar as análises |
| **CA-02** | Pré-visualizar o documento antes de gerar |
| **CA-03** | Aplicar marca d'água com destinatário e data |
| **CA-04** | Incluir premissas e filtros junto de cada análise |
| **CA-05** | Gerar sumário executivo com os principais números |
| **CA-06** | Bloquear exportação de análise sem premissas registradas |

Critérios herdados da feature permanecem rastreáveis via `PRISMA-EP-04-F08`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-04` e RNs da feature `PRISMA-EP-04-F08`.
- Fundações: camada OLAP (`F05`), grafo Neptune/Neo4j, Score Vivo (`PRISMA-EP-01`), IdP OIDC.
- Integrações: WeasyPrint · Amazon S3.
- Schema DBA: `portfolio.*` (alinhamento com 12_DBA_V2 — extensão analítica Release 2).
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:

1. Validar autenticação/autorização (`ROLE_COMMITTEE_SECRETARY, ROLE_RISK_DIRECTOR`).
2. Validar path/query/body (Bean Validation).
3. Aplicar RNs da §8.4 na ordem: formato → existência → negócio → persistência/integração.
4. Persistir auditoria (`X-Correlation-ID`).
5. Retornar DTO de sucesso ou Error DTO padronizado.

**Transação:** `@Transactional` em escritas; leituras `readOnly=true`.  
**Idempotência:** `X-Idempotency-Key` em POST de efeito colateral (simulate/run/refresh/reports).  
**Rate limit:** 120 req/min por usuário na sala de risco · headers `X-RateLimit-*`.

### 8.2 Request / Response Schemas (DTOs)

- **Request DTOs:** tipados, `@NotNull` / `@Size` / `@DecimalMin` conforme exemplos da §5.
- **Response DTOs:** sem segredos; datas ISO-8601 UTC.
- **Error DTO:** schema único (§5).

### 8.3 Modelo de Dados

#### DDL (PostgreSQL 16 · schema `portfolio`)

```sql
CREATE TABLE portfolio.tb_committee_report (
  report_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL,
  watermark_to VARCHAR(200),
  s3_uri TEXT,
  digest_sha256 BYTEA,
  executive_summary TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE portfolio.tb_report_section (
  section_id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES portfolio.tb_committee_report(report_id),
  sort_order INTEGER NOT NULL,
  analysis_type VARCHAR(40) NOT NULL,
  analysis_ref VARCHAR(120) NOT NULL,
  premises_json JSONB NOT NULL,
  as_of TIMESTAMPTZ NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Premissas inseparáveis do número | Exportação de qualquer análise | Incluir premissas, filtros e data dos dados junto de cada gráfico ou tabela | Análise sem premissas registradas é bloqueada para exportação | — |
| **RN002** | Identificação do destinatário | Geração de dossiê | Aplicar marca d'água com destinatário e data em todas as páginas | Dossiê sem destinatário definido é gerado apenas em modo rascunho | — |
| **RN003** | Premissas obrigatórias | seção sem premises_json | bloquear | PREMISES_REQUIRED | HTTP 422 |
| **RN004** | Marca d'água | PDF gerado | destinatário+data | — | HTTP 200 |
| **RN005** | Análise não exportável | contágio/stress sem flag | bloquear | NOT_EXPORTABLE | HTTP 422 |

**Ordem de validação:** (1) formato DTO → (2) existência tenant/portfolio → (3) regras de negócio → (4) persistência/integração.

### 8.5 Camadas e Estrutura

| Camada | Responsabilidade |
| --- | --- |
| Controller | REST, `@Valid`, HTTP mapping |
| Service | RNs, orquestração OLAP/grafo, `@Transactional` |
| Repository / Ports | JPA + adapters Trino/Neptune/S3/SNS/Flink |
| Mapper | Entity ↔ DTO · minimização de PII |

### 8.6 Segurança

- JWT Bearer (OIDC) · claims `sub`, `tenant_id`, `roles`
- RBAC: `ROLE_COMMITTEE_SECRETARY, ROLE_RISK_DIRECTOR`
- Isolamento multi-tenant em toda query
- Auditoria de acesso à carteira
- HTTPS TLS 1.2+ · CORS whitelist EBV

### 8.7 Integrações

WeasyPrint · Amazon S3

Timeouts sugeridos: Trino 4s · Neptune 3s · S3 pre-sign 300s. Retry 2x em leituras idempotentes; circuit breaker em Trino.

### 8.8 Testes de Integração

- CT-01 POST report 202
- CT-02 Sem premissas 422
- CT-03 READY + download URL
- CT-04 Watermark
- CT-05 Sumário executivo
- CT-06 Report 404
- CT-07 Role secretary
- CT-08 Ordenação sections

**Meta de cobertura:** >80% service + contract tests (RestAssured / Testcontainers).

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 (contratos) completa
- [x] Todos endpoints documentados
- [x] Request/Response + Error DTO
- [x] DDL PostgreSQL
- [x] RNs numeradas com HTTP
- [x] Segurança / roles
- [x] ≥5 cenários de teste

**Status:** Pronta para desenvolvimento ✅  
**Handoff:** BMM Dev · DBA (`portfolio`) · TEA · OpenAPI

---

_Documento elaborado com agente Escritor Back (BMAD UpStream) · EBV Prisma · 2026-07-27_
