# US Backend — PRISMA-EP-02-F03-US-BE-01: Geração do Dossiê Regulatório

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA**  
> **Fonte canônica:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F03*.md`

## 1. Identificação

| Item | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-02-F03-US-BE-01` |
| **Título oficial** | **Geração do Dossiê Regulatório** |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Épico** | PRISMA-EP-02 — Motor de Decisão Explicável & Trilha Regulatória |
| **Feature** | `PRISMA-EP-02-F03` — Emissor de Dossiê LGPD Art. 20 em Menos de 10 Segundos |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Status** | Pronta para desenvolvimento |
| **Endpoint âncora** | `POST /api/v1/dossier` |
| **Stack** | Java 21, Spring Boot 3, Apache PDFBox, Thymeleaf, Amazon S3 Object Lock, Redis, PostgreSQL |

## 2. User Story

**Como** sistema,  
**Quero** compor o documento formal a partir do snapshot, explicação e contrafactuais persistidos,  
**Para que** a EBV responda a questionamentos regulatórios com prova reproduzível.

## 3. Descrição

Compõe PDF e JSON assinados a partir de evidências persistidas, com finalidade declarada e SLA p95 inferior a dez segundos. Implementação deve manter contrato versionado em `/api/v1`, rastreabilidade por `X-Correlation-ID`, horários UTC e isolamento por tenant. Nenhum dado regulatório pode ser recalculado quando fonte canônica exigir snapshot persistido.

## 4. Serviços / Endpoints

| Endpoint | Responsabilidade | Request | Sucesso | Permissão mínima |
|---|---|---|---|---|
| `POST /api/v1/dossier` | Emite dossiê regulatório assinado | decision_id; purpose; legal_basis; formats[] | 201 DossierResponse | `ROLE_DPO` |
| `GET /api/v1/dossier/{dossierId}` | Consulta metadados e estado | dossierId UUID | 200 DossierResponse | `ROLE_DPO` |
| `GET /api/v1/dossier/{dossierId}/download` | Baixa artefato por formato | dossierId UUID; format PDF|JSON | 200 application/pdf|json | `ROLE_DPO` |

**Total da feature:** 3 endpoints.

## 5. Contrato prévio — endpoint âncora

### 5.1 Request representativo

```json
{
  "decision_id": "6d4a345f-8263-43fb-aab6-dfa34f712e81",
  "purpose": "RESPOSTA_ANPD",
  "legal_basis": "LGPD_ART20",
  "formats": [
    "PDF",
    "JSON"
  ],
  "protocol": "ANPD-2026-004812"
}
```

### 5.2 Response de sucesso representativa

```json
{
  "dossier_id": "0fdbb065-2a73-4ad8-b6ba-8e403d09ee01",
  "status": "ISSUED",
  "snapshot_hash": "sha256:73ad98be0aa1",
  "document_hash": "sha256:15088b74cd32",
  "formats": [
    "PDF",
    "JSON"
  ],
  "duration_ms": 2840,
  "issued_at": "2026-07-27T20:31:22Z"
}
```

### 5.3 Envelope de erro

```json
{
  "timestamp": "2026-07-27T22:05:00Z",
  "status": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "Operação rejeitada por regra de domínio",
  "path": "/api/v1/dossier",
  "correlation_id": "eb6c5902-a718-41fd-a41b-6bf3f9359b17",
  "violations": [{"rule": "RN001", "message": "Pré-condição regulatória não satisfeita"}]
}
```

| HTTP | Código de domínio | Situação específica |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON, parâmetro, UUID, enum ou intervalo inválido em geração do dossiê regulatório |
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
| CA-01 | Localizar a decisão por decision_id, documento ou protocolo |
| CA-02 | Pré-visualizar o dossiê antes de confirmar a emissão |
| CA-03 | Concluir a emissão em menos de 10 segundos |
| CA-04 | Concluir a geração em menos de 10 segundos no percentil 95 |
| CA-05 | Incluir o hash do snapshot que originou o dossiê |
| CA-06 | Registrar solicitante, finalidade e data da emissão |

### Gherkin

```gherkin
# language: pt
Funcionalidade: Geração do Dossiê Regulatório
  @positivo @backend @regulatorio
  Cenário: Processar fluxo válido da US
    Dado um chamador autenticado com permissão da feature
    E os recursos referenciados existem no mesmo tenant
    Quando o chamador executa POST /api/v1/dossier com entrada válida
    Então o serviço retorna o contrato de sucesso documentado
    E concluir a geração em menos de 10 segundos no percentil 95
    E incluir o hash do snapshot que originou o dossiê
    E registrar solicitante, finalidade e data da emissão

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
- **Stack específica:** Java 21, Spring Boot 3, Apache PDFBox, Thymeleaf, Amazon S3 Object Lock, Redis, PostgreSQL.

## 8. Especificação Detalhada

### 8.1 Endpoints completos

#### 8.1.1 `POST /api/v1/dossier`

- **Finalidade:** Emite dossiê regulatório assinado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** decision_id; purpose; legal_basis; formats[]. **Body:** JSON conforme DTO específico.
- **Sucesso:** `201 DossierResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_DPO, ROLE_LEGAL, ROLE_COMPLIANCE_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.2 `GET /api/v1/dossier/{dossierId}`

- **Finalidade:** Consulta metadados e estado.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** dossierId UUID. **Body:** Sem body.
- **Sucesso:** `200 DossierResponse`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_DPO, ROLE_LEGAL, ROLE_COMPLIANCE_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.

#### 8.1.3 `GET /api/v1/dossier/{dossierId}/download`

- **Finalidade:** Baixa artefato por formato.
- **Headers:** `Authorization: Bearer <jwt>`, `X-Correlation-ID: <uuid>`; escrita exige `Idempotency-Key`.
- **Entrada:** dossierId UUID; format PDF|JSON. **Body:** Sem body.
- **Sucesso:** `200 application/pdf|json`; `X-Correlation-ID` ecoado.
- **AuthZ:** qualquer uma das permissões aplicáveis: `ROLE_DPO, ROLE_LEGAL, ROLE_COMPLIANCE_AUDITOR`; ownership/tenant validado antes do domínio.
- **Falhas aplicáveis:** `400` sintaxe/validação; `401` token inválido; `403` permissão ou ownership; `404` recurso; `409` estado/idempotência; `422` regra de domínio; `429` limite; `500` falha interna; `503` dependência crítica.


### 8.2 DTOs e validações

| DTO | Direção | Atributos e validações |
|---|---|---|
| `GeraodoDossiRegulatrioRequest` | Entrada | Estrutura do exemplo da §5; UUID válido, enums fechados, textos normalizados, coleções com limite explícito |
| `GeraodoDossiRegulatrioResponse` | Saída | Identificadores, estado, versões, hashes e carimbos UTC específicos da operação |
| `GeraodoDossiRegulatrioPageResponse` | Saída | `items[]`, `page`, `size`, `total_elements`, `total_pages` para consultas paginadas |
| `ApiError` | Saída | `timestamp`, `status`, `code`, `message`, `path`, `correlation_id`, `violations[]` |

Regras transversais: rejeitar propriedades desconhecidas em escrita; tamanho máximo de payload 1 MiB; strings UTF-8 sem caracteres de controle; datas ISO-8601 UTC; UUID RFC 4122; paginação padrão `page=0&size=20`, máximo 100.

### 8.3 Modelo de dados e DDL PostgreSQL

| Tabela | Finalidade |
|---|---|
| `tb_regulatory_dossier` | Emissão, finalidade, hash e SLA |
| `tb_dossier_artifact` | Artefato PDF/JSON assinado e bloqueado |

```sql
-- DDL PRISMA-EP-02-F03 / PRISMA-EP-02-F03-US-BE-01
CREATE TABLE tb_regulatory_dossier (
  dossier_id UUID PRIMARY KEY, decision_id UUID NOT NULL, requester_id UUID NOT NULL,
  purpose VARCHAR(80) NOT NULL, legal_basis VARCHAR(40) NOT NULL, protocol VARCHAR(80),
  snapshot_hash CHAR(64) NOT NULL, document_hash CHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL, duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  issued_at TIMESTAMPTZ NOT NULL, correlation_id UUID NOT NULL
);
CREATE TABLE tb_dossier_artifact (
  artifact_id UUID PRIMARY KEY, dossier_id UUID NOT NULL REFERENCES tb_regulatory_dossier(dossier_id),
  format VARCHAR(8) NOT NULL CHECK (format IN ('PDF','JSON')),
  object_key TEXT NOT NULL UNIQUE, content_hash CHAR(64) NOT NULL,
  signature_key_id VARCHAR(120) NOT NULL, retention_until DATE NOT NULL,
  UNIQUE(dossier_id, format)
);
```

Migrações via Flyway, transação única por versão, usuário da aplicação sem permissão de `DROP` ou `ALTER` em produção. Dados pessoais diretos devem ser tokenizados ou convertidos em hash com salt gerenciado.

### 8.4 Regras de negócio numeradas

| ID | Regra | Validação / comportamento | HTTP |
|---|---|---|---:|
| **RN001** | Composição a partir do snapshot | Montar documento exclusivamente com dados persistidos; snapshot ausente impede emissão. | `422` |
| **RN002** | Registro da finalidade | Exigir finalidade declarada e registrar solicitante, data e decisão associada. | `400` |
| **RN003** | Autorização e isolamento | JWT, tenant, finalidade e ownership são validados antes de consultar conteúdo sensível. | `401/403` |
| **RN004** | Idempotência e atomicidade | Escritas repetidas com mesma chave e mesmo hash devolvem resultado original; conteúdo divergente gera conflito; falha produz rollback. | `409/500` |

**Ordem:** formato → autenticação → autorização/tenant → existência → estado/idempotência → RN001/RN002 → integração → persistência → auditoria.

### 8.5 Camadas Controller / Service / Repository / Ports

```text
GeraçãodoDossiêRegulatórioController
  └─ GeraçãodoDossiêRegulatórioService (@Transactional em escrita)
      ├─ DomainPolicy (RN001..RN004)
      ├─ TbRegulatoryDossierRepository
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
| AuthZ | RBAC: `ROLE_DPO, ROLE_LEGAL, ROLE_COMPLIANCE_AUDITOR`; ABAC por tenant, finalidade e ownership |
| Transporte | TLS 1.2+, mTLS entre serviços internos, HSTS |
| Dados | AES-256/KMS em repouso; hash/token para CPF; logs sem payload sensível |
| Escrita | `Idempotency-Key`, CSRF não aplicável a bearer API, mass assignment bloqueado |
| Limite | 60 req/min por usuário em escrita, 120 req/min em leitura; `429` + `Retry-After` |
| Auditoria | acesso, negação, alteração e exportação registrados na F04 |

### 8.7 Integrações e resiliência

| Integração | Uso | Política de resiliência |
|---|---|---|
| Explicação F01 e contrafactuais F02 | Leitura dos snapshots persistidos | timeout 500 ms; sem recálculo; fail-fast |
| Amazon S3 Object Lock | PDF/JSON em modo compliance | SSE-KMS; retry 3x; retenção legal |
| KMS corporativo | Assinatura do manifesto | timeout 1 s; circuit breaker |

Toda chamada propaga `traceparent` e `X-Correlation-ID`. Retry somente para falha transitória e operação idempotente; jitter exponencial; outbox para efeitos assíncronos; `503` quando não existe fallback seguro.

### 8.8 Testes

| ID | Cenário | Asserções mínimas |
|---|---|---|
| CT-01 | Emissão cria PDF e JSON com hashes | Resultado, persistência e efeitos observáveis conferidos |
| CT-02 | p95 de geração fica abaixo de 10 segundos | Resultado, persistência e efeitos observáveis conferidos |
| CT-03 | Snapshot ausente retorna 422 | Resultado, persistência e efeitos observáveis conferidos |
| CT-04 | Finalidade vazia retorna 400 | Resultado, persistência e efeitos observáveis conferidos |
| CT-05 | Dossiê inexistente retorna 404 | Resultado, persistência e efeitos observáveis conferidos |
| CT-06 | Download sem ROLE_LEGAL retorna 403 | Resultado, persistência e efeitos observáveis conferidos |
| CT-07 | Reemissão idempotente retorna mesmo dossiê | Resultado, persistência e efeitos observáveis conferidos |
| CT-08 | S3 indisponível retorna 503 sem emissão parcial | Resultado, persistência e efeitos observáveis conferidos |

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
