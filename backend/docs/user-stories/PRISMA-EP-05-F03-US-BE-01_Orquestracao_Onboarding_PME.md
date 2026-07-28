# PRISMA-EP-05-F03-US-BE-01 — Orquestração do Onboarding Automatizado PME

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F03-US-BE-01` |
| **Título** | Orquestração do Onboarding Automatizado PME |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F03` — Onboarding PME Self-Service em 15 Minutos |
| **US-FE relacionada** | `PRISMA-EP-05-F03-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** sistema de onboarding B2B  
**Quero** validar cadastro CNPJ, poderes de representação, antifraude e emitir credencial de teste  
**Para que** a EBV capturar PMEs sem custo de venda assistida, em até 15 minutos

---

## 3. Descrição

Orquestra o funil self-service: start (dados PME + representante), verify (Serpro/Receita + poderes) e complete (aceite contratual versionado + emissão de API key de sandbox via F07). Produção só após validação antifraude. Divergência de poderes → fila manual sem descartar cadastro.

**Endpoints cobertos:** `POST /api/v1/onboarding/start`, `POST /api/v1/onboarding/{id}/verify`, `POST /api/v1/onboarding/{id}/complete`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/onboarding/start` | POST | Inicia onboarding com CNPJ e dados do solicitante | Público (rate limit) / captcha | M |
| `POST /api/v1/onboarding/{id}/verify` | POST | Valida CNPJ + representante legal | Session onboarding | G |
| `POST /api/v1/onboarding/{id}/complete` | POST | Registra aceite e emite credencial sandbox | Session onboarding | G |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/onboarding/start`

```
POST /api/v1/onboarding/{id}/complete
Headers:
  Content-Type: application/json\nX-Onboarding-Token: {token}
```

```json
{
  "contractVersion": "API-CREDITO-2026.07",
  "accepted": true,
  "billingEmail": "financeiro@empresa.com.br"
}
```

### Response de sucesso

```json
{
  "onboardingId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "SANDBOX_READY",
  "tenantId": "11111111-2222-4333-8444-555555555555",
  "credential": {
    "clientId": "ebv_live_test_9f3a",
    "apiKeyPreview": "ebv_****_a1b2",
    "apiKey": "ebv_test_a1b2c3d4e5f6...(somente uma vez)",
    "environment": "SANDBOX",
    "scopes": ["credit.score.read"]
  },
  "durationSeconds": 612
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/onboarding/start",
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
| **CA-01** | Fluxo feliz start→verify→complete < 15 min |
| **CA-02** | CNPJ irregular → 422 |
| **CA-03** | CPF fora do QSA → MANUAL_REVIEW 202 |
| **CA-04** | Contrato versão inválida → 409 |
| **CA-05** | CNPJ já tenant ativo → 409 |
| **CA-06** | Antifraude alto → SUSPENDED |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F03`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F03`.
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
| `tb_onboarding` | Processo de onboarding | id, cnpj, status, solicitante_cpf, company_name, antifraud_score, contract_version, accepted_at, tenant_id |
| `tb_onboarding_check` | Checks cadastrais | id, onboarding_id, check_type, result, raw_ref, checked_at |
| `tb_tenant` | Cliente B2B | id, cnpj UNIQUE, legal_name, status, created_at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_tenant (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL UNIQUE,
  legal_name VARCHAR(200) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_onboarding (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  status VARCHAR(30) NOT NULL,
  solicitante_cpf CHAR(11) NOT NULL,
  solicitante_nome VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  antifraud_score NUMERIC(5,4),
  contract_version VARCHAR(20),
  accepted_at TIMESTAMPTZ,
  accepted_ip INET,
  tenant_id UUID REFERENCES tb_tenant(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_onboarding_cnpj_status ON tb_onboarding(cnpj, status);

CREATE TABLE tb_onboarding_check (
  id UUID PRIMARY KEY,
  onboarding_id UUID NOT NULL REFERENCES tb_onboarding(id),
  check_type VARCHAR(40) NOT NULL,
  result VARCHAR(20) NOT NULL,
  raw_ref VARCHAR(200),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Verificação de poderes | verify/complete | Solicitante deve constar como representante legal | Divergência → status MANUAL_REVIEW | HTTP 202 |
| **RN002** | Liberação escalonada | complete | Sandbox automático; produção após antifraude | Indício fraude → SUSPENDED | HTTP 403 |
| **RN003** | Aceite contratual versionado | complete | contractVersion + acceptedAt + ip + userAgent obrigatórios | Versão inválida → 409 | HTTP 409 |
| **RN004** | SLA de fluxo 15 min | métrica | Telemetry de duração start→complete; alerta se p95 > 15 min | N/A | HTTP 200 |
| **RN005** | Unicidade de tenant por CNPJ | start | CNPJ já onboardado ativo → 409 | Reabertura apenas se CANCELLED | HTTP 409 |

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
| Autorização | `Público (start/verify/complete com token de sessão) · ROLE_OPS_ONBOARDING (fila manual)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Serpro/Receita API | Externa | Situação CNPJ + QSA | Timeout 3s, retry 1x |
| Keycloak | IdP | Realm do tenant / usuários | OIDC |
| Stripe | Pagamento | Setup de billing (opcional MVP) | Webhook |
| F07 Credentials | Interno | Emissão da API key sandbox | Transacional |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | Fluxo feliz start→verify→complete < 15 min | 201 |
| **CT-02** | CNPJ irregular → 422 | 422 |
| **CT-03** | CPF fora do QSA → MANUAL_REVIEW 202 | 202 |
| **CT-04** | Contrato versão inválida → 409 | 409 |
| **CT-05** | CNPJ já tenant ativo → 409 | 409 |
| **CT-06** | Antifraude alto → SUSPENDED | 403 |
| **CT-07** | Serpro timeout → 503 com retry hint | 503 |
| **CT-08** | Rate limit start → 429 | 429 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F03-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F03-US-BE-01_
