# US Backend — PRISMA-EP-06-F02-US-BE-01: Cálculo de Score para População Thin-File

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F02*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F02-US-BE-01
Título oficial:  Cálculo de Score para População Thin-File
Feature:         PRISMA-EP-06-F02 — Modelo de Score Thin-File
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F02-US-FE-01 — Consulta à Ficha do Modelo
Endpoint âncora: POST /api/v1/thinfile/score
Stack feature:   Python 3.12, LightGBM, MLflow, ONNX, Amazon SageMaker
Tabelas DDL:     tb_thinfile_score, tb_thinfile_eligibility, tb_thinfile_model_card, tb_thinfile_feature_snapshot
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F02-US-BE-01` |
| **Título** | **Cálculo de Score para População Thin-File** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F02` — Modelo de Score Thin-File |
| **US-FE relacionada** | `PRISMA-EP-06-F02-US-FE-01` — Consulta à Ficha do Modelo |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** calcular o score com atributos alternativos apenas para quem é elegível,  
**Para que** os 35,3 milhões de invisíveis passem a ter avaliação de crédito.

---

## 3. Descrição

Produzir um score confiável para quem não tem histórico de crédito, usando comportamento de pagamento de contas essenciais.

Esta US Backend implementa a capacidade de serviço da feature **Modelo de Score Thin-File**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/thinfile/score`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_SCORE_CONSUMER, ROLE_B2B_API, ROLE_MODEL_OPS`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Python 3.12, LightGBM, MLflow, ONNX, Amazon SageMaker`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `POST /api/v1/thinfile/score` | Calcula score thin-file ou roteia ao tradicional | ROLE_SCORE_CONSUMER | G |
| `GET /api/v1/thinfile/model-card` | Ficha do modelo (população, limites, validação) | ROLE_SCORE_CONSUMER | P |
| `GET /api/v1/thinfile/{documento}` | Consulta último score thin-file materializado | ROLE_SCORE_CONSUMER | M |

---

## 5. Contrato (Prévia) — POST /api/v1/thinfile/score

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "documento": "12345678901",
  "product_code": "SCORE_INCLUSAO",
  "force_recalculate": false
}
```

### Response 200/201 (exemplo)

```json
{
  "documento": "12345678901",
  "score": 612,
  "thin_file": true,
  "confidence_band": "MEDIUM",
  "model_version": "tf-lgbm-2026.07.1",
  "routed_to_traditional": false,
  "calculated_at": "2026-07-27T22:05:00Z"
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/thinfile/score",
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

- Aplicar o critério objetivo de elegibilidade thin
- file
- Rotear ao score tradicional quem tiver histórico suficiente
- Sinalizar a natureza thin
- file e a faixa de confiança na resposta

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Cálculo de Score para População Thin-File
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/thinfile/score com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F02-US-FE-01 |
| Stack | Python 3.12, LightGBM, MLflow, ONNX, Amazon SageMaker |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_SCORE_CONSUMER, ROLE_B2B_API, ROLE_MODEL_OPS`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/thinfile/score`
- **Controller:** `ThinFileScoreController`
- **Service:** `ThinFileScoreService` (`@Transactional` em escritas)
- **Repository:** `ThinFileScoreRepository`

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
| `tb_thinfile_score` | Score materializado thin-file |
| `tb_thinfile_eligibility` | Decisão de elegibilidade thin-file vs tradicional |
| `tb_thinfile_model_card` | Metadados da versão do modelo |
| `tb_thinfile_feature_snapshot` | Atributos usados no cálculo |

```sql
-- DDL PRISMA-EP-06-F02 / PRISMA-EP-06-F02-US-BE-01
CREATE TABLE tb_thinfile_model_card (
  model_version       VARCHAR(40) PRIMARY KEY,
  trained_at          TIMESTAMPTZ NOT NULL,
  validated_at        TIMESTAMPTZ NOT NULL,
  population_desc     TEXT NOT NULL,
  auc                 NUMERIC(6,4),
  confidence_floor    NUMERIC(6,4) NOT NULL,
  limitations_json    JSONB NOT NULL,
  active              BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE tb_thinfile_eligibility (
  eligibility_id      UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  is_thin_file        BOOLEAN NOT NULL,
  reason_code         VARCHAR(40) NOT NULL,
  traditional_history_count INTEGER NOT NULL DEFAULT 0,
  evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_tf_elig_doc ON tb_thinfile_eligibility (documento_hash, evaluated_at DESC);

CREATE TABLE tb_thinfile_score (
  score_id            UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  model_version       VARCHAR(40) NOT NULL REFERENCES tb_thinfile_model_card(model_version),
  score_value         INTEGER NOT NULL CHECK (score_value BETWEEN 0 AND 1000),
  confidence_band     VARCHAR(20) NOT NULL CHECK (confidence_band IN ('HIGH','MEDIUM','LOW')),
  thin_file_flag      BOOLEAN NOT NULL DEFAULT TRUE,
  routed_to_traditional BOOLEAN NOT NULL DEFAULT FALSE,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id      UUID NOT NULL
);
CREATE INDEX ix_tf_score_doc ON tb_thinfile_score (documento_hash, calculated_at DESC);

CREATE TABLE tb_thinfile_feature_snapshot (
  snapshot_id         UUID PRIMARY KEY,
  score_id            UUID NOT NULL REFERENCES tb_thinfile_score(score_id),
  features_json       JSONB NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Critério objetivo de elegibilidade | Solicitação de score para um titular | Aplicar o score thin-file apenas a quem atende ao critério de ausência de histórico | Titular com histórico suficiente é roteado ao score tradicional automaticamente | 422 |
| **RN002** | Transparência da limitação | Entrega de score thin-file ao consumidor da API | Sinalizar explicitamente que o score é de população thin-file e sua faixa de confiança | Score fora da faixa de confiança validada é entregue com marcação de baixa precisão | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
ThinFileScoreController          // @RestController — mapeia HTTP ↔ DTO
  └─ ThinFileScoreService        // @Service — RN + @Transactional
       ├─ ThinFileScoreRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Python 3.12, LightGBM, MLflow, ONNX, Amazon SageMaker`).

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
| Motor de score EP-01 (gRPC) | Publicação/roteamento score tradicional | timeout 2s, circuit breaker |
| Feature Store / alt-data | Atributos de utilities normalizados | cache Redis TTL 5min |
| SageMaker / ONNX Runtime | Inferência do modelo LightGBM | timeout 1.5s |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Thin-file elegível — score calculado com flag | Pass |
| 02 | CT-02 Histórico suficiente — roteamento ao score tradicional (RN-01) | Pass |
| 03 | CT-03 Resposta inclui confidence_band (RN-02) | Pass |
| 04 | CT-04 GET model-card retorna versão ativa | Pass |
| 05 | CT-05 GET por documento 404 quando sem score | Pass |
| 06 | CT-06 422 sem atributos alternativos mínimos | Pass |

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
