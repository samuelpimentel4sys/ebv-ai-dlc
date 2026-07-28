# PRISMA-EP-05-F09-US-BE-01 — Apuração de Desvio e Economia de SAC

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P3**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F09-US-BE-01` |
| **Título** | Apuração de Desvio e Economia de SAC |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F09` — Painel de Indicadores de SAC e Desvio de Atendimento |
| **US-FE relacionada** | `PRISMA-EP-05-F09-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** sistema analítico de SAC  
**Quero** calcular taxa de desvio e custo por atendimento por canal vs linha de base  
**Para que** o ROI de -70% custo SAC ser comprovável com métrica estável

---

## 3. Descrição

APIs analíticas read-only sobre agregados: deflection (casos concluídos sem contato humano), sac-cost (custo médio por canal) e baseline (período base do projeto). Caso que retorna ao canal humano em 48h é reclassificado (não conta como deflect).

**Endpoints cobertos:** `GET /api/v1/analytics/deflection`, `GET /api/v1/analytics/sac-cost`, `GET /api/v1/analytics/baseline`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `GET /api/v1/analytics/deflection` | GET | Taxa de desvio self-service | JWT ROLE_OPS_ANALYTICS|ROLE_GESTOR_SAC | M |
| `GET /api/v1/analytics/sac-cost` | GET | Custo médio por canal/período | JWT ROLE_OPS_ANALYTICS|ROLE_GESTOR_SAC | M |
| `GET /api/v1/analytics/baseline` | GET | Linha de base do projeto | JWT ROLE_OPS_ANALYTICS | P |

---

## 5. Contrato de API (prévia)

### Request principal — `GET /api/v1/analytics/deflection`

```
GET /api/v1/analytics/deflection?from=2026-07-01&to=2026-07-27
Headers:
  Authorization: Bearer {jwt}
```

_Sem body (query/path apenas)_

### Response de sucesso

```json
{
  "from": "2026-07-01",
  "to": "2026-07-27",
  "deflectionRate": 0.72,
  "deflectedCases": 8640,
  "totalCases": 12000,
  "reclassified48h": 310,
  "baselineDeflectionRate": 0.18,
  "deltaPp": 0.54
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/analytics/deflection",
  "correlationId": "c0ffee00-0000-4000-8000-000000000001",
  "details": [
    { "field": "campo", "message": "mensagem", "rejectedValue": "valor" }
  ]
}
```

Códigos previstos: **200/201/204**, **400**, **401**, **403**, **404**, **409**, **413**, **422**, **424**, **429**, **500**, **503**.

---

## 6. Critérios de Aceite

| ID | Critério |
| --- | --- |
| **CA-01** | deflection com baseline |
| **CA-02** | sem baseline → 424 |
| **CA-03** | período < 7 dias → 400 |
| **CA-04** | reclassificação 48h reduz deflect |
| **CA-05** | sac-cost por canal |
| **CA-06** | payload sem PII |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F09`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F09`.
- Alinhamento DBA: entidades `CONTESTACAO` / `EVENTO_CONTESTACAO` / tenant B2B (HOME_DBA_V2).
- Integrações do épico: Base de negativação, Gateway pagamento, Notificação, IdP OIDC.
- Fora de escopo: itens Out of Scope da feature correspondente.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da tabela da §4:

1. Validar autenticação/autorização declarada.
2. Validar path/query/body (Bean Validation).
3. Aplicar RNs da §8.4 na ordem: formato → existência → negócio → persistência/integração.
4. Persistir auditoria (`X-Correlation-ID`).
5. Retornar DTO de sucesso ou Error DTO padronizado.

**Transação:** `@Transactional` em escritas; leituras `readOnly=true`.  
**Idempotência:** recomenda-se `X-Idempotency-Key` em POST/PATCH de efeito colateral.  
**Rate limit:** headers `X-RateLimit-Limit|Remaining|Reset`.

### 8.2 Request / Response Schemas (DTOs)

- **Request DTOs:** campos tipados, `@NotNull` / `@Size` / `@Pattern` conforme exemplos da §5.
- **Response DTOs:** sem segredos (exceto one-time em F07); datas ISO-8601 UTC (`...Z`).
- **Error DTO:** schema único (§5).

### 8.3 Modelo de Dados

| Tabela | Descrição | Campos-chave |
| --- | --- | --- |
| `tb_sac_baseline` | Linha de base | id, period_start, period_end, avg_cost_human, contacts, source |
| `tb_sac_metric_daily` | Métricas diárias | day, channel, contacts, deflect_count, cost_total |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_sac_baseline (
  id UUID PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_cost_human NUMERIC(10,2) NOT NULL,
  contacts BIGINT NOT NULL,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_sac_metric_daily (
  day DATE NOT NULL,
  channel VARCHAR(30) NOT NULL,
  contacts BIGINT NOT NULL,
  deflect_count BIGINT NOT NULL,
  reclassified_count BIGINT NOT NULL DEFAULT 0,
  cost_total NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (day, channel)
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Definição estável de desvio | Cálculo deflection | Deflect = concluído sem contato humano; retorno ≤48h reclassifica | Flag reclassified=true | HTTP 200 |
| **RN002** | Comparabilidade com baseline | Exibição economia | Sempre comparar ao período base | Sem baseline → 424 + mensagem | HTTP 424 |
| **RN003** | Somente leitura agregada | Todos GETs | Sem PII de titular nos payloads | Violação → gate review | HTTP 200 |
| **RN004** | Janela mínima de dados | Query | period ≥ 7 dias | Menor → 400 | HTTP 400 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência FK → (4) RN de negócio → (5) side-effects/integrações → (6) commit.

### 8.5 Camadas e Estrutura de Código

```
controller/   → @RestController /api/v1/...
service/      → @Service @Transactional — RNs
port/         → interfaces outbound (negativação, SNS, Serpro, S3, Camunda)
adapter/      → implementações HTTP/SDK
repository/   → Spring Data JPA
domain/       → entities + enums de stage/status
dto/ + mapper/→ MapStruct ou manual
```

Exemplo de assinatura:

```java
@PostMapping // ou Get/Patch/Delete conforme endpoint
ResponseEntity<?> handle(@Valid @RequestBody /*...*/ req, Jwt jwt);
```

### 8.6 Segurança e Autorizações

| Tema | Definição |
| --- | --- |
| Autenticação | OIDC / JWT Bearer (Keycloak) — exceções: tracking público F01 e onboarding start F03 |
| Autorização | `ROLE_OPS_ANALYTICS · ROLE_GESTOR_SAC · ROLE_FINANCE_ROI (read)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| Warehouse/ETL | Batch | Popula tb_sac_metric_daily | Diário |
| F05/F02 eventos | Stream | Marca canal de origem da contestação | Near-real-time opcional |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | deflection com baseline | 200 |
| **CT-02** | sem baseline → 424 | 424 |
| **CT-03** | período < 7 dias → 400 | 400 |
| **CT-04** | reclassificação 48h reduz deflect | 200 |
| **CT-05** | sac-cost por canal | 200 |
| **CT-06** | payload sem PII | 200 |
| **CT-07** | role indevida → 403 | 403 |
| **CT-08** | baseline retorna período base | 200 |

**Meta de cobertura:** > 80% linhas do service + contratos RestAssured/MockMvc.  
**Stack de teste:** JUnit 5, Spring Boot Test, Testcontainers (PostgreSQL), WireMock (outbound).

---

## 9. Checklist de Qualidade

- [x] Seções 1–9 preenchidas
- [x] Seção 8 completa (endpoints, DTOs, DDL, RNs, camadas, segurança, integrações, testes)
- [x] Códigos HTTP mapeados
- [x] Exemplos de sucesso e erro
- [x] Segurança por endpoint
- [x] ≥ 5 cenários de teste

---

## 10. Handoff

| Destino | Uso |
| --- | --- |
| BMM Dev | Implementação Spring Boot |
| BMM DBA | Aplicar DDL / migrations Flyway |
| BMM TEA / GherkinFlow | Automatizar CT-* |
| Escritor Front | Contratos para `PRISMA-EP-05-F09-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F09-US-BE-01_
