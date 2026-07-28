# PRISMA-EP-03-F08-US-BE-01 — Consolidação de Exposição por Grupo Econômico

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F08-US-BE-01` |
| **Título** | Consolidação de Exposição por Grupo Econômico |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F08` — Detecção de Grupo Econômico e Partes Relacionadas |
| **US-FE relacionada** | `PRISMA-EP-03-F08-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** serviço de grafo societário  
**Quero** montar o grafo e somar a exposição das empresas relacionadas  
**Para que** o risco avaliado corresponder ao grupo e não apenas ao CNPJ

---

## 3. Descrição

Consulta Neptune/grafo até 3 níveis; expõe group e related-parties; refresh assíncrono. Truncamento com aviso se estourar limite de nós. Alerta se parte relacionada estiver em outra operação em análise.

**Endpoints cobertos:** `GET /api/v1/pj/{cnpj}/group`, `GET /api/v1/pj/{cnpj}/related-parties`, `POST /api/v1/pj/group/refresh`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/pj/{cnpj}/group` | GET | Grafo + exposição consolidada | JWT ROLE_ANALISTA_PJ | G |
| `GET /api/v1/pj/{cnpj}/related-parties` | GET | Lista partes relacionadas | JWT ROLE_ANALISTA_PJ | M |
| `POST /api/v1/pj/group/refresh` | POST | Recalcula grafo do CNPJ | JWT ROLE_ANALISTA_PJ|batch | G |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/pj/{cnpj}/group`

```
GET /api/v1/pj/12345678000199/group?depth=3
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{
  "rootCnpj": "12345678000199",
  "depth": 3,
  "nodeCount": 14,
  "truncated": false,
  "totalExposure": 18250000.00,
  "refreshedAt": "2026-07-26T12:00:00Z",
  "nodes": [
    { "cnpj": "12345678000199", "name": "Empresa A", "exposure": 2500000.00 }
  ],
  "warnings": []
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/{cnpj}/group",
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
| **CA-01** | group depth 3 |
| **CA-02** | truncate com warning |
| **CA-03** | related-parties lista vínculos |
| **CA-04** | alerta overlap operação |
| **CA-05** | refresh assíncrono 202 |
| **CA-06** | CNPJ inválido → 400 |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F08`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F08`.
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
| `tb_pj_group_snapshot` | Snapshot grafo | id, root_cnpj, depth, node_count, truncated, refreshed_at |
| `tb_pj_group_edge` | Aresta | snapshot_id, from_cnpj, to_cnpj, relation, share_pct |
| `tb_pj_related_alert` | Alerta | id, cnpj, related_cnpj, opinion_id, created_at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_group_snapshot (
  id UUID PRIMARY KEY,
  root_cnpj CHAR(14) NOT NULL,
  depth INT NOT NULL,
  node_count INT NOT NULL,
  truncated BOOLEAN NOT NULL DEFAULT FALSE,
  total_exposure NUMERIC(18,2),
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pj_group_root ON tb_pj_group_snapshot(root_cnpj, refreshed_at DESC);

CREATE TABLE tb_pj_group_edge (
  id UUID PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES tb_pj_group_snapshot(id),
  from_cnpj CHAR(14) NOT NULL,
  to_cnpj CHAR(14) NOT NULL,
  relation VARCHAR(40) NOT NULL,
  share_pct NUMERIC(7,4)
);

CREATE TABLE tb_pj_related_alert (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  related_cnpj CHAR(14) NOT NULL,
  opinion_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Profundidade máx. 3 | montagem grafo | Até 3 níveis societários | Excede nós → truncate + warning | HTTP 200 |
| **RN002** | Sinaliza parte relacionada | overlap operação | Alert antes de concluir parecer | Pós-emissão → alerta retrógrado | HTTP 200 |
| **RN003** | Exposição consolidada | GET group | Soma exposição das empresas do grupo | Dado exposição indisponível → partial | HTTP 200 |
| **RN004** | Freshness | GET | Campo refreshedAt; stale > 7d sugere refresh | N/A | HTTP 200 |

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
| Autorização | ROLE_ANALISTA_PJ · ROLE_RISCO_PJ |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon Neptune | Grafo | Participações societárias | Timeout 5s |
| APIs cadastrais | Externa | QSA/vínculos | Batch Spark |
| Motor de exposição | Interno | Saldos por CNPJ | Cache |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | group depth 3 | 200 |
| **CT-02** | truncate com warning | 200 |
| **CT-03** | related-parties lista vínculos | 200 |
| **CT-04** | alerta overlap operação | 200 |
| **CT-05** | refresh assíncrono 202 | 202 |
| **CT-06** | CNPJ inválido → 400 | 400 |
| **CT-07** | Neptune timeout → 503 | 503 |
| **CT-08** | stale > 7d sinalizado | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F08-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F08-US-BE-01_
