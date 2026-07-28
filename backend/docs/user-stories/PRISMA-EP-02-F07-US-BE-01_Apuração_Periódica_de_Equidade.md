# US Backend — PRISMA-EP-02-F07-US-BE-01: Apuração Periódica de Equidade

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F07*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F07-US-BE-01` |
| **Título oficial** | **Apuração Periódica de Equidade** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F07` — Monitoramento de Viés e Fairness do Modelo |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `POST /api/v1/fairness/analyze` |
| **Stack** | Python 3.12, FastAPI, Fairlearn, Apache Airflow, Amazon Athena, Grafana, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** calcular métricas de disparidade por grupo sobre as decisões emitidas,  
**Para que** o viés seja detectado por medição e não por denúncia externa.

## 3. Descrição

Calcula paridade demográfica e igualdade de oportunidade por versão e abre alertas conforme limites aprovados. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/fairness/metrics` | Consulta métricas por versão e recorte | model_version; metric; segment; from; to | 200 FairnessMetricPage | `ROLE_MODEL_GOVERNANCE` |
| `GET /api/v1/fairness/alerts` | Lista alertas de disparidade | severity; status; model_version; page; size | 200 FairnessAlertPage | `ROLE_MODEL_GOVERNANCE` |
| `POST /api/v1/fairness/analyze` | Executa apuração governada | model_version; window; segments[]; metrics[] | 202 FairnessRunResponse | `ROLE_MODEL_GOVERNANCE` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "model_version": "credit-xgb-4.8.2",
  "window": {
    "from": "2026-06-01",
    "to": "2026-06-30"
  },
  "segments": [
    "REGION_PROXY",
    "AGE_BAND_AUDIT"
  ],
  "metrics": [
    "DEMOGRAPHIC_PARITY",
    "EQUAL_OPPORTUNITY"
  ],
  "threshold_profile": "COMMITTEE-2026-02"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "run_id": "3ef568e0-31dd-4b2e-9d09-18f3331ca85e",
  "status": "QUEUED",
  "model_version": "credit-xgb-4.8.2",
  "threshold_profile": "COMMITTEE-2026-02",
  "submitted_at": "2026-07-27T21:32:00Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/fairness/analyze",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em apuração periódica de equidade |
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
| CA-01 | Exibir métricas por grupo e por versão de modelo |
| CA-02 | Destacar cruzamentos do limite aprovado |
| CA-03 | Permitir exportar o recorte para a ata do comitê |
| CA-04 | Impedir uso de atributo sensível como entrada do modelo |
| CA-05 | Calcular as métricas por versão de modelo e recorte configurado |
| CA-06 | Abrir alerta automático ao ultrapassar o limite aprovado |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Apuração Periódica de Equidade
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa POST /api/v1/fairness/analyze com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E impedir uso de atributo sensível como entrada do modelo
    E calcular as métricas por versão de modelo e recorte configurado
    E abrir alerta automático ao ultrapassar o limite aprovado

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
- **Stack específica:** Python 3.12, FastAPI, Fairlearn, Apache Airflow, Amazon Athena, Grafana, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/fairness/metrics`

- **Finalidade:** Consulta métricas por versão e recorte.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** model_version; metric; segment; from; to. **Body:** Sem body.
- **Sucesso:** `200 FairnessMetricPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_MODEL_GOVERNANCE, ROLE_DPO, ROLE_DATA_SCIENTIST, ROLE_COMMITTEE_MEMBER`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/fairness/alerts`

- **Finalidade:** Lista alertas de disparidade.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** severity; status; model_version; page; size. **Body:** Sem body.
- **Sucesso:** `200 FairnessAlertPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_MODEL_GOVERNANCE, ROLE_DPO, ROLE_DATA_SCIENTIST, ROLE_COMMITTEE_MEMBER`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `POST /api/v1/fairness/analyze`

- **Finalidade:** Executa apuração governada.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** model_version; window; segments[]; metrics[]. **Body:** JSON conforme DTO específico.
- **Sucesso:** `202 FairnessRunResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_MODEL_GOVERNANCE, ROLE_DPO, ROLE_DATA_SCIENTIST, ROLE_COMMITTEE_MEMBER`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `ApuraoPeridicadeEquidadeRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `ApuraoPeridicadeEquidadeResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `ApuraoPeridicadeEquidadePageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_fairness_run` | Execução, janela e versão avaliada |
| `tb_fairness_metric` | Métrica por grupo e referência |
| `tb_fairness_alert` | Alerta, severidade e tratamento |

```sql
-- DDL PRISMA-EP-02-F07 / PRISMA-EP-02-F07-US-BE-01
CREATE TABLE tb_fairness_run (
  run_id UUID PRIMARY KEY, model_version VARCHAR(80) NOT NULL,
  window_start DATE NOT NULL, window_end DATE NOT NULL,
  threshold_profile VARCHAR(60) NOT NULL, status VARCHAR(20) NOT NULL,
  submitted_by UUID NOT NULL, submitted_at TIMESTAMPTZ NOT NULL,
  CHECK (window_end >= window_start)
);
CREATE TABLE tb_fairness_metric (
  metric_id UUID PRIMARY KEY, run_id UUID NOT NULL REFERENCES tb_fairness_run(run_id),
  metric_name VARCHAR(60) NOT NULL, segment_name VARCHAR(80) NOT NULL,
  group_code VARCHAR(80) NOT NULL, metric_value NUMERIC(12,8) NOT NULL,
  approved_limit NUMERIC(12,8) NOT NULL, exceeded BOOLEAN NOT NULL
);
CREATE TABLE tb_fairness_alert (
  alert_id UUID PRIMARY KEY, metric_id UUID NOT NULL REFERENCES tb_fairness_metric(metric_id),
  severity VARCHAR(12) NOT NULL, status VARCHAR(20) NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL, committee_case_id VARCHAR(80)
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Separação entre medir e decidir | Atributos sensíveis servem somente à medição; presença no vetor do modelo bloqueia promoção. | `422` |
| **RN002** | Limite de disparidade | Excesso abre alerta; valor acima do dobro do limite suspende promoção de versão. | `409` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
ApuraçãoPeriódicadeEquidadeController
  └─ ApuraçãoPeriódicadeEquidadeService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbFairnessRunRepository
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
| AuthZ | RBAC: `ROLE_MODEL_GOVERNANCE, ROLE_DPO, ROLE_DATA_SCIENTIST, ROLE_COMMITTEE_MEMBER`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Athena | Amostra de decisões e resultados observados | timeout 60 s; execução assíncrona |
| Fairlearn | Cálculo determinístico das métricas | imagem versionada; seed fixa |
| Comitê de modelos | Abertura de caso por alerta | outbox; retry 5x; DLQ |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Run válido retorna 202 | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Janela invertida retorna 400 | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Atributo sensível no vetor decisório retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Métrica acima do limite abre alerta | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Dobro do limite bloqueia promoção | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Versão inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Perfil de limite inativo retorna 409 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Usuário sem governança recebe 403 | Resultado, persistência e efeitos observáveis conferidos |

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
