# US Backend — PRISMA-EP-06-F05-US-BE-01: Motor de Regras de Gamificação

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F05*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F05-US-BE-01
Título oficial:  Motor de Regras de Gamificação
Feature:         PRISMA-EP-06-F05 — Motor de Missões e Recompensas Não Financeiras
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F05-US-FE-01 — Participação nas Missões
Endpoint âncora: POST /api/v1/missions/{id}/progress
Stack feature:   Spring Boot 3, Drools, Redis, PostgreSQL, React Native
Tabelas DDL:     tb_mission_catalog, tb_mission_enrollment, tb_mission_progress_event, tb_mission_achievement
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F05-US-BE-01` |
| **Título** | **Motor de Regras de Gamificação** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F05` — Motor de Missões e Recompensas Não Financeiras |
| **US-FE relacionada** | `PRISMA-EP-06-F05-US-FE-01` — Participação nas Missões |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** avaliar eventos do titular contra as regras das missões e apurar progresso,  
**Para que** a mecânica evolua por configuração e não por novo desenvolvimento.

---

## 3. Descrição

Sustentar a mecânica de gamificação com um motor configurável de missões, progresso e reconhecimento.

Esta US Backend implementa a capacidade de serviço da feature **Motor de Missões e Recompensas Não Financeiras**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/missions/{id}/progress`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_MISSION_ADMIN`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Spring Boot 3, Drools, Redis, PostgreSQL, React Native`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `GET /api/v1/missions` | Lista missões elegíveis do titular | ROLE_TITULAR_B2C | M |
| `POST /api/v1/missions/{id}/progress` | Apura progresso a partir de evento verificado | ROLE_TITULAR_B2C | G |
| `GET /api/v1/missions/achievements` | Conquistas simbólicas do titular | ROLE_TITULAR_B2C | P |

---

## 5. Contrato (Prévia) — POST /api/v1/missions/{id}/progress

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "verified_event_type": "UTILITY_PAYMENT_ON_TIME",
  "verified_event_id": "9f8e7d6c-5b4a-3210-9876-543210fedcba",
  "delta_pct": 25.0
}
```

### Response 200/201 (exemplo)

```json
{
  "enrollment_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "mission_id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
  "progress_pct": 50.0,
  "status": "ACTIVE",
  "fraud_flag": false
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/missions/{id}/progress",
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

- Reconhecer progresso somente com evento verificado
- Permitir criar e ajustar missões sem deploy
- Reverter avanço obtido por manipulação

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Motor de Regras de Gamificação
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/missions/{id}/progress com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F05-US-FE-01 |
| Stack | Spring Boot 3, Drools, Redis, PostgreSQL, React Native |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_TITULAR_B2C, ROLE_MISSION_ADMIN`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/missions/{id}/progress`
- **Controller:** `MissionController`
- **Service:** `MissionRulesEngineService` (`@Transactional` em escritas)
- **Repository:** `MissionEnrollmentRepository`

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
| `tb_mission_catalog` | Catálogo configurável de missões |
| `tb_mission_enrollment` | Inscrição do titular em missão |
| `tb_mission_progress_event` | Eventos de progresso verificados |
| `tb_mission_achievement` | Conquistas simbólicas |

```sql
-- DDL PRISMA-EP-06-F05 / PRISMA-EP-06-F05-US-BE-01
CREATE TABLE tb_mission_catalog (
  mission_id          UUID PRIMARY KEY,
  code                VARCHAR(40) NOT NULL UNIQUE,
  title               VARCHAR(200) NOT NULL,
  rules_json          JSONB NOT NULL,
  reward_type         VARCHAR(30) NOT NULL DEFAULT 'SYMBOLIC',
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  version             INTEGER NOT NULL DEFAULT 1,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_mission_enrollment (
  enrollment_id       UUID PRIMARY KEY,
  mission_id          UUID NOT NULL REFERENCES tb_mission_catalog(mission_id),
  documento_hash      CHAR(64) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','COMPLETED','REVOKED')),
  progress_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mission_id, documento_hash)
);

CREATE TABLE tb_mission_progress_event (
  event_id            UUID PRIMARY KEY,
  enrollment_id       UUID NOT NULL REFERENCES tb_mission_enrollment(enrollment_id),
  verified_event_type VARCHAR(40) NOT NULL,
  verified_event_id   UUID NOT NULL,
  delta_pct           NUMERIC(5,2) NOT NULL,
  fraud_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, verified_event_id)
);

CREATE TABLE tb_mission_achievement (
  achievement_id      UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  mission_id          UUID NOT NULL REFERENCES tb_mission_catalog(mission_id),
  code                VARCHAR(40) NOT NULL,
  title               VARCHAR(200) NOT NULL,
  earned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_mission_ach_doc ON tb_mission_achievement (documento_hash, earned_at DESC);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Progresso baseado em evento real | Apuração de avanço em missão | Reconhecer progresso apenas a partir de evento verificado do titular | Avanço sem evento correspondente é revertido e registrado como tentativa de manipulação | 422 |
| **RN002** | Privacidade do progresso | Exibição de conquistas | Manter o progresso visível somente ao próprio titular | Compartilhamento voluntário exige ação explícita e não expõe valores de dívida | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
MissionController          // @RestController — mapeia HTTP ↔ DTO
  └─ MissionRulesEngineService        // @Service — RN + @Transactional
       ├─ MissionEnrollmentRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Spring Boot 3, Drools, Redis, PostgreSQL, React Native`).

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
| Drools / Rules Engine | Avaliação configurável de missões | hot-reload sem deploy |
| Event Store (Kafka) | Eventos verificados do titular | idempotência por event_id |
| Redis | Cache de catálogo ativo | TTL 60s |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Progresso só com evento verificado (RN-01) | Pass |
| 02 | CT-02 Evento duplicado não incrementa (idempotência) | Pass |
| 03 | CT-03 Manipulação marca fraud_flag e reverte (RN-01) | Pass |
| 04 | CT-04 GET achievements privado ao titular (RN-02) | Pass |
| 05 | CT-05 Catálogo atualizado sem deploy (version bump) | Pass |
| 06 | CT-06 404 missão inexistente / 409 enrollment inválido | Pass |

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
| Entidades/tabelas | 4 |
| RNs documentadas | 4 |
| Testes | 6 |
| Complexidade | G |

**Status:** Pronta para desenvolvimento ✅

---

_Documento elaborado com agente **Escritor Back** (BMAD UpStream) · PRISMA-EP-06 · 2026-07-27_
