# US Backend — PRISMA-EP-02-F08-US-BE-01: Ciclo de Vida da Requisição de Direito

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F08*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F08-US-BE-01` |
| **Título oficial** | **Ciclo de Vida da Requisição de Direito** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F08` — Fila de Requisições de Titular (LGPD Art. 18) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `PATCH /api/v1/subject-requests/{id}` |
| **Stack** | Java 21, Spring Boot 3, PostgreSQL, Amazon SQS, Keycloak |

## 2. User Story

**Como** sistema,  
**Quero** controlar identificação, prazo, tratativa e resposta de cada pedido,  
**Para que** a EBV comprove atendimento tempestivo dos direitos do titular.

## 3. Descrição

Centraliza direitos LGPD, valida identidade, calcula prazo por tipo e conserva resposta formal na trilha. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `POST /api/v1/subject-requests` | Registra exercício de direito | right_type; subject_token; channel; description | 201 SubjectRequestResponse | `ROLE_SUBJECT` |
| `GET /api/v1/subject-requests` | Lista fila por prazo e estado | right_type; status; due_before; page; size | 200 SubjectRequestPage | `ROLE_SUBJECT` |
| `PATCH /api/v1/subject-requests/{id}` | Registra tratativa e resposta | id UUID; action; response_summary; attachment_id | 200 SubjectRequestResponse | `ROLE_SUBJECT` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "action": "COMPLETE",
  "response_summary": "Relatório de acesso disponibilizado em área autenticada.",
  "attachment_id": "e1792c5b-2202-4820-b328-f765c35d8cff",
  "notification_channel": "PORTAL"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "request_id": "66f7aa2a-2fe8-4978-b54d-7dfe763ddfe1",
  "right_type": "ACCESS",
  "identity_status": "VERIFIED",
  "status": "COMPLETED",
  "due_at": "2026-08-11T21:44:00Z",
  "completed_at": "2026-07-27T21:44:00Z",
  "audit_event_id": "6477a950-3ab3-474f-ba05-8373eb3f0267"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/subject-requests/{id}",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em ciclo de vida da requisição de direito |
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
| CA-01 | Exibir requisições ordenadas por prazo restante |
| CA-02 | Destacar as atrasadas e as próximas do vencimento |
| CA-03 | Permitir registrar a tratativa e anexar a resposta enviada |
| CA-04 | Exigir identificação confirmada antes de expor qualquer dado |
| CA-05 | Aplicar o prazo legal correspondente ao tipo de direito |
| CA-06 | Registrar a resposta enviada na trilha de auditoria |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Ciclo de Vida da Requisição de Direito
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa PATCH /api/v1/subject-requests/{id} com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E exigir identificação confirmada antes de expor qualquer dado
    E aplicar o prazo legal correspondente ao tipo de direito
    E registrar a resposta enviada na trilha de auditoria

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

#### 8.1.1 `POST /api/v1/subject-requests`

- **Finalidade:** Registra exercício de direito.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** right_type; subject_token; channel; description. **Body:** JSON conforme DTO específico.
- **Sucesso:** `201 SubjectRequestResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_DPO, ROLE_PRIVACY_ANALYST`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/subject-requests`

- **Finalidade:** Lista fila por prazo e estado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** right_type; status; due_before; page; size. **Body:** Sem body.
- **Sucesso:** `200 SubjectRequestPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_DPO, ROLE_PRIVACY_ANALYST`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `PATCH /api/v1/subject-requests/{id}`

- **Finalidade:** Registra tratativa e resposta.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** id UUID; action; response_summary; attachment_id. **Body:** JSON conforme DTO específico.
- **Sucesso:** `200 SubjectRequestResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_SUBJECT, ROLE_DPO, ROLE_PRIVACY_ANALYST`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `CiclodeVidadaRequisiodeDireitoRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `CiclodeVidadaRequisiodeDireitoResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `CiclodeVidadaRequisiodeDireitoPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_subject_request` | Pedido, identidade, prazo e estado |
| `tb_subject_request_action` | Tratativa e transição |
| `tb_subject_response_artifact` | Resposta protegida ao titular |

```sql
-- DDL PRISMA-EP-02-F08 / PRISMA-EP-02-F08-US-BE-01
CREATE TABLE tb_subject_request (
  request_id UUID PRIMARY KEY, subject_hash CHAR(64) NOT NULL,
  right_type VARCHAR(32) NOT NULL, channel VARCHAR(20) NOT NULL,
  description TEXT NOT NULL, identity_status VARCHAR(20) NOT NULL,
  status VARCHAR(24) NOT NULL, due_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ,
  protocol VARCHAR(60) NOT NULL UNIQUE
);
CREATE INDEX ix_subject_request_due ON tb_subject_request(status, due_at);
CREATE TABLE tb_subject_request_action (
  action_id UUID PRIMARY KEY, request_id UUID NOT NULL REFERENCES tb_subject_request(request_id),
  action_type VARCHAR(32) NOT NULL, actor_id UUID NOT NULL,
  summary TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE tb_subject_response_artifact (
  artifact_id UUID PRIMARY KEY, request_id UUID NOT NULL REFERENCES tb_subject_request(request_id),
  object_key TEXT NOT NULL UNIQUE, content_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Identificação do titular | Identidade deve ser confirmada antes de expor dado pessoal; pendência não revela conteúdo. | `403` |
| **RN002** | Prazo por tipo de direito | Aplicar prazo legal correspondente e escalar ao DPO quando restarem 48 horas. | `422` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
CiclodeVidadaRequisiçãodeDireitoController
  └─ CiclodeVidadaRequisiçãodeDireitoService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbSubjectRequestRepository
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
| AuthZ | RBAC: `ROLE_SUBJECT, ROLE_DPO, ROLE_PRIVACY_ANALYST`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Identity Proofing | Confirma titularidade por token | timeout 3 s; fail-closed; circuit breaker |
| Amazon SQS | Escalonamentos e comunicações | DLQ; retry exponencial |
| WORM F04 | Abertura, acesso e resposta | operação concluída somente após confirmação |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Abertura gera protocolo e prazo correto | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Identidade pendente impede resposta com 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Fila ordena por vencimento | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Conclusão sem anexo obrigatório retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Requisição concluída retorna 409 em nova conclusão | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Resposta registra evento WORM | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | ID inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Identity Proofing indisponível retorna 503 | Resultado, persistência e efeitos observáveis conferidos |

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
