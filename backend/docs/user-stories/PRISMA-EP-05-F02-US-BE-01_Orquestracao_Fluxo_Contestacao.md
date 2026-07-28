# PRISMA-EP-05-F02-US-BE-01 — Orquestração do Fluxo de Contestação

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **G** (8 SP) · Prioridade **P1**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F02-US-BE-01` |
| **Título** | Orquestração do Fluxo de Contestação |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F02` — Workflow de Contestação com SLA de 5 Dias |
| **US-FE relacionada** | `PRISMA-EP-05-F02-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | G (8 SP) |

---

## 2. User Story

**Como** sistema de workflow de contestação  
**Quero** conduzir etapas, prazos em dias úteis, diligências e desfecho fundamentado  
**Para que** o SLA da Súmula 548/STJ (5 dias úteis) ser cumprido por processo, não por esforço individual

---

## 3. Descrição

Orquestra o ciclo de vida da contestação com Camunda 8 + Spring Boot. Abre protocolo (POST), expõe fila operacional priorizada por prazo (GET queue) e registra desfecho (PATCH resolve) com fundamentação obrigatória. Em silêncio da fonte até o limite interno, decide em favor do titular. Escalonamento automático a 24h do vencimento (integra F06).

**Endpoints cobertos:** `POST /api/v1/disputes`, `GET /api/v1/disputes/queue`, `PATCH /api/v1/disputes/{id}/resolve`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/disputes` | POST | Abre contestação e inicia SLA 5 dias úteis | JWT ROLE_TITULAR ou serviço F05 | G |
| `GET /api/v1/disputes/queue` | GET | Fila ordenada por tempo restante de SLA | JWT ROLE_ANALISTA_CONTESTACAO | M |
| `PATCH /api/v1/disputes/{id}/resolve` | PATCH | Registra desfecho fundamentado e efeitos na base | JWT ROLE_ANALISTA_CONTESTACAO | G |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/disputes`

```
PATCH /api/v1/disputes/550e8400-e29b-41d4-a716-446655440000/resolve
Headers:
  Authorization: Bearer {jwt}\nContent-Type: application/json\nX-Correlation-ID: {uuid}
```

```json
{
  "outcome": "PROCEDENTE",
  "rationale": "Fonte informante não comprovou a dívida no prazo interno. Aplicação RN002 — decisão em favor do titular.",
  "effects": { "suspendNegativacao": true, "notifyTitular": true }
}
```

### Response de sucesso

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "protocol": "DSP-2026-0001847",
  "status": "CONCLUIDA",
  "outcome": "PROCEDENTE",
  "resolvedAt": "2026-07-30T16:42:00Z",
  "negativacaoAction": "SUSPENSA",
  "notificationQueued": true
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/disputes",
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
| **CA-01** | POST cria dispute + process instance + sla_due_at |
| **CA-02** | GET queue ordenada por sla_due_at ASC |
| **CA-03** | PATCH resolve com rationale válida |
| **CA-04** | PATCH sem rationale → 422 |
| **CA-05** | Silêncio da fonte → auto PROCEDENTE (job) |
| **CA-06** | Transição inválida de stage → 409 |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F02`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F02`.
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
| `tb_dispute` | Contestação (estendida) | outcome VARCHAR(30), rationale TEXT, process_instance_id VARCHAR(64), source_deadline_at TIMESTAMPTZ |
| `tb_dispute_queue_view` | Materializada/consulta fila | dispute_id, sla_due_at, priority_score, assigned_to |
| `tb_dispute_resolution` | Desfecho auditável | id, dispute_id, outcome, rationale, resolved_by, resolved_at, evidence_pack_id |

#### DDL (PostgreSQL 16)

```sql
ALTER TABLE tb_dispute
  ADD COLUMN IF NOT EXISTS outcome VARCHAR(30),
  ADD COLUMN IF NOT EXISTS rationale TEXT,
  ADD COLUMN IF NOT EXISTS process_instance_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS source_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_to UUID;

CREATE TABLE tb_dispute_resolution (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
  outcome VARCHAR(30) NOT NULL CHECK (outcome IN ('PROCEDENTE','IMPROCEDENTE','PARCIALMENTE_PROCEDENTE')),
  rationale TEXT NOT NULL,
  resolved_by UUID NOT NULL,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_pack_id UUID,
  UNIQUE (dispute_id)
);
CREATE INDEX idx_dispute_queue ON tb_dispute(status, sla_due_at) WHERE status <> 'CONCLUIDA';
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Prazo legal 5 dias úteis | POST /disputes | Inicia sla_due_at no protocolo; prioriza fila pelo restante | ≤24h → escala supervisor (F06) | HTTP 201 |
| **RN002** | Decisão na ausência da fonte | Limite interno de diligência estourado | Desfecho PROCEDENTE em favor do titular se sem comprovação | Resposta tardia registrada para revisão | HTTP 200 |
| **RN003** | Fundamentação obrigatória | PATCH resolve | outcome + rationale (min 50 chars) obrigatórios | Sem rationale → 422 | HTTP 422 |
| **RN004** | Baixa preventiva na base de negativação | Desfecho PROCEDENTE/PARCIAL | Acionar API interna de baixa/suspensão do apontamento | Falha integração → 503 + compensação | HTTP 503 |
| **RN005** | Transições de estado válidas | Qualquer mudança de stage | State machine: RECEBIDA→EM_ANALISE→EM_DILIGENCIA→CONCLUIDA | Transição inválida → 409 | HTTP 409 |

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
| Autorização | `ROLE_ANALISTA_CONTESTACAO · ROLE_SUPERVISOR_CONTESTACAO · ROLE_TITULAR (create)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Camunda 8 | BPMN | Instância de processo por contestação | Timeout + retry |
| Base de negativação | API interna | Baixa/suspensão do apontamento | Circuit breaker + compensação |
| Amazon SQS | Fila | Eventos de etapa / diligência | At-least-once |
| Motor SLA F06 | Interno | Escalonamento 24h | Event-driven |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | POST cria dispute + process instance + sla_due_at | 201 |
| **CT-02** | GET queue ordenada por sla_due_at ASC | 200 |
| **CT-03** | PATCH resolve com rationale válida | 200 |
| **CT-04** | PATCH sem rationale → 422 | 422 |
| **CT-05** | Silêncio da fonte → auto PROCEDENTE (job) | 200 |
| **CT-06** | Transição inválida de stage → 409 | 409 |
| **CT-07** | Falha na baixa de negativação → 503 | 503 |
| **CT-08** | Analista sem role → 403 | 403 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F02-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F02-US-BE-01_
