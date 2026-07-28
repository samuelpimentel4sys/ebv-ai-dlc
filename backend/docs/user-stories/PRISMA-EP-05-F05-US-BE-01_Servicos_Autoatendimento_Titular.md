# PRISMA-EP-05-F05-US-BE-01 — Serviços de Autoatendimento do Titular

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F05-US-BE-01` |
| **Título** | Serviços de Autoatendimento do Titular |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F05` — Autoatendimento B2C de Consulta e Abertura de Protocolo |
| **US-FE relacionada** | `PRISMA-EP-05-F05-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** sistema de autoatendimento B2C  
**Quero** identificar o titular, listar apontamentos e registrar contestação com motivo obrigatório  
**Para que** a contestação nascer no canal digital e o telefone deixar de ser a porta de entrada

---

## 3. Descrição

Três endpoints: identify (fator adicional de identidade), records (apontamentos do titular) e disputes (abertura de protocolo com motivo + descrição mínima). Delega criação formal e início de SLA ao F02. Não exibe dados sensíveis antes da verificação de identidade.

**Endpoints cobertos:** `POST /api/v1/self-service/identify`, `GET /api/v1/self-service/records`, `POST /api/v1/self-service/disputes`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/self-service/identify` | POST | Verifica identidade e emite session token curto | Público + OTP/MFA | M |
| `GET /api/v1/self-service/records` | GET | Lista apontamentos do titular | Bearer self-service session | M |
| `POST /api/v1/self-service/disputes` | POST | Abre contestação (motivo obrigatório) | Bearer self-service session | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/self-service/identify`

```
POST /api/v1/self-service/disputes
Headers:
  Authorization: Bearer {self_service_jwt}\nContent-Type: application/json
```

```json
{
  "recordId": "neg-998877",
  "reasonCode": "NAO_RECONHECO_DIVIDA",
  "description": "Nunca contratei este serviço e não reconheço a cobrança.",
  "preferredChannel": "SMS"
}
```

### Response de sucesso

```json
{
  "protocol": "DSP-2026-0001847",
  "disputeId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RECEBIDA",
  "slaDueAt": "2026-08-03T23:59:59Z",
  "trackingUrl": "/acompanhamento/DSP-2026-0001847"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/self-service/identify",
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
| **CA-01** | identify + records happy path |
| **CA-02** | records sem identify → 401 |
| **CA-03** | dispute sem motivo → 422 |
| **CA-04** | dispute cria protocol |
| **CA-05** | session expirada → 401 |
| **CA-06** | recordId de outro titular → 403 |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F05`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F05`.
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
| `tb_self_service_session` | Sessão B2C | id, titular_id, expires_at, channel, ip |
| `tb_dispute_reason` | Catálogo de motivos | code PK, label, active |
| `tb_dispute` | Reuso F02 | criada via serviço de domínio |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_self_service_session (
  id UUID PRIMARY KEY,
  titular_id UUID NOT NULL,
  channel VARCHAR(30) NOT NULL,
  ip INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ss_session_titular ON tb_self_service_session(titular_id, expires_at);

CREATE TABLE tb_dispute_reason (
  code VARCHAR(40) PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Verificação prévia de identidade | GET records / POST disputes | Exigir identify bem-sucedido (session válida) | Falha → 401; sem dados vazados | HTTP 401 |
| **RN002** | Motivo obrigatório | POST disputes | reasonCode + description (min 20 chars) | Inválido → 422 sem protocolo | HTTP 422 |
| **RN003** | Session TTL curto | identify | Token self-service expira em 15 min | Expirado → 401 | HTTP 401 |
| **RN004** | Protocolo imediato | POST disputes sucesso | Retornar protocol + trackingUrl na mesma resposta | Falha F02 → 503 | HTTP 503 |

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
| Autorização | `Self-service session (scope self-service.titular)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Provedor OTP/SMS | Externa | identify MFA | Retry + fallback e-mail |
| Base de negativação | Interna | Listagem de apontamentos | Cache curto |
| F02 Disputes API | Interno | POST /api/v1/disputes | Transacional/síncrono |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | identify + records happy path | 200 |
| **CT-02** | records sem identify → 401 | 401 |
| **CT-03** | dispute sem motivo → 422 | 422 |
| **CT-04** | dispute cria protocol | 201 |
| **CT-05** | session expirada → 401 | 401 |
| **CT-06** | recordId de outro titular → 403 | 403 |
| **CT-07** | F02 indisponível → 503 | 503 |
| **CT-08** | OTP inválido no identify → 401 | 401 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F05-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F05-US-BE-01_
