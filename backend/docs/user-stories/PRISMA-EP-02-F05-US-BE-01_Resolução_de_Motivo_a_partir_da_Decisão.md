# US Backend — PRISMA-EP-02-F05-US-BE-01: Resolução de Motivo a partir da Decisão

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F05*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F05-US-BE-01` |
| **Título oficial** | **Resolução de Motivo a partir da Decisão** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F05` — Catálogo de Motivos de Recusa em Linguagem Natural |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `GET /api/v1/reasons/resolve/{decisionId}` |
| **Stack** | Java 21, Spring Boot 3, PostgreSQL, Drools, Redis |

## 2. User Story

**Como** sistema,  
**Quero** converter os fatores técnicos da decisão em motivos do catálogo aprovado,  
**Para que** todo canal comunique a recusa com a mesma linguagem revisada.

## 3. Descrição

Mantém motivos versionados, exige aprovação jurídica e resolve fatores SHAP para texto consistente por canal. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/reasons` | Lista versões e estados do catálogo | status; channel; valid_at; page; size | 200 ReasonPage | `ROLE_LEGAL_EDITOR` |
| `POST /api/v1/reasons` | Cria nova versão de motivo | code; consumer_text; analyst_text; mappings[] | 201 ReasonVersionResponse | `ROLE_LEGAL_EDITOR` |
| `GET /api/v1/reasons/resolve/{decisionId}` | Resolve motivos aprovados para decisão | decisionId UUID; channel APP|PORTAL|LETTER | 200 ResolvedReasonsResponse | `ROLE_LEGAL_EDITOR` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "code": "UTILIZATION_HIGH",
  "consumer_text": "O uso recente do limite está elevado em relação à sua capacidade atual.",
  "analyst_text": "Utilização de crédito nos últimos 90 dias acima da faixa da política.",
  "channels": [
    "APP",
    "PORTAL",
    "LETTER"
  ],
  "mappings": [
    {
      "attribute_code": "UTILIZATION_90D",
      "direction": "NEGATIVE",
      "minimum_magnitude": 0.18
    }
  ]
}
```

### 5.2 Response de sucesso representativa

```json
{
  "reason_version_id": "5169c440-47e9-4fcb-96ad-7fa986a38efb",
  "code": "UTILIZATION_HIGH",
  "version": 4,
  "status": "DRAFT",
  "legal_approval": null,
  "created_at": "2026-07-27T21:02:00Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/reasons/resolve/{decisionId}",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em resolução de motivo a partir da decisão |
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
| CA-01 | Exibir o texto atual e o proposto lado a lado |
| CA-02 | Registrar aprovador, data e comentário da revisão |
| CA-03 | Pré-visualizar como o texto aparece em cada canal |
| CA-04 | Servir apenas motivos com aprovação jurídica vigente |
| CA-05 | Retornar o código estável e a versão do texto utilizada |
| CA-06 | Registrar na trilha de auditoria o motivo comunicado |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Resolução de Motivo a partir da Decisão
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa GET /api/v1/reasons/resolve/{decisionId} com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E servir apenas motivos com aprovação jurídica vigente
    E retornar o código estável e a versão do texto utilizada
    E registrar na trilha de auditoria o motivo comunicado

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
- **Stack específica:** Java 21, Spring Boot 3, PostgreSQL, Drools, Redis.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/reasons`

- **Finalidade:** Lista versões e estados do catálogo.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** status; channel; valid_at; page; size. **Body:** Sem body.
- **Sucesso:** `200 ReasonPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_LEGAL_EDITOR, ROLE_LEGAL_APPROVER, ROLE_CREDIT_ANALYST, SCOPE_REASON_READ`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `POST /api/v1/reasons`

- **Finalidade:** Cria nova versão de motivo.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** code; consumer_text; analyst_text; mappings[]. **Body:** JSON conforme DTO específico.
- **Sucesso:** `201 ReasonVersionResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_LEGAL_EDITOR, ROLE_LEGAL_APPROVER, ROLE_CREDIT_ANALYST, SCOPE_REASON_READ`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `GET /api/v1/reasons/resolve/{decisionId}`

- **Finalidade:** Resolve motivos aprovados para decisão.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decisionId UUID; channel APP|PORTAL|LETTER. **Body:** Sem body.
- **Sucesso:** `200 ResolvedReasonsResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_LEGAL_EDITOR, ROLE_LEGAL_APPROVER, ROLE_CREDIT_ANALYST, SCOPE_REASON_READ`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `ResoluodeMotivoapartirdaDecisoRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `ResoluodeMotivoapartirdaDecisoResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `ResoluodeMotivoapartirdaDecisoPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_reason` | Código estável do motivo |
| `tb_reason_version` | Texto versionado e aprovação jurídica |
| `tb_reason_mapping` | Regra fator-direção-magnitude |

```sql
-- DDL PRISMA-EP-02-F05 / PRISMA-EP-02-F05-US-BE-01
CREATE TABLE tb_reason (
  reason_id UUID PRIMARY KEY, code VARCHAR(60) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE tb_reason_version (
  reason_version_id UUID PRIMARY KEY, reason_id UUID NOT NULL REFERENCES tb_reason(reason_id),
  version INTEGER NOT NULL, consumer_text TEXT NOT NULL, analyst_text TEXT NOT NULL,
  channels JSONB NOT NULL, approval_status VARCHAR(20) NOT NULL,
  approved_by UUID, approved_at TIMESTAMPTZ, valid_from TIMESTAMPTZ,
  UNIQUE(reason_id, version)
);
CREATE TABLE tb_reason_mapping (
  mapping_id UUID PRIMARY KEY, reason_version_id UUID NOT NULL REFERENCES tb_reason_version(reason_version_id),
  attribute_code VARCHAR(80) NOT NULL, direction VARCHAR(8) NOT NULL,
  minimum_magnitude NUMERIC(10,6) NOT NULL, priority SMALLINT NOT NULL
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Aprovação jurídica obrigatória | Texto sem aprovação permanece em rascunho e não é servido em produção. | `422` |
| **RN002** | Estabilidade do código do motivo | Alteração cria nova versão; novo código exige depreciação com convivência controlada. | `409` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
ResoluçãodeMotivoapartirdaDecisãoController
  └─ ResoluçãodeMotivoapartirdaDecisãoService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbReasonRepository
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
| AuthZ | RBAC: `ROLE_LEGAL_EDITOR, ROLE_LEGAL_APPROVER, ROLE_CREDIT_ANALYST, SCOPE_REASON_READ`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Explicação F01 | Fatores persistidos da decisão | timeout 300 ms; sem recálculo |
| Drools | Resolução por direção, magnitude e prioridade | ruleset versionado; rollback |
| WORM F04 | Motivo e versão comunicados | fail-closed no canal externo |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Criação gera versão DRAFT | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Resolução ignora texto sem aprovação | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Código duplicado retorna 409 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Decisão inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Canal não suportado retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Resposta contém código e versão exatos | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Comunicação registra evento WORM | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Editor sem papel de aprovador recebe 403 | Resultado, persistência e efeitos observáveis conferidos |

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
