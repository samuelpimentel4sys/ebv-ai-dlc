# US Backend — PRISMA-EP-02-F04-US-BE-01: Gravação Imutável da Trilha

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F04*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F04-US-BE-01` |
| **Título oficial** | **Gravação Imutável da Trilha** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F04` — Trilha de Auditoria Regulatória WORM |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `GET /api/v1/audit/trail` |
| **Stack** | Java 21, Spring Boot 3, Amazon S3 Object Lock, Amazon QLDB, Amazon Athena, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** persistir cada evento de auditoria em armazenamento inviolável,  
**Para que** a EBV comprove conformidade sem depender da boa-fé do sistema.

## 3. Descrição

Registra eventos encadeados por hash em armazenamento WORM e exporta recortes assinados para auditoria. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/audit/trail` | Pesquisa eventos com paginação | subject_hash; actor_id; event_type; from; to; page; size | 200 AuditTrailPage | `ROLE_COMPLIANCE_AUDITOR` |
| `GET /api/v1/audit/trail/{documento}` | Consulta eventos vinculados ao titular | documento tokenizado; from; to | 200 AuditTrailPage | `ROLE_COMPLIANCE_AUDITOR` |
| `POST /api/v1/audit/export` | Exporta recorte com manifesto assinado | filters; format CSV|JSON; purpose | 202 AuditExportResponse | `ROLE_COMPLIANCE_AUDITOR` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "filters": {
    "event_types": [
      "DOSSIER_ISSUED",
      "HUMAN_REVIEW_DECIDED"
    ],
    "from": "2026-07-01T00:00:00Z",
    "to": "2026-07-27T23:59:59Z"
  },
  "format": "JSON",
  "purpose": "AUDITORIA_ANPD"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "export_id": "81ae2da9-0734-49a5-bb45-1b2bfbb3dd82",
  "status": "PROCESSING",
  "manifest_hash": "sha256:aa1a0d916ff3",
  "retention_until": "2033-07-27",
  "requested_at": "2026-07-27T20:45:00Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/audit/trail",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em gravação imutável da trilha |
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
| CA-01 | Filtrar por titular, ator, tipo de evento e intervalo de datas |
| CA-02 | Exibir o resultado paginado com carimbo de tempo preciso |
| CA-03 | Exportar o recorte consultado com manifesto e hash |
| CA-04 | Impedir alteração ou exclusão dentro do prazo legal de guarda |
| CA-05 | Registrar ator, finalidade e carimbo de tempo em cada evento |
| CA-06 | Bloquear a operação de origem quando a gravação da trilha falhar |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Gravação Imutável da Trilha
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa GET /api/v1/audit/trail com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E impedir alteração ou exclusão dentro do prazo legal de guarda
    E registrar ator, finalidade e carimbo de tempo em cada evento
    E bloquear a operação de origem quando a gravação da trilha falhar

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
- **Stack específica:** Java 21, Spring Boot 3, Amazon S3 Object Lock, Amazon QLDB, Amazon Athena, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/audit/trail`

- **Finalidade:** Pesquisa eventos com paginação.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** subject_hash; actor_id; event_type; from; to; page; size. **Body:** Sem body.
- **Sucesso:** `200 AuditTrailPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_COMPLIANCE_AUDITOR, ROLE_DPO, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/audit/trail/{documento}`

- **Finalidade:** Consulta eventos vinculados ao titular.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** documento tokenizado; from; to. **Body:** Sem body.
- **Sucesso:** `200 AuditTrailPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_COMPLIANCE_AUDITOR, ROLE_DPO, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `POST /api/v1/audit/export`

- **Finalidade:** Exporta recorte com manifesto assinado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** filters; format CSV|JSON; purpose. **Body:** JSON conforme DTO específico.
- **Sucesso:** `202 AuditExportResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_COMPLIANCE_AUDITOR, ROLE_DPO, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `GravaoImutveldaTrilhaRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `GravaoImutveldaTrilhaResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `GravaoImutveldaTrilhaPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_audit_event_index` | Índice pesquisável do evento WORM |
| `tb_audit_export` | Exportação, filtros e manifesto assinado |

```sql
-- DDL PRISMA-EP-02-F04 / PRISMA-EP-02-F04-US-BE-01
CREATE TABLE tb_audit_event_index (
  event_id UUID PRIMARY KEY, event_type VARCHAR(60) NOT NULL,
  subject_hash CHAR(64), actor_id UUID NOT NULL, purpose VARCHAR(120) NOT NULL,
  resource_type VARCHAR(60) NOT NULL, resource_id VARCHAR(100) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL, previous_hash CHAR(64), event_hash CHAR(64) NOT NULL UNIQUE,
  worm_object_key TEXT NOT NULL UNIQUE, retention_until DATE NOT NULL
);
CREATE INDEX ix_audit_subject_time ON tb_audit_event_index(subject_hash, occurred_at DESC);
CREATE INDEX ix_audit_actor_time ON tb_audit_event_index(actor_id, occurred_at DESC);
CREATE TABLE tb_audit_export (
  export_id UUID PRIMARY KEY, requester_id UUID NOT NULL, purpose VARCHAR(120) NOT NULL,
  filters_json JSONB NOT NULL, format VARCHAR(8) NOT NULL, status VARCHAR(20) NOT NULL,
  manifest_hash CHAR(64) NOT NULL UNIQUE, object_key TEXT, created_at TIMESTAMPTZ NOT NULL
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Imutabilidade do registro | Persistir com bloqueio de objeto; falha na gravação bloqueia a operação de origem. | `503` |
| **RN002** | Registro de acesso a dado sensível | Registrar ator, finalidade, decisão e carimbo de tempo; ator não identificado é recusado. | `401` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
GravaçãoImutáveldaTrilhaController
  └─ GravaçãoImutáveldaTrilhaService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbAuditEventIndexRepository
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
| AuthZ | RBAC: `ROLE_COMPLIANCE_AUDITOR, ROLE_DPO, ROLE_INTERNAL_AUDITOR`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| S3 Object Lock | Payload canônico em compliance mode | retenção mínima 7 anos; versioning; fail-closed |
| Amazon QLDB | Encadeamento criptográfico | retry 3x com idempotency key |
| Amazon Athena | Consulta analítica de exportações | timeout 30 s; execução assíncrona |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Evento gravado possui hash encadeado | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Tentativa de exclusão é negada pelo Object Lock | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Pesquisa combina ator, tipo e datas | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Exportação inclui manifesto verificável | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Ator ausente retorna 401 | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Intervalo inválido retorna 400 | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Falha WORM bloqueia operação com 503 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Acesso sem papel de auditor retorna 403 | Resultado, persistência e efeitos observáveis conferidos |

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
