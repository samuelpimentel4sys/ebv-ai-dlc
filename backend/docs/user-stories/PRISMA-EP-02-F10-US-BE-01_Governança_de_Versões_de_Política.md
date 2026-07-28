# US Backend — PRISMA-EP-02-F10-US-BE-01: Governança de Versões de Política

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F10*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F10-US-BE-01` |
| **Título oficial** | **Governança de Versões de Política** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F10` — Versionamento de Política e Diff Explicável |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `POST /api/v1/policy/versions/{id}/publish` |
| **Stack** | Java 21, Spring Boot 3, Git, PostgreSQL, Drools, Redis |

## 2. User Story

**Como** sistema,  
**Quero** versionar cada publicação de política de forma imutável e rastreável,  
**Para que** toda decisão seja associável à regra exata que a produziu.

## 3. Descrição

Versiona política com aprovação formal, publica artefato imutável e produz diff técnico traduzido para efeito de negócio. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `GET /api/v1/policy/versions` | Lista versões e estados | status; author; from; to; page; size | 200 PolicyVersionPage | `ROLE_POLICY_ANALYST` |
| `GET /api/v1/policy/versions/{a}/diff/{b}` | Compara versões com efeito de negócio | a e b UUID; include_unchanged boolean | 200 PolicyDiffResponse | `ROLE_POLICY_ANALYST` |
| `POST /api/v1/policy/versions/{id}/publish` | Publica versão aprovada e imutável | id UUID; approval_id; effective_at; release_note | 201 PublishedPolicyResponse | `ROLE_POLICY_ANALYST` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "approval_id": "COMMITTEE-2026-07-42",
  "effective_at": "2026-08-01T00:00:00Z",
  "release_note": "Elevação do score mínimo para reduzir inadimplência esperada.",
  "expected_draft_hash": "sha256:ba8b932e41cf"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "policy_version_id": "c3387f74-7101-4366-90fb-d1e577caa1f2",
  "version": "POL-2026.08.1",
  "status": "PUBLISHED",
  "artifact_hash": "sha256:251a163d0df0",
  "git_commit": "f71a05cd4a6e",
  "approved_by": "committee:2026-07-42",
  "effective_at": "2026-08-01T00:00:00Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/policy/versions/{id}/publish",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em governança de versões de política |
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
| CA-01 | Exibir as alterações lado a lado com destaque visual |
| CA-02 | Traduzir cada mudança técnica para efeito de negócio |
| CA-03 | Mostrar autor, aprovador e data de cada versão |
| CA-04 | Exigir aprovação registrada do comitê para publicar |
| CA-05 | Impedir alteração de versão já publicada |
| CA-06 | Expor a versão vigente para gravação no snapshot da decisão |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Governança de Versões de Política
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa POST /api/v1/policy/versions/{id}/publish com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E exigir aprovação registrada do comitê para publicar
    E impedir alteração de versão já publicada
    E expor a versão vigente para gravação no snapshot da decisão

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
- **Stack específica:** Java 21, Spring Boot 3, Git, PostgreSQL, Drools, Redis.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `GET /api/v1/policy/versions`

- **Finalidade:** Lista versões e estados.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** status; author; from; to; page; size. **Body:** Sem body.
- **Sucesso:** `200 PolicyVersionPage`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE_APPROVER, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/policy/versions/{a}/diff/{b}`

- **Finalidade:** Compara versões com efeito de negócio.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** a e b UUID; include_unchanged boolean. **Body:** Sem body.
- **Sucesso:** `200 PolicyDiffResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE_APPROVER, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `POST /api/v1/policy/versions/{id}/publish`

- **Finalidade:** Publica versão aprovada e imutável.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** id UUID; approval_id; effective_at; release_note. **Body:** JSON conforme DTO específico.
- **Sucesso:** `201 PublishedPolicyResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE_APPROVER, ROLE_INTERNAL_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `GovernanadeVersesdePolticaRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `GovernanadeVersesdePolticaResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `GovernanadeVersesdePolticaPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_policy_version` | Versão, hash, autoria e vigência |
| `tb_policy_approval` | Aprovação formal do comitê |
| `tb_policy_diff` | Diferenças técnicas e efeitos de negócio |

```sql
-- DDL PRISMA-EP-02-F10 / PRISMA-EP-02-F10-US-BE-01
CREATE TABLE tb_policy_version (
  policy_version_id UUID PRIMARY KEY, version_code VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL, artifact_hash CHAR(64) NOT NULL UNIQUE,
  git_commit CHAR(40) NOT NULL UNIQUE, author_id UUID NOT NULL,
  effective_at TIMESTAMPTZ, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE tb_policy_approval (
  approval_id VARCHAR(80) PRIMARY KEY, policy_version_id UUID NOT NULL REFERENCES tb_policy_version(policy_version_id),
  committee_date DATE NOT NULL, approved_by JSONB NOT NULL, minutes_hash CHAR(64) NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE tb_policy_diff (
  diff_id UUID PRIMARY KEY, from_version_id UUID NOT NULL REFERENCES tb_policy_version(policy_version_id),
  to_version_id UUID NOT NULL REFERENCES tb_policy_version(policy_version_id),
  changes_json JSONB NOT NULL, business_effects JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL, UNIQUE(from_version_id, to_version_id)
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Imutabilidade da versão publicada | Versão publicada não pode ser alterada; mudança exige nova versão e tentativa é auditada. | `409` |
| **RN002** | Vínculo obrigatório com a decisão | Toda decisão grava versão vigente; ausência bloqueia resposta do motor. | `422` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
GovernançadeVersõesdePolíticaController
  └─ GovernançadeVersõesdePolíticaService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbPolicyVersionRepository
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
| AuthZ | RBAC: `ROLE_POLICY_ANALYST, ROLE_CREDIT_COMMITTEE_APPROVER, ROLE_INTERNAL_AUDITOR`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Git | Fonte da verdade do artefato de política | commit assinado; branch protegida |
| Drools | Validação e compilação da versão | sandbox; timeout 30 s; rollback |
| Motor de score PRISMA-EP-01 | Consulta da versão vigente | cache 60 s; fail-closed sem versão |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Publicação aprovada cria versão imutável | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | Aprovação inexistente retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Hash divergente retorna 409 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Versão publicada não aceita alteração | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Diff retorna efeitos de negócio | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Decisão consulta versão vigente | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Aprovador sem papel recebe 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | Git indisponível retorna 503 sem publicação parcial | Resultado, persistência e efeitos observáveis conferidos |

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
