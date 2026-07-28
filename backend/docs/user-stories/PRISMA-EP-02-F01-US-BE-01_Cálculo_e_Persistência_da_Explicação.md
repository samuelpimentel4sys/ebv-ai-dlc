# US Backend — PRISMA-EP-02-F01-US-BE-01: Cálculo e Persistência da Explicação

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F01*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F01-US-BE-01` |
| **Título oficial** | **Cálculo e Persistência da Explicação** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F01` — API de Explicabilidade SHAP em Tempo Real |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `GET /api/v1/explain/{decisionId}` |
| **Stack** | Python 3.12, FastAPI, SHAP TreeExplainer, ONNX Runtime, Redis, Amazon EKS, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** calcular as contribuições por atributo junto com a decisão e gravá-las no snapshot,  
**Para que** a explicação seja sempre idêntica à que vigorou no momento da decisão.

## 3. Descrição

Calcula TreeSHAP no caminho da decisão, ordena contribuições e conserva o resultado imutável para consultas regulatórias. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/explain/{decisionId}` | Obtém snapshot explicativo consolidado | decisionId UUID no path; includeLabels boolean | 200 ExplainResponse | `SCOPE_EXPLAIN_READ` |
| `POST /api/v1/explain/batch` | Consulta explicações de até 100 decisões | decision_ids UUID[]; include_factors boolean | 200 BatchExplainResponse | `SCOPE_EXPLAIN_READ` |
| `GET /api/v1/explain/{decisionId}/factors` | Lista fatores ordenados por magnitude | decisionId UUID; direction POSITIVE|NEGATIVE; limit 1..20 | 200 FactorPageResponse | `SCOPE_EXPLAIN_READ` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "decision_id": "9f18e4c2-2a43-4ff0-b70d-c6b8d1a25377",
  "include_labels": true,
  "requested_purpose": "ATENDIMENTO_ART20"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "decision_id": "9f18e4c2-2a43-4ff0-b70d-c6b8d1a25377",
  "model_version": "credit-xgb-4.8.2",
  "policy_version": "POL-2026.07.3",
  "base_value": 612.4,
  "score": 548,
  "snapshot_hash": "sha256:4b89a1d0c772",
  "factors": [
    {
      "attribute_code": "UTILIZATION_90D",
      "business_label": "Uso recente do limite",
      "value": 0.84,
      "shap_value": -47.3,
      "direction": "NEGATIVE"
    }
  ],
  "generated_at": "2026-07-27T20:15:03Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/explain/{decisionId}",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em cálculo e persistência da explicação |
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
| CA-01 | Ordenar os fatores por magnitude de contribuição |
| CA-02 | Distinguir contribuição positiva e negativa |
| CA-03 | Traduzir o nome técnico do atributo para rótulo de negócio |
| CA-04 | Concluir o cálculo dentro da fatia de orçamento de latência alocada |
| CA-05 | Persistir a explicação no snapshot imutável da decisão |
| CA-06 | Servir sempre a versão persistida, sem recálculo posterior |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Cálculo e Persistência da Explicação
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa GET /api/v1/explain/{decisionId} com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E concluir o cálculo dentro da fatia de orçamento de latência alocada
    E persistir a explicação no snapshot imutável da decisão
    E servir sempre a versão persistida, sem recálculo posterior

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
- **Stack específica:** Python 3.12, FastAPI, SHAP TreeExplainer, ONNX Runtime, Redis, Amazon EKS, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/explain/{decisionId}`

- **Finalidade:** Obtém snapshot explicativo consolidado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decisionId UUID no path; includeLabels boolean. **Body:** Sem body.
- **Sucesso:** `200 ExplainResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `SCOPE_EXPLAIN_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SYSTEM_SCORE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `POST /api/v1/explain/batch`

- **Finalidade:** Consulta explicações de até 100 decisões.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decision_ids UUID[]; include_factors boolean. **Body:** JSON conforme DTO específico.
- **Sucesso:** `200 BatchExplainResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `SCOPE_EXPLAIN_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SYSTEM_SCORE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `GET /api/v1/explain/{decisionId}/factors`

- **Finalidade:** Lista fatores ordenados por magnitude.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decisionId UUID; direction POSITIVE|NEGATIVE; limit 1..20. **Body:** Sem body.
- **Sucesso:** `200 FactorPageResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `SCOPE_EXPLAIN_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SYSTEM_SCORE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `ClculoePersistnciadaExplicaoRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `ClculoePersistnciadaExplicaoResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `ClculoePersistnciadaExplicaoPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_explanation_snapshot` | Snapshot SHAP imutável por decisão |
| `tb_explanation_factor` | Contribuição individual e rótulo de negócio |

```sql
-- DDL PRISMA-EP-02-F01 / PRISMA-EP-02-F01-US-BE-01
CREATE TABLE tb_explanation_snapshot (
  explanation_id UUID PRIMARY KEY, decision_id UUID NOT NULL UNIQUE,
  model_version VARCHAR(80) NOT NULL, policy_version VARCHAR(80) NOT NULL,
  base_value NUMERIC(12,6) NOT NULL, resulting_score INTEGER NOT NULL,
  snapshot_hash CHAR(64) NOT NULL UNIQUE, status VARCHAR(24) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL, correlation_id UUID NOT NULL
);
CREATE TABLE tb_explanation_factor (
  factor_id UUID PRIMARY KEY, explanation_id UUID NOT NULL REFERENCES tb_explanation_snapshot(explanation_id),
  attribute_code VARCHAR(80) NOT NULL, business_label VARCHAR(160) NOT NULL,
  observed_value JSONB NOT NULL, shap_value NUMERIC(14,8) NOT NULL,
  direction VARCHAR(8) NOT NULL CHECK (direction IN ('POSITIVE','NEGATIVE')),
  magnitude_rank SMALLINT NOT NULL, UNIQUE (explanation_id, attribute_code)
);
CREATE INDEX ix_explanation_factor_rank ON tb_explanation_factor(explanation_id, magnitude_rank);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Explicação solidária à decisão | Calcular e persistir a explicação no mesmo snapshot da decisão; falha marca a decisão como não explicável e aciona compliance. | `503` |
| **RN002** | Consistência entre explicação e resultado | Servir sempre a explicação persistida, sem recálculo; divergência de hash bloqueia a resposta e abre incidente. | `409` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
CálculoePersistênciadaExplicaçãoController
  └─ CálculoePersistênciadaExplicaçãoService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbExplanationSnapshotRepository
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
| AuthZ | RBAC: `SCOPE_EXPLAIN_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SYSTEM_SCORE`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Motor de score PRISMA-EP-01 | gRPC: decisão, vetor de atributos e versões | 150 ms; retry somente antes de confirmação; circuit breaker |
| Redis | Cache por decisionId + snapshot_hash | TTL 15 min; fallback PostgreSQL |
| WORM F04 | Registro do hash e acesso | fail-closed em escrita regulatória |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Cálculo TreeSHAP persiste snapshot e fatores ordenados | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Consulta devolve exatamente o hash persistido | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Batch com 101 IDs retorna 400 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Decisão inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Divergência entre score e snapshot retorna 409 | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Falha do explicador retorna 503 e gera alerta | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | JWT sem escopo retorna 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | p95 do cálculo respeita orçamento de latência | Resultado, persistência e efeitos observáveis conferidos |

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
| Tabelas | 2 |
| Regras numeradas | 4 |
| Critérios preservados | 6 |
| Testes | 8 |

**Status:** Pronta para desenvolvimento e Gate G5 aprovado.

---

_Documento elaborado com persona **Escritor Back** · PRISMA-EP-02 · 2026-07-27_
