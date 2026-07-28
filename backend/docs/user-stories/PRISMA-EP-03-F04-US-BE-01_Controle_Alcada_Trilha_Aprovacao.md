# PRISMA-EP-03-F04-US-BE-01 — Controle de Alçada e Trilha de Aprovação

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 + pgvector · Redis · Amazon Bedrock · Amazon Textract/S3 · Spring Boot 3 (HITL/OIDC Keycloak) · Amazon Neptune (grupo)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-03-F04-US-BE-01` |
| **Título** | Controle de Alçada e Trilha de Aprovação |
| **Épico** | `PRISMA-EP-03` — Copiloto GenAI de Crédito PJ com Grounding Auditável |
| **Feature** | `PRISMA-EP-03-F04` — Human-in-the-Loop e Alçada de Aprovação |
| **US-FE relacionada** | `PRISMA-EP-03-F04-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 2 (Estratégico · WSJF 4,00) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** sistema de governança de crédito PJ  
**Quero** rotear o parecer ao nível de alçada correto e registrar cada passo  
**Para que** a governança de crédito ser cumprida e comprovável

---

## 3. Descrição

HITL obrigatório: submit encaminha por faixa de valor; approve só por aprovador com alçada suficiente; trail audita submit/approve/reject/escalate. Sem aprovação humana o parecer não circula.

**Endpoints cobertos:** `POST /api/v1/pj/opinions/{id}/submit`, `POST /api/v1/pj/opinions/{id}/approve`, `GET /api/v1/pj/opinions/{id}/trail`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/pj/opinions/{id}/submit` | POST | Submete para alçada | JWT ROLE_ANALISTA_PJ | M |
| `POST /api/v1/pj/opinions/{id}/approve` | POST | Aprova/rejeita conforme alçada | JWT ROLE_APROVADOR_PJ | M |
| `GET /api/v1/pj/opinions/{id}/trail` | GET | Trilha de aprovação | JWT ROLE_ANALISTA_PJ|ROLE_APROVADOR_PJ|AUDIT | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/pj/opinions/{id}/submit`

```
POST /api/v1/pj/opinions/{id}/approve
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "decision": "APPROVED", "comment": "Riscos mitigados; índices acima da mediana setorial." }
```

### Response de sucesso

```json
{
  "opinionId": "d4444444-e555-4f66-8077-a88888888888",
  "status": "APPROVED",
  "levelCode": "L2_GERENTE",
  "approvedAt": "2026-07-27T19:10:00Z",
  "trailEntryId": "e5555555-f666-4077-8188-b99999999999"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/pj/opinions/{id}/submit",
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
| **CA-01** | submit roteia L2 por valor |
| **CA-02** | approve por L2 ok |
| **CA-03** | approve por L1 insuficiente → escalate |
| **CA-04** | criador tenta approve → 403 |
| **CA-05** | emitir sem APPROVED → 409 |
| **CA-06** | trail append-only ordenada |

Critérios herdados da feature (Explorer) permanecem rastreáveis via `PRISMA-EP-03-F04`.

---

## 7. Dependências e Observações

- Épico pai `PRISMA-EP-03` e RNs da feature `PRISMA-EP-03-F04`.
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
| `tb_pj_approval_policy` | Faixas de alçada | id, min_amount, max_amount, level_code, role_required |
| `tb_pj_approval_trail` | Trilha | id, opinion_id, action, actor_id, level_code, comment, at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_pj_approval_policy (
  id UUID PRIMARY KEY,
  min_amount NUMERIC(18,2) NOT NULL,
  max_amount NUMERIC(18,2),
  level_code VARCHAR(40) NOT NULL,
  role_required VARCHAR(60) NOT NULL
);

CREATE TABLE tb_pj_approval_trail (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES tb_pj_opinion(id),
  action VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL,
  level_code VARCHAR(40),
  comment TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pj_trail_opinion ON tb_pj_approval_trail(opinion_id, at);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Alçada por valor | submit/approve | Roteia nível pela faixa da operação | Valor > alçada → escalate | HTTP 200 |
| **RN002** | HITL obrigatório | circulação/emissão | Sem APPROVED bloqueia | Emitir sem approve → 409 | HTTP 409 |
| **RN003** | Segregação de funções | approve | Criador ≠ aprovador | Mesmo user → 403 | HTTP 403 |
| **RN004** | Trilha imutável | qualquer ação | Append-only em tb_pj_approval_trail | Update in-place proibido | HTTP 200 |

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
| Autorização | ROLE_ANALISTA_PJ · ROLE_APROVADOR_PJ_L1/L2/L3 · ROLE_AUDIT |
| Isolation | Filtro obrigatório por `cnpj` / ACL de carteira |
| Dados | Minimização; sem PII desnecessária em telemetria |
| Transporte | HTTPS TLS 1.2+ |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Keycloak | OIDC/RBAC | Roles de alçada | JWT claims |
| Amazon SQS | Notificação | Fila do aprovador | Async |
| F03 Opinions | Domínio | Status machine | Transacional |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | submit roteia L2 por valor | 200 |
| **CT-02** | approve por L2 ok | 200 |
| **CT-03** | approve por L1 insuficiente → escalate | 200 |
| **CT-04** | criador tenta approve → 403 | 403 |
| **CT-05** | emitir sem APPROVED → 409 | 409 |
| **CT-06** | trail append-only ordenada | 200 |
| **CT-07** | reject com comment obrigatório | 200 |
| **CT-08** | sem comment no reject → 422 | 422 |

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
| Escritor Front | Contratos para `PRISMA-EP-03-F04-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-03 · PRISMA-EP-03-F04-US-BE-01_
