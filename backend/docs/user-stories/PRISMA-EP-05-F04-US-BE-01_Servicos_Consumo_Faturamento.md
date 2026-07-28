# PRISMA-EP-05-F04-US-BE-01 — Serviços de Consumo e Faturamento (Console B2B)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F04-US-BE-01` |
| **Título** | Serviços de Consumo e Faturamento (Console B2B) |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F04` — Console B2B de Consumo, Faturamento e Contratos |
| **US-FE relacionada** | `PRISMA-EP-05-F04-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** sistema do console B2B  
**Quero** expor consumo, faturas e contratos segregados por tenant  
**Para que** o cliente B2B se atender sozinho e o custo de suporte cair

---

## 3. Descrição

APIs do console multi-tenant: usage (atraso máximo 1h), invoices (download/detalhe) e contracts. Toda query filtra por tenant_id do JWT (RN segregação). Divergência consumo×fatura acima da tolerância suspende a fatura e aciona conferência interna.

**Endpoints cobertos:** `GET /api/v1/console/usage`, `GET /api/v1/console/invoices`, `GET /api/v1/console/contracts`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/console/usage` | GET | Consumo por período/produto/ambiente | JWT ROLE_B2B_ADMIN|ROLE_B2B_BILLING | M |
| `GET /api/v1/console/invoices` | GET | Lista faturas do tenant | JWT ROLE_B2B_ADMIN|ROLE_B2B_BILLING | M |
| `GET /api/v1/console/contracts` | GET | Contratos/versões aceitas | JWT ROLE_B2B_ADMIN | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/console/usage`

```
GET /api/v1/console/usage?periodStart=2026-07-01&periodEnd=2026-07-31&environment=PRODUCTION
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{
  "tenantId": "11111111-2222-4333-8444-555555555555",
  "dataFreshnessAt": "2026-07-27T17:30:00Z",
  "items": [
    {
      "productCode": "credit.score",
      "environment": "PRODUCTION",
      "callCount": 12840,
      "amount": 3842.00,
      "currency": "BRL"
    }
  ],
  "totals": { "callCount": 12840, "amount": 3842.00 }
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/console/usage",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    { "field": "campo", "message": "mensagem", "rejectedValue": "valor" }
  ]
}
```

Códigos previstos: **200/201/204**, **400**, **401**, **403**, **404**, **409**, **413**, **422**, **424**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | Usage do próprio tenant |
| **CA-02** | Cross-tenant via manipulação de query → 403 |
| **CA-03** | Freshness > 1h inclui Warning header |
| **CA-04** | Fatura SUSPENSA por divergência |
| **CA-05** | Lista invoices paginada |
| **CA-06** | Contracts retorna versões aceitas |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F04`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F04`.
- Alinhamento DBA: entidades `CONTESTACAO` / `EVENTO_CONTESTACAO` / tenant B2B (HOME_DBA_V2).
- Integrações do épico: Base de negativação, Gateway pagamento, Notificação, IdP OIDC.
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da tabela da §4:

1. Validar autenticação/autorização declarada.
2. Validar path/query/body (Bean Validation).
3. Aplicar RNs da §8.4 na ordem: formato → existência → negócio → persistência/integração.
4. Persistir auditoria (`X-Correlation-ID`).
5. Retornar DTO de sucesso ou Error DTO padronizado.

**Transação:** `@Transactional` em escritas; leituras `readOnly=true`.  
**Idempotência:** recomenda-se `X-Idempotency-Key` em POST/PATCH de efeito colateral.  
**Rate limit:** headers `X-RateLimit-Limit|Remaining|Reset`.

### 8.2 Request / Response Schemas (DTOs)

- **Request DTOs:** campos tipados, `@NotNull` / `@Size` / `@Pattern` conforme exemplos da §5.
- **Response DTOs:** sem segredos (exceto one-time em F07); datas ISO-8601 UTC (`...Z`).
- **Error DTO:** schema único (§5).

### 8.3 Modelo de Dados

| Tabela | Descrição | Campos-chave |
| --- | --- | --- |
| `tb_usage_rollup` | Agregado de consumo | tenant_id, period_start, product_code, environment, call_count, amount, refreshed_at |
| `tb_invoice` | Fatura | id, tenant_id, period, total, currency, status, pdf_uri, issued_at |
| `tb_contract` | Contrato aceito | id, tenant_id, version, accepted_at, terms_uri |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_usage_rollup (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tb_tenant(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  product_code VARCHAR(40) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  call_count BIGINT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  refreshed_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, period_start, product_code, environment)
);
CREATE INDEX idx_usage_tenant_period ON tb_usage_rollup(tenant_id, period_start);

CREATE TABLE tb_invoice (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tb_tenant(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL,
  pdf_uri TEXT,
  issued_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE tb_contract (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tb_tenant(id),
  version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL,
  terms_uri TEXT NOT NULL
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Segregação por cliente | Qualquer GET console | Filtrar estritamente por tenant_id do token | Tentativa cross-tenant → 403 + incidente | HTTP 403 |
| **RN002** | Conciliação consumo×fatura | Emissão/consulta fatura | total_invoice ≈ sum(usage); tolerância configurável | Acima → status SUSPENSA | HTTP 409 |
| **RN003** | Freshness de consumo ≤ 1h | GET usage | Campo dataFreshnessAt; se >1h, header Warning | Sem dado → 204 | HTTP 200 |
| **RN004** | Gestão de usuários no IdP | Convite/revogação (FE) | Delegado ao Keycloak Admin API (fora deste contrato de leitura) | N/A | HTTP 200 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência FK → (4) RN de negócio → (5) side-effects/integrações → (6) commit.

### 8.5 Camadas e Estrutura de Código

```
controller/   → @RestController /api/v1/...
service/      → @Service @Transactional — RNs
port/         → interfaces outbound (negativação, SNS, Serpro, S3, Camunda)
adapter/      → implementações HTTP/SDK
repository/   → Spring Data JPA
domain/       → entities + enums de stage/status
dto/ + mapper/→ MapStruct ou manual
```

Exemplo de assinatura:

```java
@PostMapping // ou Get/Patch/Delete conforme endpoint
ResponseEntity<?> handle(@Valid @RequestBody /*...*/ req, Jwt jwt);
```

### 8.6 Segurança e Autorizações

| Tema | Definição |
| --- | --- |
| Autenticação | OIDC / JWT Bearer (Keycloak) — exceções: tracking público F01 e onboarding start F03 |
| Autorização | `ROLE_B2B_ADMIN · ROLE_B2B_BILLING · tenant_id claim obrigatório` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Stripe | Billing | Espelho de faturas / payment intent | Webhook invoice.paid |
| Keycloak | IdP | tenant_id claim no JWT | OIDC |
| Job de rollup | Interno | Agrega consumo a cada 15–60 min | Idempotente |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | Usage do próprio tenant | 200 |
| **CT-02** | Cross-tenant via manipulação de query → 403 | 403 |
| **CT-03** | Freshness > 1h inclui Warning header | 200 |
| **CT-04** | Fatura SUSPENSA por divergência | 409 |
| **CT-05** | Lista invoices paginada | 200 |
| **CT-06** | Contracts retorna versões aceitas | 200 |
| **CT-07** | Sem role billing → 403 em invoices | 403 |
| **CT-08** | Período inválido → 400 | 400 |

**Meta de cobertura:** > 80% linhas do service + contratos RestAssured/MockMvc.  
**Stack de teste:** JUnit 5, Spring Boot Test, Testcontainers (PostgreSQL), WireMock (outbound).

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa (endpoints, DTOs, DDL, RNs, camadas, segurança, integrações, testes)
- [x] Códigos HTTP mapeados
- [x] Exemplos de sucesso e erro
- [x] Segurança por endpoint
- [x] ≥ 5 cenários de teste

---

## 10. Handoff

| Destino | Uso |
| --- | --- |
| BMM Dev | Implementação Spring Boot |
| BMM DBA | Aplicar DDL / migrations Flyway |
| BMM TEA / GherkinFlow | Automatizar CT-* |
| Escritor Front | Contratos para `PRISMA-EP-05-F04-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F04-US-BE-01_
