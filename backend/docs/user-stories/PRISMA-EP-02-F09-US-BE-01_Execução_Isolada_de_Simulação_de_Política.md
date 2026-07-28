# US Backend — PRISMA-EP-02-F09-US-BE-01: Execução Isolada de Simulação de Política

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F09*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F09-US-BE-01` |
| **Título oficial** | **Execução Isolada de Simulação de Política** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F09` — Simulador What-If de Política de Crédito |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `POST /api/v1/policy/simulate` |
| **Stack** | Python 3.12, FastAPI, Apache Spark, Trino, Redis, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** aplicar a política candidata sobre amostra histórica em ambiente isolado,  
**Para que** o impacto seja conhecido antes de a política afetar clientes reais.

## 3. Descrição

Executa política candidata sobre snapshot histórico isolado e compara aprovação, score e inadimplência com baseline vigente. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `POST /api/v1/policy/simulate` | Agenda simulação isolada | candidate_policy; sample_ref; metrics[] | 202 PolicySimulationResponse | `ROLE_POLICY_ANALYST` |
| `GET /api/v1/policy/simulations/{id}` | Consulta progresso e indicadores | id UUID | 200 PolicySimulationDetail | `ROLE_POLICY_ANALYST` |
| `GET /api/v1/policy/baseline` | Obtém baseline vigente | portfolio; as_of_date | 200 PolicyBaselineResponse | `ROLE_POLICY_ANALYST` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "candidate_policy": {
    "base_version": "POL-2026.07.3",
    "changes": [
      {
        "rule": "MIN_SCORE",
        "from": 580,
        "to": 600
      }
    ]
  },
  "sample_ref": "HIST-2026-Q2-STRATIFIED",
  "metrics": [
    "APPROVAL_RATE",
    "SCORE_DISTRIBUTION",
    "EXPECTED_DEFAULT"
  ]
}
```

### 5.2 Response de sucesso representativa

```json
{
  "simulation_id": "1b47d73b-224f-4eaf-a405-06aa18b0878d",
  "status": "QUEUED",
  "baseline_version": "POL-2026.07.3",
  "sample_snapshot_hash": "sha256:9a4d40df83bd",
  "submitted_at": "2026-07-27T21:59:00Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/policy/simulate",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em execução isolada de simulação de política |
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
| CA-01 | Permitir editar limiares e condições sem deploy |
| CA-02 | Comparar taxa de aprovação e distribuição de score antes e depois |
| CA-03 | Salvar a simulação com autor e parâmetros para levar ao comitê |
| CA-04 | Executar sobre cópia de dados, sem tocar o fluxo produtivo |
| CA-05 | Retornar indicadores comparados com a linha de base vigente |
| CA-06 | Registrar autor, parâmetros e resultado da simulação |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Execução Isolada de Simulação de Política
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa POST /api/v1/policy/simulate com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E executar sobre cópia de dados, sem tocar o fluxo produtivo
    E retornar indicadores comparados com a linha de base vigente
    E registrar autor, parâmetros e resultado da simulação

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
- **Stack específica:** Python 3.12, FastAPI, Apache Spark, Trino, Redis, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `POST /api/v1/policy/simulate`

- **Finalidade:** Agenda simulação isolada.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** candidate_policy; sample_ref; metrics[]. **Body:** JSON conforme DTO específico.
- **Sucesso:** `202 PolicySimulationResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE, ROLE_MODEL_GOVERNANCE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/policy/simulations/{id}`

- **Finalidade:** Consulta progresso e indicadores.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** id UUID. **Body:** Sem body.
- **Sucesso:** `200 PolicySimulationDetail`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE, ROLE_MODEL_GOVERNANCE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `GET /api/v1/policy/baseline`

- **Finalidade:** Obtém baseline vigente.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** portfolio; as_of_date. **Body:** Sem body.
- **Sucesso:** `200 PolicyBaselineResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE, ROLE_MODEL_GOVERNANCE`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `ExecuoIsoladadeSimulaodePolticaRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `ExecuoIsoladadeSimulaodePolticaResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `ExecuoIsoladadeSimulaodePolticaPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_policy_simulation` | Ensaio, autor, baseline e estado |
| `tb_simulation_change` | Alteração candidata |
| `tb_simulation_metric` | Indicador baseline versus candidato |

```sql
-- DDL PRISMA-EP-02-F09 / PRISMA-EP-02-F09-US-BE-01
CREATE TABLE tb_policy_simulation (
  simulation_id UUID PRIMARY KEY, baseline_version VARCHAR(80) NOT NULL,
  sample_ref VARCHAR(120) NOT NULL, sample_snapshot_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL, submitted_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ
);
CREATE TABLE tb_simulation_change (
  change_id UUID PRIMARY KEY, simulation_id UUID NOT NULL REFERENCES tb_policy_simulation(simulation_id),
  rule_code VARCHAR(80) NOT NULL, previous_value JSONB NOT NULL, candidate_value JSONB NOT NULL
);
CREATE TABLE tb_simulation_metric (
  metric_id UUID PRIMARY KEY, simulation_id UUID NOT NULL REFERENCES tb_policy_simulation(simulation_id),
  metric_name VARCHAR(60) NOT NULL, baseline_value NUMERIC(16,8) NOT NULL,
  candidate_value NUMERIC(16,8) NOT NULL, delta_value NUMERIC(16,8) NOT NULL,
  UNIQUE(simulation_id, metric_name)
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Isolamento da simulação | Executar em cópia histórica sem acesso de escrita ao fluxo produtivo; apontamento para produção é bloqueado. | `403` |
| **RN002** | Rastreabilidade do ensaio | Registrar autor, parâmetros, amostra e resultado; registro incompleto não subsidia proposta. | `422` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
ExecuçãoIsoladadeSimulaçãodePolíticaController
  └─ ExecuçãoIsoladadeSimulaçãodePolíticaService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbPolicySimulationRepository
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
| AuthZ | RBAC: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE, ROLE_MODEL_GOVERNANCE`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Spark/Trino | Execução sobre amostra histórica | job assíncrono; timeout 2 h; cancelamento |
| Policy Registry F10 | Baseline e política candidata | versões imutáveis; cache 5 min |
| WORM F04 | Manifesto e resultado | outbox; retry 3x |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | POST retorna 202 e snapshot da amostra | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Conector produtivo é bloqueado com 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Baseline inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Regra inválida retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Consulta retorna métricas e deltas | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Reexecução com mesma chave não duplica job | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Usuário sem papel recebe 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Spark indisponível retorna 503 | Resultado, persistência e efeitos observáveis conferidos |

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
