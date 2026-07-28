# US Backend — PRISMA-EP-06-F09-US-BE-01: Apuração Periódica de Performance e Deriva

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F09*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F09-US-BE-01
Título oficial:  Apuração Periódica de Performance e Deriva
Feature:         PRISMA-EP-06-F09 — Monitoramento de Performance do Modelo Thin-File
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F09-US-FE-01 — Acompanhamento de Deriva do Modelo
Endpoint âncora: POST /api/v1/thinfile/monitoring/evaluate
Stack feature:   Evidently AI, Python 3.12, Prometheus, Grafana, Apache Airflow
Tabelas DDL:     tb_tf_monitoring_run, tb_tf_drift_metric, tb_tf_performance_cohort, tb_tf_model_alert
Complexidade:    M (~5 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F09-US-BE-01` |
| **Título** | **Apuração Periódica de Performance e Deriva** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F09` — Monitoramento de Performance do Modelo Thin-File |
| **US-FE relacionada** | `PRISMA-EP-06-F09-US-FE-01` — Acompanhamento de Deriva do Modelo |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **M** (~5 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** comparar distribuições e desfechos observados com a linha de treinamento,  
**Para que** a promessa de inclusão não se transforme em crédito ruim.

---

## 3. Descrição

Vigiar a performance e a deriva do modelo thin-file para proteger justamente a população que ele deveria incluir.

Esta US Backend implementa a capacidade de serviço da feature **Monitoramento de Performance do Modelo Thin-File**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/thinfile/monitoring/evaluate`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_MODEL_OPS, ROLE_RISK_COMMITTEE, ROLE_DATA_SCIENCE`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Evidently AI, Python 3.12, Prometheus, Grafana, Apache Airflow`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `GET /api/v1/thinfile/monitoring` | Painel de performance por safra | ROLE_MODEL_OPS | M |
| `GET /api/v1/thinfile/drift` | Deriva de atributos vs treinamento | ROLE_MODEL_OPS | M |
| `POST /api/v1/thinfile/monitoring/evaluate` | Apuração periódica e ações de alerta/suspensão | ROLE_MODEL_OPS | G |

---

## 5. Contrato (Prévia) — POST /api/v1/thinfile/monitoring/evaluate

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "model_version": "tf-lgbm-2026.07.1",
  "window_days": 30,
  "degradation_limit_pct": 0.05
}
```

### Response 200/201 (exemplo)

```json
{
  "run_id": "r0r0r0r0-1111-2222-3333-444444444444",
  "status": "ALERT",
  "auc_current": 0.71,
  "auc_baseline": 0.76,
  "degradation_pct": 0.0658,
  "action_taken": "NOTIFY_COMMITTEE",
  "vulnerable_severity_elevated": true
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/thinfile/monitoring/evaluate",
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

- Alertar o comitê ao cruzar o limite de degradação aprovado
- Suspender novas concessões na queda além do dobro do limite
- Elevar a severidade quando a deriva atingir faixa vulnerável

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Apuração Periódica de Performance e Deriva
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/thinfile/monitoring/evaluate com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F09-US-FE-01 |
| Stack | Evidently AI, Python 3.12, Prometheus, Grafana, Apache Airflow |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_MODEL_OPS, ROLE_RISK_COMMITTEE, ROLE_DATA_SCIENCE`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/thinfile/monitoring/evaluate`
- **Controller:** `ThinFileMonitoringController`
- **Service:** `ThinFileModelMonitoringService` (`@Transactional` em escritas)
- **Repository:** `ThinFileMonitoringRepository`

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
| `tb_tf_monitoring_run` | Execução de avaliação periódica |
| `tb_tf_drift_metric` | Métricas de deriva por atributo |
| `tb_tf_performance_cohort` | Performance por safra |
| `tb_tf_model_alert` | Alertas e suspensões |

```sql
-- DDL PRISMA-EP-06-F09 / PRISMA-EP-06-F09-US-BE-01
CREATE TABLE tb_tf_monitoring_run (
  run_id              UUID PRIMARY KEY,
  model_version       VARCHAR(40) NOT NULL,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at         TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING','OK','ALERT','SUSPENDED')),
  auc_current         NUMERIC(6,4),
  auc_baseline        NUMERIC(6,4),
  degradation_pct     NUMERIC(7,4)
);

CREATE TABLE tb_tf_drift_metric (
  metric_id           UUID PRIMARY KEY,
  run_id              UUID NOT NULL REFERENCES tb_tf_monitoring_run(run_id),
  feature_name        VARCHAR(80) NOT NULL,
  psi                 NUMERIC(8,4) NOT NULL,
  vulnerable_segment  BOOLEAN NOT NULL DEFAULT FALSE,
  severity            VARCHAR(20) NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

CREATE TABLE tb_tf_performance_cohort (
  cohort_id           UUID PRIMARY KEY,
  run_id              UUID NOT NULL REFERENCES tb_tf_monitoring_run(run_id),
  cohort_month        DATE NOT NULL,
  default_rate        NUMERIC(7,4) NOT NULL,
  volume              INTEGER NOT NULL
);

CREATE TABLE tb_tf_model_alert (
  alert_id            UUID PRIMARY KEY,
  run_id              UUID NOT NULL REFERENCES tb_tf_monitoring_run(run_id),
  alert_type          VARCHAR(40) NOT NULL,
  severity            VARCHAR(20) NOT NULL,
  action_taken        VARCHAR(40) NOT NULL,
  notified_roles      TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Limite de degradação | Apuração periódica de performance | Alertar o comitê quando o poder discriminante cair além do limite aprovado | Queda superior ao dobro do limite suspende o uso do modelo para novas concessões | 422 |
| **RN002** | Proteção da população vulnerável | Detecção de deriva relevante | Priorizar a revisão quando a deriva afetar as faixas de maior vulnerabilidade | Deriva concentrada em faixa vulnerável eleva a severidade do alerta automaticamente | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
ThinFileMonitoringController          // @RestController — mapeia HTTP ↔ DTO
  └─ ThinFileModelMonitoringService        // @Service — RN + @Transactional
       ├─ ThinFileMonitoringRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Evidently AI, Python 3.12, Prometheus, Grafana, Apache Airflow`).

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
| Evidently AI | Cálculo de PSI/deriva | job Airflow diário |
| Prometheus/Grafana | Métricas e dashboards | pull |
| Score F02 | Flag de suspensão de novas concessões | evento Kafka |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Degradação acima do limite → ALERT (RN-01) | Pass |
| 02 | CT-02 Degradação > 2x limite → SUSPENDED | Pass |
| 03 | CT-03 Deriva em faixa vulnerável eleva severidade (RN-02) | Pass |
| 04 | CT-04 GET monitoring retorna safras | Pass |
| 05 | CT-05 GET drift lista PSI por feature | Pass |
| 06 | CT-06 403 sem ROLE_MODEL_OPS | Pass |

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
