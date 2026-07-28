# US Backend — PRISMA-EP-06-F04-US-BE-01: Ciclo de Vida do Consentimento

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F04*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F04-US-BE-01
Título oficial:  Ciclo de Vida do Consentimento
Feature:         PRISMA-EP-06-F04 — Consentimento Granular e Gestão de Opt-in
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F04-US-FE-01 — Gestão das Minhas Permissões
Endpoint âncora: POST /api/v1/consents
Stack feature:   Spring Boot 3, PostgreSQL, Amazon QLDB, React Native, Keycloak
Tabelas DDL:     tb_consent, tb_consent_event, tb_consent_propagation
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F04-US-BE-01` |
| **Título** | **Ciclo de Vida do Consentimento** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F04` — Consentimento Granular e Gestão de Opt-in |
| **US-FE relacionada** | `PRISMA-EP-06-F04-US-FE-01` — Gestão das Minhas Permissões |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** registrar de forma imutável cada concessão e revogação e propagá-las,  
**Para que** o uso de dado alternativo tenha base legal demonstrável.

---

## 3. Descrição

Construir a base legal do épico com consentimento específico, granular e revogável a qualquer tempo.

Esta US Backend implementa a capacidade de serviço da feature **Consentimento Granular e Gestão de Opt-in**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/consents`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_CONSENT_ADMIN, ROLE_PRIVACY_OPS`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Spring Boot 3, PostgreSQL, Amazon QLDB, React Native, Keycloak`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `POST /api/v1/consents` | Registra consentimento granular por finalidade/fonte | ROLE_TITULAR_B2C | G |
| `GET /api/v1/consents/{documento}` | Lista consentimentos ativos e histórico | ROLE_TITULAR_B2C | M |
| `DELETE /api/v1/consents/{consentId}` | Revoga consentimento e propaga evento | ROLE_TITULAR_B2C | G |

---

## 5. Contrato (Prévia) — POST /api/v1/consents

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "documento": "12345678901",
  "items": [
    {
      "purpose_code": "UTILITIES_SCORE",
      "source_code": "CEMIG-MG",
      "accepted": true,
      "valid_to": "2027-07-27T00:00:00Z"
    },
    {
      "purpose_code": "MARKETPLACE_SHARE",
      "source_code": "APP_B2C",
      "accepted": false
    }
  ],
  "channel": "MOBILE_APP",
  "version_termo": "v3.2"
}
```

### Response 200/201 (exemplo)

```json
{
  "consents": [
    {
      "consent_id": "c0ffee00-0000-4000-8000-000000000001",
      "purpose_code": "UTILITIES_SCORE",
      "source_code": "CEMIG-MG",
      "status": "ACTIVE",
      "granted_at": "2026-07-27T22:10:00Z"
    }
  ],
  "immutable_event_ids": [
    "e1000000-0000-4000-8000-000000000001"
  ]
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/consents",
  "details": [{ "field": "campo", "message": "obrigatório", "rejectedValue": null }]
}
```

| HTTP | Quando |
|---|---|
| 400 | Payload inválido / validação de formato |
| 401 | JWT ausente ou inválido |
| 403 | Sem role necessária ou violação de ownership |
| 404 | Recurso não encontrado |
| 409 | Conflito de estado / duplicidade |
| 422 | Regra de negócio violada |
| 429 | Rate limit excedido |
| 500 | Erro inesperado |
| 503 | Dependência externa indisponível |

---

## 6. Critérios de Aceite

- Registrar consentimento separado por finalidade e fonte
- Propagar a revogação aos consumidores em até 24 horas
- Manter trilha imutável de cada evento de consentimento

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Ciclo de Vida do Consentimento
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/consents com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F04-US-FE-01 |
| Stack | Spring Boot 3, PostgreSQL, Amazon QLDB, React Native, Keycloak |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_TITULAR_B2C, ROLE_CONSENT_ADMIN, ROLE_PRIVACY_OPS`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/consents`
- **Controller:** `ConsentController`
- **Service:** `ConsentLifecycleService` (`@Transactional` em escritas)
- **Repository:** `ConsentRepository`

Demais endpoints da feature herdam o mesmo envelope de erro e padrão de segurança.

### 8.2 Request / Response Schemas (DTOs)

| DTO | Direção | Campos-chave |
|---|---|---|
| Request do endpoint âncora | In | Ver JSON da §5 |
| Response do endpoint âncora | Out | Ver JSON da §5 |
| `ApiError` | Out | `timestamp, status, error, message, path, details[]` |

Validações típicas: `@NotNull`, `@Size`, `@Pattern` (documento 11 dígitos quando aplicável), enums fechados, UUID em path params.

### 8.3 Modelo de Dados (DDL PostgreSQL)

| Tabela | Propósito |
|---|---|
| `tb_consent` | Consentimento vigente por finalidade/fonte |
| `tb_consent_event` | Trilha imutável de concessão/revogação |
| `tb_consent_propagation` | Status de propagação aos consumidores |

```sql
-- DDL PRISMA-EP-06-F04 / PRISMA-EP-06-F04-US-BE-01
CREATE TABLE tb_consent (
  consent_id          UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  purpose_code        VARCHAR(40) NOT NULL,
  source_code         VARCHAR(40) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')),
  granted_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  valid_to            TIMESTAMPTZ,
  channel             VARCHAR(30) NOT NULL,
  version_termo       VARCHAR(20) NOT NULL,
  UNIQUE (documento_hash, purpose_code, source_code, status)
);
CREATE INDEX ix_consent_doc_status ON tb_consent (documento_hash, status);

CREATE TABLE tb_consent_event (
  event_id            UUID PRIMARY KEY,
  consent_id          UUID NOT NULL,
  event_type          VARCHAR(20) NOT NULL CHECK (event_type IN ('GRANTED','REVOKED','EXPIRED','UPDATED')),
  payload_json        JSONB NOT NULL,
  hash_chain          CHAR(64) NOT NULL,
  prev_hash           CHAR(64),
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_consent_event_consent ON tb_consent_event (consent_id, occurred_at);

CREATE TABLE tb_consent_propagation (
  propagation_id      UUID PRIMARY KEY,
  consent_id          UUID NOT NULL REFERENCES tb_consent(consent_id),
  consumer_code       VARCHAR(40) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','SENT','ACK','FAILED')),
  deadline_at         TIMESTAMPTZ NOT NULL,
  sent_at             TIMESTAMPTZ,
  acked_at            TIMESTAMPTZ
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Granularidade obrigatória | Coleta de consentimento do titular | Permitir aceitar ou recusar cada finalidade e fonte separadamente | Recusa de todas as finalidades encerra o fluxo sem penalizar o titular | 422 |
| **RN002** | Efeito imediato da revogação | Revogação de consentimento | Interromper o uso do dado e propagar a revogação aos consumidores em até 24 horas | Dado já usado em decisão emitida permanece no snapshot por obrigação legal, com marcação da revogação | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
ConsentController          // @RestController — mapeia HTTP ↔ DTO
  └─ ConsentLifecycleService        // @Service — RN + @Transactional
       ├─ ConsentRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Spring Boot 3, PostgreSQL, Amazon QLDB, React Native, Keycloak`).

### 8.6 Segurança e Autorizações

| Prática | Definição |
|---|---|
| AuthN | JWT Bearer (OIDC) |
| AuthZ | RBAC + ownership do `documento` do titular |
| Dados | CPF apenas como hash (`documento_hash`) em repouso |
| Transporte | TLS 1.2+ |
| LGPD | Consentimento F04 como pré-condição quando houver utilities/score/marketplace |
| Rate limit | Headers `X-RateLimit-*` |

### 8.7 Integrações

| Integração | Uso | Resiliência |
|---|---|---|
| Amazon QLDB / ledger | Append-only da trilha de eventos | fail-closed em escrita |
| Kafka consent.revoked | Propagação aos consumidores (F01/F02/F07) | SLA 24h |
| Keycloak / IdP | Autenticação titular B2C | OIDC |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 POST consents granulares por finalidade/fonte (RN-01) | Pass |
| 02 | CT-02 Recusa de todas as finalidades encerra sem penalidade | Pass |
| 03 | CT-03 DELETE revoga e cria evento imutável | Pass |
| 04 | CT-04 Propagação marcada PENDING com deadline 24h (RN-02) | Pass |
| 05 | CT-05 GET lista ativos + histórico | Pass |
| 06 | CT-06 Tentativa de alterar evento passado retorna 409/405 | Pass |

**Meta de cobertura:** >80% linhas do service + contratos RestAssured/WebTestClient.

---

## 9. Checklist de Qualidade (Gate G5)

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa (endpoints, DTOs, DDL, RN, camadas, segurança, integrações, testes)
- [x] Todos endpoints da feature listados
- [x] Códigos HTTP mapeados
- [x] RNs explícitas com HTTP
- [x] ≥5 cenários de teste
- [x] Exemplos request/response
- [x] US-FE pareada rastreável
- [x] Sem estimativa proibida além do indicativo SP

---

## 10. Resumo Executivo

| Métrica | Valor |
|---|---|
| Endpoints | 3 |
| Entidades/tabelas | 3 |
| RNs documentadas | 4 |
| Testes | 6 |
| Complexidade | G |

**Status:** Pronta para desenvolvimento ✅

---

_Documento elaborado com agente **Escritor Back** (BMAD UpStream) · PRISMA-EP-06 · 2026-07-27_
