# PRISMA-EP-05-F07-US-BE-01 — Ciclo de Vida das Credenciais de API

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F07-US-BE-01` |
| **Título** | Ciclo de Vida das Credenciais de API |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F07` — Gestão de Credenciais, Escopos e Limite de Uso |
| **US-FE relacionada** | `PRISMA-EP-05-F07-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** sistema de credenciais B2B  
**Quero** emitir, rotacionar, limitar e revogar API keys com escopo mínimo  
**Para que** o canal B2B permanecer seguro sem ampliar superfície de ataque

---

## 3. Descrição

Gestão de client credentials: create (escopos ⊆ contrato), rotate (convivência configurável; emergência revoga na hora) e revoke (DELETE). Segredo exibido uma única vez. Rate limit por key persistido e enforced no gateway.

**Endpoints cobertos:** `POST /api/v1/credentials`, `POST /api/v1/credentials/{id}/rotate`, `DELETE /api/v1/credentials/{id}`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/credentials` | POST | Emite nova credencial com escopos do contrato | JWT ROLE_B2B_ADMIN | M |
| `POST /api/v1/credentials/{id}/rotate` | POST | Rotaciona chave (convivência ou emergência) | JWT ROLE_B2B_ADMIN | M |
| `DELETE /api/v1/credentials/{id}` | DELETE | Revoga credencial imediatamente | JWT ROLE_B2B_ADMIN | P |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/credentials`

```
POST /api/v1/credentials/{id}/rotate
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json
```

```json
{ "emergency": false, "overlapHours": 24, "reason": "SCHEDULED_ROTATION" }
```

### Response de sucesso

```json
{
  "id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  "clientId": "ebv_live_prod_9f3a",
  "apiKey": "ebv_live_...(somente nesta resposta)",
  "scopes": ["credit.score.read"],
  "status": "ACTIVE",
  "previousKeyExpiresAt": "2026-07-28T18:00:00Z"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/credentials",
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
| **CA-01** | create com scopes válidos |
| **CA-02** | create com scope fora do contrato → 422 |
| **CA-03** | rotate com convivência 24h |
| **CA-04** | rotate emergency revoga na hora |
| **CA-05** | DELETE revoga |
| **CA-06** | cross-tenant → 403 |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F07`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F07`.
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
| `tb_credential` | Credencial | id, tenant_id, client_id, secret_hash, scopes[], status, rate_limit_rpm, expires_at |
| `tb_credential_rotation` | Histórico rotação | id, credential_id, old_key_expires_at, reason, rotated_by, rotated_at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_credential (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tb_tenant(id),
  client_id VARCHAR(64) NOT NULL UNIQUE,
  secret_hash VARCHAR(128) NOT NULL,
  scopes TEXT[] NOT NULL,
  status VARCHAR(20) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  rate_limit_rpm INT NOT NULL DEFAULT 60,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_credential_tenant ON tb_credential(tenant_id, status);

CREATE TABLE tb_credential_rotation (
  id UUID PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES tb_credential(id),
  previous_secret_hash VARCHAR(128) NOT NULL,
  old_key_expires_at TIMESTAMPTZ,
  reason VARCHAR(40) NOT NULL,
  rotated_by UUID NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Escopo mínimo | POST credentials | scopes ⊆ produtos contratados | Escopo extra → 422 | HTTP 422 |
| **RN002** | Convivência na rotação | POST rotate | Chave antiga válida por overlapHours (default 24h) | emergency=true → revoke imediato | HTTP 200 |
| **RN003** | Segredo one-time | create/rotate | apiKey plaintext só na response 201/200 | GET nunca devolve segredo | HTTP 200 |
| **RN004** | Rate limit por key | Uso da API | Enforced no gateway; metadado em tb_credential | Excesso → 429 | HTTP 429 |
| **RN005** | Tenant ownership | qualquer | credential.tenant_id = token.tenant_id | IDOR → 403 | HTTP 403 |

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
| Autorização | `ROLE_B2B_ADMIN (tenant) · ROLE_SECURITY_ADMIN (emergência global)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| API Gateway | Enforcement | Validação de key + rate limit | Cache JWK/hash |
| Keycloak | Opcional | Client credentials espelhados | Admin API |
| Vault/KMS | Segredos | Pepper para secret_hash | Rotação controlada |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | create com scopes válidos | 201 |
| **CT-02** | create com scope fora do contrato → 422 | 422 |
| **CT-03** | rotate com convivência 24h | 200 |
| **CT-04** | rotate emergency revoga na hora | 200 |
| **CT-05** | DELETE revoga | 204 |
| **CT-06** | cross-tenant → 403 | 403 |
| **CT-07** | segredo não retorna em GET list | 200 |
| **CT-08** | rate limit metadata refletido | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F07-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F07-US-BE-01_
