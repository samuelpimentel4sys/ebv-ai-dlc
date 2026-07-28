# US Backend — PRISMA-EP-06-F06-US-BE-01: Cálculo de Efeito Estimado de Ação

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F06*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F06-US-BE-01
Título oficial:  Cálculo de Efeito Estimado de Ação
Feature:         PRISMA-EP-06-F06 — Simulador de Impacto de Ações no Score
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F06-US-FE-01 — Simulação Antes de Agir
Endpoint âncora: POST /api/v1/coach/simulate
Stack feature:   React Native, Spring Boot 3, ONNX Runtime, Redis
Tabelas DDL:     tb_coach_simulation, tb_coach_simulation_action
Complexidade:    M (~5 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F06-US-BE-01` |
| **Título** | **Cálculo de Efeito Estimado de Ação** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F06` — Simulador de Impacto de Ações no Score |
| **US-FE relacionada** | `PRISMA-EP-06-F06-US-FE-01` — Simulação Antes de Agir |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **M** (~5 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** estimar o efeito da ação sobre o score partindo do snapshot mais recente,  
**Para que** a orientação do coach seja concreta e coerente com a decisão real.

---

## 3. Descrição

Mostrar ao titular, antes de agir, o efeito estimado de cada decisão financeira sobre seu score.

Esta US Backend implementa a capacidade de serviço da feature **Simulador de Impacto de Ações no Score**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/coach/simulate`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_COACH_SERVICE`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`React Native, Spring Boot 3, ONNX Runtime, Redis`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `POST /api/v1/coach/simulate` | Estima efeito de ação sobre o score | ROLE_TITULAR_B2C | M |
| `GET /api/v1/coach/simulations/history` | Histórico de simulações do titular | ROLE_TITULAR_B2C | P |

---

## 5. Contrato (Prévia) — POST /api/v1/coach/simulate

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "action_code": "QUITAR_DIVIDA",
  "params": {
    "debt_id": "D-7788",
    "amount_cents": 35000
  }
}
```

### Response 200/201 (exemplo)

```json
{
  "simulation_id": "12121212-3434-5656-7878-909090909090",
  "estimable": true,
  "score_delta_min": 15,
  "score_delta_max": 35,
  "effect_days_min": 30,
  "effect_days_max": 60,
  "message": "Estimativa: +15 a +35 pontos em 30–60 dias. Não é garantia de aprovação.",
  "snapshot_score_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/coach/simulate",
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

- Partir sempre do snapshot mais recente do titular
- Retornar intervalo estimado e prazo de efeito
- Informar impossibilidade quando a ação não for estimável

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Cálculo de Efeito Estimado de Ação
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/coach/simulate com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F06-US-FE-01 |
| Stack | React Native, Spring Boot 3, ONNX Runtime, Redis |
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

- **Método/Path:** `POST /api/v1/coach/simulate`
- **Controller:** `CoachSimulateController`
- **Service:** `ScoreImpactSimulationService` (`@Transactional` em escritas)
- **Repository:** `CoachSimulationRepository`

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
| `tb_coach_simulation` | Resultado de simulação what-if |
| `tb_coach_simulation_action` | Ação simulada e parâmetros |

```sql
-- DDL PRISMA-EP-06-F06 / PRISMA-EP-06-F06-US-BE-01
CREATE TABLE tb_coach_simulation (
  simulation_id       UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  snapshot_score_id   UUID NOT NULL,
  action_code         VARCHAR(40) NOT NULL,
  estimable           BOOLEAN NOT NULL,
  score_delta_min     INTEGER,
  score_delta_max     INTEGER,
  effect_days_min     INTEGER,
  effect_days_max     INTEGER,
  message             VARCHAR(500) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_sim_doc ON tb_coach_simulation (documento_hash, created_at DESC);

CREATE TABLE tb_coach_simulation_action (
  action_id           UUID PRIMARY KEY,
  simulation_id       UUID NOT NULL REFERENCES tb_coach_simulation(simulation_id),
  action_code         VARCHAR(40) NOT NULL,
  params_json         JSONB NOT NULL,
  amount_cents        BIGINT
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Resultado sempre em faixa | Apresentação de resultado de simulação | Expressar o efeito como intervalo com prazo estimado | Ação sem efeito estimável informa a impossibilidade em vez de arriscar um número | 422 |
| **RN002** | Coerência com a decisão vigente | Execução de simulação | Partir do snapshot mais recente do titular | Ausência de snapshot recente impede a simulação e orienta o titular a consultar seu score | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
CoachSimulateController          // @RestController — mapeia HTTP ↔ DTO
  └─ ScoreImpactSimulationService        // @Service — RN + @Transactional
       ├─ CoachSimulationRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`React Native, Spring Boot 3, ONNX Runtime, Redis`).

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
| ONNX Runtime / modelo contrafactual | Inferência de impacto | p95 < 2s |
| Score snapshot F02 | Partir do score mais recente | fail se ausente |
| Redis | Cache de simulações idênticas | TTL 10min |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Happy path retorna intervalo + prazo (RN-01) | Pass |
| 02 | CT-02 Sem snapshot recente → 422 (RN-02) | Pass |
| 03 | CT-03 Ação não estimável → estimable=false com mensagem | Pass |
| 04 | CT-04 Latência p95 < 2s | Pass |
| 05 | CT-05 GET history ordenado por created_at DESC | Pass |
| 06 | CT-06 Ownership IDOR → 403 | Pass |

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
| Endpoints | 2 |
| Entidades/tabelas | 2 |
| RNs documentadas | 4 |
| Testes | 6 |
| Complexidade | M |

**Status:** Pronta para desenvolvimento ✅

---

_Documento elaborado com agente **Escritor Back** (BMAD UpStream) · PRISMA-EP-06 · 2026-07-27_
