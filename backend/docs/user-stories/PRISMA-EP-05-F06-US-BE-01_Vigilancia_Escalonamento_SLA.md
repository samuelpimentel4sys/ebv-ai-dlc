# PRISMA-EP-05-F06-US-BE-01 — Vigilância e Escalonamento de Prazos (SLA)

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F06-US-BE-01` |
| **Título** | Vigilância e Escalonamento de Prazos (SLA) |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F06` — Motor de SLA, Escalonamento e Notificação |
| **US-FE relacionada** | `PRISMA-EP-05-F06-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** motor de SLA  
**Quero** monitorar prazos continuamente, escalar antes do vencimento e notificar no canal preferido  
**Para que** o descumprimento da Súmula 548 ser prevenido ativamente

---

## 3. Descrição

Motor de vigilância (scheduler + eventos SQS) sobre tb_dispute.sla_due_at. Expõe status agregado, CRUD de policies de escalonamento e histórico de escalations. Notifica supervisor ao atingir % do prazo; se vencido, notifica gestor. Respeita preferência de canal do titular.

**Endpoints cobertos:** `GET /api/v1/sla/status`, `POST /api/v1/sla/policies`, `GET /api/v1/sla/escalations`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/sla/status` | GET | Painel: casos em risco / vencidos / no prazo | JWT ROLE_SUPERVISOR_CONTESTACAO | M |
| `POST /api/v1/sla/policies` | POST | Cria/atualiza política de escalonamento | JWT ROLE_OPS_ADMIN | M |
| `GET /api/v1/sla/escalations` | GET | Histórico de escalonamentos | JWT ROLE_SUPERVISOR_CONTESTACAO | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/sla/status`

```
GET /api/v1/sla/status?window=24h
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{
  "asOf": "2026-07-27T18:00:00Z",
  "counts": { "onTrack": 1204, "atRisk": 86, "overdue": 7 },
  "atRiskSample": [
    {
      "protocol": "DSP-2026-0001847",
      "businessDaysRemaining": 1,
      "stage": "EM_DILIGENCIA_FONTE",
      "assignedTo": "analista.silva"
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
  "path": "/api/v1/sla/status",
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
| **CA-01** | status agrega onTrack/atRisk/overdue |
| **CA-02** | policy ativa única |
| **CA-03** | segunda policy ACTIVE → 409 |
| **CA-04** | escalation idempotente em 6h |
| **CA-05** | fallback de canal em falha SMS |
| **CA-06** | caso OVERDUE notifica gestor |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F06`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F06`.
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
| `tb_sla_policy` | Política | id, name, warn_pct, escalate_hours_before, channels_json, active, version |
| `tb_sla_escalation` | Escalonamento | id, dispute_id, level, notified_roles, created_at |
| `tb_notification_log` | Entrega | id, dispute_id, channel, status, provider_ref, sent_at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_sla_policy (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  warn_pct NUMERIC(5,2) NOT NULL,
  escalate_hours_before INT NOT NULL,
  channels_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_sla_escalation (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
  level VARCHAR(30) NOT NULL,
  notified_roles VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dispute_id, level, created_at)
);
CREATE INDEX idx_sla_escalation_dispute ON tb_sla_escalation(dispute_id);

CREATE TABLE tb_notification_log (
  id UUID PRIMARY KEY,
  dispute_id UUID,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  provider_ref VARCHAR(120),
  payload_hash CHAR(64),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Escalonamento por risco | Caso atinge % configurado do prazo | Notifica supervisor + eleva prioridade | Já vencido → notifica gestor + marca OVERDUE | HTTP 200 |
| **RN002** | Preferência de canal | Notificação ao titular | Usar preferredChannel; fallback se falha | Ambos falham → registra FAILED | HTTP 200 |
| **RN003** | Idempotência de escalonamento | Job SLA | Não reescalar mesmo nível em 6h | Duplicate key / skip | HTTP 200 |
| **RN004** | Política versionada | POST policies | Nova policy versionada; ativa uma por tenant/global | Duas ACTIVE → 409 | HTTP 409 |

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
| Autorização | `ROLE_SUPERVISOR_CONTESTACAO · ROLE_OPS_ADMIN · ROLE_GESTOR_SAC` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Amazon SNS / SMS | Notificação | Push para titular e equipe | Fallback canal |
| Scheduler (Spring) | Interno | Scan a cada 1–5 min | Distributed lock Redis |
| F02 Queue | Interno | Eleva priority_score | Evento |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | status agrega onTrack/atRisk/overdue | 200 |
| **CT-02** | policy ativa única | 201 |
| **CT-03** | segunda policy ACTIVE → 409 | 409 |
| **CT-04** | escalation idempotente em 6h | 200 |
| **CT-05** | fallback de canal em falha SMS | 200 |
| **CT-06** | caso OVERDUE notifica gestor | 200 |
| **CT-07** | sem role → 403 | 403 |
| **CT-08** | escalations paginado | 200 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F06-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F06-US-BE-01_
