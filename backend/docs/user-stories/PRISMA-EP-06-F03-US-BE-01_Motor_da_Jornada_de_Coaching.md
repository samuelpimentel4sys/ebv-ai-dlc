# US Backend — PRISMA-EP-06-F03-US-BE-01: Motor da Jornada de Coaching

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F03*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F03-US-BE-01
Título oficial:  Motor da Jornada de Coaching
Feature:         PRISMA-EP-06-F03 — Coach de Reabilitação Gamificado no App B2C
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F03-US-FE-01 — Jornada de Melhoria do Score
Endpoint âncora: GET /api/v1/coach/journey
Stack feature:   React Native, Redux Toolkit, Spring Boot 3, PostgreSQL, Firebase Cloud Messaging
Tabelas DDL:     tb_coach_journey, tb_coach_goal, tb_coach_progress, tb_coach_notification_pref
Complexidade:    M (~5 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F03-US-BE-01` |
| **Título** | **Motor da Jornada de Coaching** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F03` — Coach de Reabilitação Gamificado no App B2C |
| **US-FE relacionada** | `PRISMA-EP-06-F03-US-FE-01` — Jornada de Melhoria do Score |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **M** (~5 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** montar a trilha, derivar metas dos contrafactuais e apurar o progresso,  
**Para que** a orientação seja personalizada e coerente com a decisão de crédito.

---

## 3. Descrição

Converter a relação negativa com o bureau em jornada de melhoria, orientando o titular com metas e progresso visível.

Esta US Backend implementa a capacidade de serviço da feature **Coach de Reabilitação Gamificado no App B2C**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `GET /api/v1/coach/journey`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_COACH_SERVICE`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`React Native, Redux Toolkit, Spring Boot 3, PostgreSQL, Firebase Cloud Messaging`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `GET /api/v1/coach/journey` | Monta trilha personalizada do titular | ROLE_TITULAR_B2C | M |
| `POST /api/v1/coach/goals` | Define/atualiza metas da jornada | ROLE_TITULAR_B2C | M |
| `GET /api/v1/coach/progress` | Apura progresso e conquistas | ROLE_TITULAR_B2C | P |

---

## 5. Contrato (Prévia) — GET /api/v1/coach/journey

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "goal_type": "QUITAR_DIVIDA",
  "title": "Regularizar fatura de energia em atraso",
  "estimate_text": "Estimativa: +20 a +40 pontos em até 60 dias"
}
```

### Response 200/201 (exemplo)

```json
{
  "journey_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "ACTIVE",
  "goals": [
    {
      "goal_id": "11111111-2222-3333-4444-555555555555",
      "title": "Regularizar fatura de energia em atraso",
      "status": "ACTIVE",
      "estimate_text": "Estimativa: +20 a +40 pontos em até 60 dias"
    }
  ],
  "max_active_goals": 3,
  "active_goals_count": 1
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/coach/journey",
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

- Derivar as metas dos contrafactuais da decisão do titular
- Limitar as metas simultâneas ao máximo configurado
- Bloquear texto que sugira garantia de aprovação

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Motor da Jornada de Coaching
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia GET /api/v1/coach/journey com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F03-US-FE-01 |
| Stack | React Native, Redux Toolkit, Spring Boot 3, PostgreSQL, Firebase Cloud Messaging |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_TITULAR_B2C, ROLE_COACH_SERVICE`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `GET /api/v1/coach/journey`
- **Controller:** `CoachJourneyController`
- **Service:** `CoachJourneyService` (`@Transactional` em escritas)
- **Repository:** `CoachJourneyRepository`

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
| `tb_coach_journey` | Jornada ativa do titular |
| `tb_coach_goal` | Metas derivadas de contrafactuais |
| `tb_coach_progress` | Progresso por etapa |
| `tb_coach_notification_pref` | Preferências de reforço |

```sql
-- DDL PRISMA-EP-06-F03 / PRISMA-EP-06-F03-US-BE-01
CREATE TABLE tb_coach_journey (
  journey_id          UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','PAUSED','COMPLETED')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_snapshot_id UUID,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_coach_journey_active ON tb_coach_journey (documento_hash) WHERE status = 'ACTIVE';

CREATE TABLE tb_coach_goal (
  goal_id             UUID PRIMARY KEY,
  journey_id          UUID NOT NULL REFERENCES tb_coach_journey(journey_id),
  goal_type           VARCHAR(40) NOT NULL,
  title               VARCHAR(200) NOT NULL,
  estimate_text       VARCHAR(500) NOT NULL,
  guarantees_approval BOOLEAN NOT NULL DEFAULT FALSE,
  income_commitment_pct NUMERIC(5,2),
  status              VARCHAR(20) NOT NULL CHECK (status IN ('SUGGESTED','ACTIVE','DONE','BLOCKED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_coach_progress (
  progress_id         UUID PRIMARY KEY,
  journey_id          UUID NOT NULL REFERENCES tb_coach_journey(journey_id),
  goal_id             UUID REFERENCES tb_coach_goal(goal_id),
  percent_complete    NUMERIC(5,2) NOT NULL DEFAULT 0,
  milestone_code      VARCHAR(40),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_coach_notification_pref (
  pref_id             UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL UNIQUE,
  push_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start   TIME,
  quiet_hours_end     TIME,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Vedação de promessa de resultado | Apresentação de meta ao titular | Expressar o efeito esperado como estimativa, nunca como garantia de aprovação | Texto que sugira garantia é bloqueado antes da exibição | 422 |
| **RN002** | Ritmo saudável de metas | Definição de metas do titular | Limitar a quantidade de metas simultâneas para evitar sobrecarga financeira | Meta que exija comprometimento de renda acima do limite prudencial não é sugerida | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
CoachJourneyController          // @RestController — mapeia HTTP ↔ DTO
  └─ CoachJourneyService        // @Service — RN + @Transactional
       ├─ CoachJourneyRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`React Native, Redux Toolkit, Spring Boot 3, PostgreSQL, Firebase Cloud Messaging`).

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
| Contrafactual EP-02 | Derivação de metas a partir da decisão | timeout 2s |
| FCM | Push de reforço conforme preferência | async via Kafka |
| Score thin-file F02 | Snapshot para personalização | cache 5min |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 GET journey monta trilha a partir de contrafactuais | Pass |
| 02 | CT-02 POST goals bloqueia texto com garantia de aprovação (RN-01) | Pass |
| 03 | CT-03 Limite de metas simultâneas respeitado (RN-02) | Pass |
| 04 | CT-04 Meta com comprometimento de renda acima do limite bloqueada | Pass |
| 05 | CT-05 GET progress retorna percentuais | Pass |
| 06 | CT-06 Ownership — titular só acessa própria jornada (403) | Pass |

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
| Complexidade | M |

**Status:** Pronta para desenvolvimento ✅

---

_Documento elaborado com agente **Escritor Back** (BMAD UpStream) · PRISMA-EP-06 · 2026-07-27_
