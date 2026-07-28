# PRISMA-EP-05-F01-US-BE-01 — Serviço de Rastreamento de Contestação

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F01-US-BE-01` |
| **Título** | Serviço de Rastreamento de Contestação |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F01` — Tracking de Contestação no Padrão E-commerce |
| **US-FE relacionada** | `PRISMA-EP-05-F01-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** sistema de contestação  
**Quero** expor etapa, prazo restante, próxima ação e histórico da contestação de forma segura  
**Para que** o titular acompanhar sozinho (padrão e-commerce) e o volume de SAC cair

---

## 3. Descrição

Expõe APIs de leitura para acompanhamento transparente da contestação. Suporta consulta autenticada (JWT) e consulta sem login pleno por protocolo + dado de confirmação do titular (CPF parcial ou data de nascimento), com lockout após 3 tentativas incorretas (30 min). Não revela dados da fonte informante quando a etapa é diligência externa.

**Endpoints cobertos:** `GET /api/v1/disputes/{protocol}/tracking`, `GET /api/v1/disputes/{protocol}/timeline`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/disputes/{protocol}/tracking` | GET | Retorna etapa atual, prazo restante em dias úteis e próxima ação | Protocolo+confirmação OU JWT Bearer (ROLE_TITULAR) | M |
| `GET /api/v1/disputes/{protocol}/timeline` | GET | Retorna linha do tempo completa de eventos da contestação | Protocolo+confirmação OU JWT Bearer (ROLE_TITULAR) | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/disputes/{protocol}/tracking`

```
GET /api/v1/disputes/DSP-2026-0001847/tracking?confirmationField=CPF_LAST4&confirmationValue=7890
Headers:
  X-Correlation-ID: {uuid}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{
  "protocol": "DSP-2026-0001847",
  "stage": "EM_DILIGENCIA_FONTE",
  "status": "EM_ANDAMENTO",
  "slaDueAt": "2026-08-03T23:59:59Z",
  "businessDaysRemaining": 3,
  "nextAction": "Aguardar resposta da fonte informante",
  "nextActor": "FONTE",
  "timelinePreview": [
    { "eventType": "RECEBIDA", "occurredAt": "2026-07-27T10:00:00Z" },
    { "eventType": "EM_ANALISE", "occurredAt": "2026-07-27T14:20:00Z" },
    { "eventType": "EM_DILIGENCIA_FONTE", "occurredAt": "2026-07-28T09:05:00Z" }
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
  "path": "/api/v1/disputes/{protocol}/tracking",
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
| **CA-01** | Happy path tracking autenticado |
| **CA-02** | Consulta pública com confirmação válida |
| **CA-03** | Confirmação inválida (1ª/2ª tentativa) |
| **CA-04** | 3ª tentativa → lockout 30 min |
| **CA-05** | Protocolo inexistente |
| **CA-06** | IDOR — protocolo de outro titular |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F01`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F01`.
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
| `tb_dispute` | Contestação / protocolo | id UUID PK, protocol VARCHAR(32) UNIQUE, titular_id UUID, stage VARCHAR(40), status VARCHAR(30), sla_due_at TIMESTAMPTZ, next_action VARCHAR(200), next_actor VARCHAR(40), created_at, updated_at |
| `tb_dispute_event` | Eventos da timeline | id UUID PK, dispute_id UUID FK, event_type VARCHAR(60), actor VARCHAR(80), detail TEXT, occurred_at TIMESTAMPTZ |
| `tb_tracking_lockout` | Lockout de consulta pública | id UUID PK, protocol VARCHAR(32), attempts INT, locked_until TIMESTAMPTZ, last_ip INET |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_dispute (
  id UUID PRIMARY KEY,
  protocol VARCHAR(32) NOT NULL UNIQUE,
  titular_id UUID NOT NULL,
  decision_id UUID,
  stage VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  sla_due_at TIMESTAMPTZ NOT NULL,
  next_action VARCHAR(200),
  next_actor VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dispute_titular ON tb_dispute(titular_id);
CREATE INDEX idx_dispute_sla_due ON tb_dispute(sla_due_at);

CREATE TABLE tb_dispute_event (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
  event_type VARCHAR(60) NOT NULL,
  actor VARCHAR(80) NOT NULL,
  detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dispute_event_dispute ON tb_dispute_event(dispute_id, occurred_at);

CREATE TABLE tb_tracking_lockout (
  id UUID PRIMARY KEY,
  protocol VARCHAR(32) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_ip INET,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_tracking_lockout_protocol ON tb_tracking_lockout(protocol);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Transparência de etapa e prazo | Consulta ao tracking | Exibir etapa, prazo restante (dias úteis) e próxima ação/responsável | Em diligência externa: ocultar dados da fonte | HTTP 200 |
| **RN002** | Validação de acesso por protocolo | Consulta sem autenticação plena | Exigir protocol + confirmationField/confirmationValue | 3 falhas → lockout 30 min (HTTP 429) | HTTP 429 |
| **RN003** | Ownership do titular autenticado | Consulta com JWT | Protocolo deve pertencer ao subject do token | IDOR → 403 | HTTP 403 |
| **RN004** | Calendário oficial de dias úteis | Cálculo de prazoRestante | Usar calendário EBV (feriados nacionais + estaduais configurados) | Falha no calendário → fallback dias corridos + flag | HTTP 200 |

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
| Autorização | `ROLE_TITULAR | consulta pública (protocol+confirmação)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Calendário de dias úteis EBV | Interno | Cálculo de businessDaysRemaining | Cache Redis TTL 24h |
| Amazon SNS | Notificação | Disparo indireto via F06 quando etapa muda (fora desta US) | Assíncrono |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | Happy path tracking autenticado | 200 |
| **CT-02** | Consulta pública com confirmação válida | 200 |
| **CT-03** | Confirmação inválida (1ª/2ª tentativa) | 403 |
| **CT-04** | 3ª tentativa → lockout 30 min | 429 |
| **CT-05** | Protocolo inexistente | 404 |
| **CT-06** | IDOR — protocolo de outro titular | 403 |
| **CT-07** | Timeline ordenada cronologicamente | 200 |
| **CT-08** | Diligência externa oculta dados da fonte | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F01-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F01-US-BE-01_
