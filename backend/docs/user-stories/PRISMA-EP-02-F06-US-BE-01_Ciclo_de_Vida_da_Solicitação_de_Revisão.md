# US Backend — PRISMA-EP-02-F06-US-BE-01: Ciclo de Vida da Solicitação de Revisão

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F06*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F06-US-BE-01` |
| **Título oficial** | **Ciclo de Vida da Solicitação de Revisão** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F06` — Portal de Revisão Humana da Decisão Automatizada |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `PATCH /api/v1/reviews/{reviewId}/decide` |
| **Stack** | Java 21, Spring Boot 3, PostgreSQL, Amazon SQS, Keycloak |

## 2. User Story

**Como** sistema,  
**Quero** controlar abertura, prazo, atribuição e desfecho da revisão humana,  
**Para que** o direito do titular seja cumprido dentro do prazo com prova documental.

## 3. Descrição

Orquestra fila de revisão humana, escalonamento por prazo, decisão fundamentada e notificação rastreável. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `POST /api/v1/reviews` | Abre revisão humana de decisão | decision_id; subject_token; reason; channel | 201 ReviewResponse | `ROLE_SUBJECT` |
| `GET /api/v1/reviews/queue` | Lista fila priorizada por vencimento | status; assignee; due_before; page; size | 200 ReviewQueuePage | `ROLE_SUBJECT` |
| `PATCH /api/v1/reviews/{reviewId}/decide` | Registra desfecho fundamentado | reviewId UUID; outcome; rationale; reviewed_factors[] | 200 ReviewDecisionResponse | `ROLE_SUBJECT` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "outcome": "REFORM",
  "rationale": "Documento atualizado comprova quitação anterior ao corte da decisão.",
  "reviewed_factors": [
    "DEBT_STATUS",
    "PAYMENT_RECENCY"
  ],
  "notification_channel": "PORTAL"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "review_id": "913d787c-af43-4931-8c80-331a8bf7f92d",
  "status": "DECIDED",
  "outcome": "REFORM",
  "reviewer_id": "d698a06e-415a-4433-b822-25c91de10690",
  "decided_at": "2026-07-27T21:16:00Z",
  "audit_event_id": "cf79a011-b973-46e3-a567-f4da592fab18"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/reviews/{reviewId}/decide",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em ciclo de vida da solicitação de revisão |
| 401 | `AUTHENTICATION_REQUIRED` | Bearer ausente, expirado ou assinatura inválida |
| 403 | `ACCESS_DENIED` | Permissão, tenant, finalidade ou ownership insuficiente |
| 404 | `RESOURCE_NOT_FOUND` | Identificador consultado não existe ou não é visível |
| 409 | `STATE_CONFLICT` | Estado atual, versão otimista ou chave idempotente conflita |
| 422 | `BUSINESS_RULE_VIOLATION` | Regra numerada da §8.4 impede processamento |
| 429 | `RATE_LIMITED` | Cota por cliente/usuário excedida; devolver `Retry-After` |
| 500 | `INTERNAL_ERROR` | Erro não previsto, sem exposição de dado sensível |
| 503 | `DEPENDENCY_UNAVAILABLE` | Integração crítica indisponível após política de resiliência |

## 6. Critérios de Aceite

| ID | Critério preservado da fonte |
|---|---|
| CA-01 | Exibir snapshot, explicação e contrafactuais na mesma tela |
| CA-02 | Exigir justificativa textual para qualquer decisão |
| CA-03 | Registrar o revisor e o carimbo de tempo na trilha de auditoria |
| CA-04 | Iniciar a contagem do prazo no momento da abertura |
| CA-05 | Escalar automaticamente as solicitações a menos de 24 horas do vencimento |
| CA-06 | Publicar o desfecho na trilha de auditoria e notificar o titular |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Ciclo de Vida da Solicitação de Revisão
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa PATCH /api/v1/reviews/{reviewId}/decide com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E iniciar a contagem do prazo no momento da abertura
    E escalar automaticamente as solicitações a menos de 24 horas do vencimento
    E publicar o desfecho na trilha de auditoria e notificar o titular

  @negativo @backend
  Cenário: Rejeitar violação de regra regulatória
    Dado uma requisição autenticada que viola RN001
    Quando o endpoint âncora é executado
    Então o serviço retorna o código HTTP associado à RN001
    E nenhuma gravação parcial permanece
    E a tentativa recebe correlation_id para auditoria
```

## 7. Dependências e Observações

- **Motor de score PRISMA-EP-01:** origem da decisão, versões e atributos quando aplicável.
- **PRISMA-EP-02-F04:** trilha WORM para operações regulatórias e acessos sensíveis.
- **OIDC/Keycloak EBV:** autenticação, tenant e papéis.
- **PostgreSQL 16:** estado transacional e índices de consulta.
- **Stack específica:** Java 21, Spring Boot 3, PostgreSQL, Amazon SQS, Keycloak.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `POST /api/v1/reviews`

- **Finalidade:** Abre revisão humana de decisão.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decision_id; subject_token; reason; channel. **Body:** JSON conforme DTO específico.
- **Sucesso:** `201 ReviewResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_HUMAN_REVIEWER, ROLE_REVIEW_SUPERVISOR, ROLE_DPO`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/reviews/queue`

- **Finalidade:** Lista fila priorizada por vencimento.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** status; assignee; due_before; page; size. **Body:** Sem body.
- **Sucesso:** `200 ReviewQueuePage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_HUMAN_REVIEWER, ROLE_REVIEW_SUPERVISOR, ROLE_DPO`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `PATCH /api/v1/reviews/{reviewId}/decide`

- **Finalidade:** Registra desfecho fundamentado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** reviewId UUID; outcome; rationale; reviewed_factors[]. **Body:** JSON conforme DTO específico.
- **Sucesso:** `200 ReviewDecisionResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_HUMAN_REVIEWER, ROLE_REVIEW_SUPERVISOR, ROLE_DPO`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `CiclodeVidadaSolicitaodeRevisoRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `CiclodeVidadaSolicitaodeRevisoResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `CiclodeVidadaSolicitaodeRevisoPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_human_review` | Solicitação, prazo, atribuição e estado |
| `tb_review_decision` | Desfecho humano e fundamentação |
| `tb_review_event` | Histórico da máquina de estados |

```sql
-- DDL PRISMA-EP-02-F06 / PRISMA-EP-02-F06-US-BE-01
CREATE TABLE tb_human_review (
  review_id UUID PRIMARY KEY, decision_id UUID NOT NULL, subject_hash CHAR(64) NOT NULL,
  channel VARCHAR(20) NOT NULL, reason TEXT NOT NULL, status VARCHAR(24) NOT NULL,
  assignee_id UUID, due_at TIMESTAMPTZ NOT NULL, escalated_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), version BIGINT NOT NULL DEFAULT 0,
  UNIQUE(decision_id, subject_hash)
);
CREATE INDEX ix_review_queue ON tb_human_review(status, due_at);
CREATE TABLE tb_review_decision (
  review_decision_id UUID PRIMARY KEY, review_id UUID NOT NULL UNIQUE REFERENCES tb_human_review(review_id),
  outcome VARCHAR(12) NOT NULL CHECK (outcome IN ('MAINTAIN','REFORM')),
  rationale TEXT NOT NULL, reviewed_factors JSONB NOT NULL,
  reviewer_id UUID NOT NULL, decided_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE tb_review_event (
  event_id UUID PRIMARY KEY, review_id UUID NOT NULL REFERENCES tb_human_review(review_id),
  from_status VARCHAR(24), to_status VARCHAR(24) NOT NULL, actor_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL, metadata JSONB NOT NULL
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Prazo legal de resposta | Iniciar prazo na abertura e escalar ao supervisor quando restarem menos de 24 horas. | `422` |
| **RN002** | Fundamentação obrigatória | Manutenção ou reforma exige justificativa textual e vínculo aos fatores revisados. | `422` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
CiclodeVidadaSolicitaçãodeRevisãoController
  └─ CiclodeVidadaSolicitaçãodeRevisãoService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbHumanReviewRepository
      ├─ AuditTrailPort
      └─ IntegrationPorts
```

- **Controller:** mapeia HTTP/DTO, aplica Bean Validation, paginação e headers; não contém regra de domínio.
- **Service:** coordena transação, estado, idempotência, RNs e publicação pela outbox.
- **Repository:** consultas por tenant e índices declarados; optimistic locking nas mutações concorrentes.
- **Ports/Adapters:** interfaces para integrações; timeouts, circuit breaker e telemetria sem PII.
- **Exception handler:** converte exceções tipadas para `ApiError`, preserva `correlation_id` e oculta stack trace.

### 8.6 Segurança e autorizações

| Controle | Especificação |
|---|---|
| AuthN | OAuth2/OIDC, JWT Bearer RS256/ES256, audiência `prisma-api`, expiração máxima 15 min |
| AuthZ | RBAC: `ROLE_SUBJECT, ROLE_HUMAN_REVIEWER, ROLE_REVIEW_SUPERVISOR, ROLE_DPO`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Explicação F01/F02 | Contexto consolidado do revisor | timeout 500 ms; cache por snapshot |
| Amazon SQS | Escalonamento e notificação | DLQ; retry exponencial 5x |
| Canal Art.18 F08 | Notificação do desfecho | idempotência por review_id |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Abertura inicia prazo e estado OPEN | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Fila ordena menor due_at primeiro | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Decisão sem justificativa retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Revisão já decidida retorna 409 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Menos de 24h gera escalonamento | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Desfecho grava WORM e notifica titular | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Revisor sem atribuição recebe 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Concorrência é bloqueada por optimistic lock | Resultado, persistência e efeitos observáveis conferidos |

Execução com Testcontainers PostgreSQL, WireMock para ports HTTP/gRPC, LocalStack quando houver AWS e testes de contrato OpenAPI. Meta: 85% de linhas no Service/DomainPolicy e 100% das RNs.

## 9. Checklist Gate G5

- [x] US-ID, título e story preservados da fonte
- [x] Todos os endpoints da feature documentados
- [x] Request, response, DTOs e exemplos específicos
- [x] HTTP 400, 401, 403, 404, 409, 422, 429, 500 e 503 tratados
- [x] DDL PostgreSQL executável e modelo específico
- [x] RN001 e RN002 preservadas; regras transversais numeradas
- [x] Controller, Service, Repository e Ports definidos
- [x] Segurança, autorização, integrações e resiliência definidas
- [x] 8 testes verificáveis (mínimo 6)
- [x] Critérios canônicos e Gherkin rastreáveis

## 10. Resumo

| Métrica | Valor |
|---|---:|
| Endpoints | 3 |
| Tabelas | 3 |
| Regras numeradas | 4 |
| Critérios preservados | 6 |
| Testes | 8 |

**Status:** Pronta para desenvolvimento e Gate G5 aprovado.

---

_Documento elaborado com persona **Escritor Back** · PRISMA-EP-02 · 2026-07-27_
