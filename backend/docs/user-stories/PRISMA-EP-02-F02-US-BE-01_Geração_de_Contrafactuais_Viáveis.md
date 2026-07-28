# US Backend — PRISMA-EP-02-F02-US-BE-01: Geração de Contrafactuais Viáveis

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F02*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F02-US-BE-01` |
| **Título oficial** | **Geração de Contrafactuais Viáveis** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F02` — Motor de Razões Contrafactuais Acionáveis |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `GET /api/v1/counterfactual/{decisionId}` |
| **Stack** | Python 3.12, FastAPI, DiCE, ONNX Runtime, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** calcular as alterações mínimas em atributos acionáveis que mudariam a decisão,  
**Para que** a explicação vire orientação prática e reduza a percepção de arbitrariedade.

## 3. Descrição

Produz alternativas viáveis com DiCE, exclui atributos imutáveis e ordena ações por esforço estimado. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/counterfactual/{decisionId}` | Obtém recomendações persistidas | decisionId UUID; max_actions 1..5 | 200 CounterfactualResponse | `SCOPE_COUNTERFACTUAL_READ` |
| `POST /api/v1/counterfactual/simulate` | Simula alteração hipotética acionável | decision_id; changes[]; target_band | 200 CounterfactualSimulationResponse | `SCOPE_COUNTERFACTUAL_READ` |

**Total da feature:** 2 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "decision_id": "af4267b1-05cf-4543-ab46-a14f268fd68d",
  "changes": [
    {
      "attribute_code": "CREDIT_UTILIZATION",
      "proposed_value": 0.45
    }
  ],
  "target_band": "MEDIUM_RISK"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "decision_id": "af4267b1-05cf-4543-ab46-a14f268fd68d",
  "viable": true,
  "estimated_score_range": {
    "min": 610,
    "max": 635
  },
  "actions": [
    {
      "reason_code": "REDUCE_UTILIZATION",
      "action_text": "Reduzir a utilização do limite para faixa entre 40% e 50%",
      "effort_rank": 1,
      "typical_effect_days": 35
    }
  ],
  "disclaimer_version": "LEGAL-CF-3"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/counterfactual/{decisionId}",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em geração de contrafactuais viáveis |
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
| CA-01 | Apresentar no máximo cinco ações ordenadas por facilidade |
| CA-02 | Expressar o efeito estimado em faixa, sem prometer aprovação |
| CA-03 | Indicar o prazo típico para cada ação surtir efeito |
| CA-04 | Considerar apenas atributos marcados como acionáveis no catálogo |
| CA-05 | Ordenar as sugestões por esforço estimado do titular |
| CA-06 | Recusar geração quando não houver contrafactual viável, com motivo explícito |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Geração de Contrafactuais Viáveis
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa GET /api/v1/counterfactual/{decisionId} com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E considerar apenas atributos marcados como acionáveis no catálogo
    E ordenar as sugestões por esforço estimado do titular
    E recusar geração quando não houver contrafactual viável, com motivo explícito

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
- **Stack específica:** Python 3.12, FastAPI, DiCE, ONNX Runtime, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/counterfactual/{decisionId}`

- **Finalidade:** Obtém recomendações persistidas.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decisionId UUID; max_actions 1..5. **Body:** Sem body.
- **Sucesso:** `200 CounterfactualResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `SCOPE_COUNTERFACTUAL_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SUBJECT`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `POST /api/v1/counterfactual/simulate`

- **Finalidade:** Simula alteração hipotética acionável.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decision_id; changes[]; target_band. **Body:** JSON conforme DTO específico.
- **Sucesso:** `200 CounterfactualSimulationResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `SCOPE_COUNTERFACTUAL_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SUBJECT`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `GeraodeContrafactuaisViveisRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `GeraodeContrafactuaisViveisResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `GeraodeContrafactuaisViveisPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_counterfactual_set` | Conjunto calculado para decisão e modelo |
| `tb_counterfactual_action` | Ação acionável, faixa e esforço |

```sql
-- DDL PRISMA-EP-02-F02 / PRISMA-EP-02-F02-US-BE-01
CREATE TABLE tb_counterfactual_set (
  set_id UUID PRIMARY KEY, decision_id UUID NOT NULL, model_version VARCHAR(80) NOT NULL,
  target_band VARCHAR(40) NOT NULL, viable BOOLEAN NOT NULL, failure_reason VARCHAR(160),
  disclaimer_version VARCHAR(40) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(decision_id, model_version, target_band)
);
CREATE TABLE tb_counterfactual_action (
  action_id UUID PRIMARY KEY, set_id UUID NOT NULL REFERENCES tb_counterfactual_set(set_id),
  attribute_code VARCHAR(80) NOT NULL, proposed_range JSONB NOT NULL,
  reason_code VARCHAR(60) NOT NULL, action_text TEXT NOT NULL,
  effort_rank SMALLINT NOT NULL CHECK (effort_rank BETWEEN 1 AND 5),
  typical_effect_days INTEGER NOT NULL CHECK (typical_effect_days > 0)
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Acionabilidade obrigatória | Restringir sugestões a atributos sob controle do titular; idade e demais atributos imutáveis são excluídos e registrados. | `422` |
| **RN002** | Vedação de promessa de resultado | Expressar efeito como estimativa e faixa; conteúdo com garantia de aprovação é bloqueado. | `422` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
GeraçãodeContrafactuaisViáveisController
  └─ GeraçãodeContrafactuaisViáveisService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbCounterfactualSetRepository
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
| AuthZ | RBAC: `SCOPE_COUNTERFACTUAL_READ, ROLE_CREDIT_ANALYST, ROLE_DPO, ROLE_SUBJECT`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Motor de score PRISMA-EP-01 | Avalia candidato no mesmo modelo da decisão | 300 ms; circuit breaker; sem troca de versão |
| Catálogo de atributos | Acionabilidade, faixas permitidas e custo | cache 10 min; fail-closed |
| WORM F04 | Registra recomendação comunicada | retry 3x; operação de comunicação bloqueada |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Gera até cinco ações viáveis ordenadas | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Exclui idade de todas as recomendações | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Texto de garantia é rejeitado com 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Decisão inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Ausência de solução retorna viable=false com motivo | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Mudança fora da faixa aceita retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | JWT de outro titular retorna 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Timeout do motor retorna 503 | Resultado, persistência e efeitos observáveis conferidos |

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
| Endpoints | 2 |
| Tabelas | 2 |
| Regras numeradas | 4 |
| Critérios preservados | 6 |
| Testes | 8 |

**Status:** Pronta para desenvolvimento e Gate G5 aprovado.

---

_Documento elaborado com persona **Escritor Back** · PRISMA-EP-02 · 2026-07-27_
