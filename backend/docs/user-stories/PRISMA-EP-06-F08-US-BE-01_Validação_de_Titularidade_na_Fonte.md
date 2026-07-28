# US Backend — PRISMA-EP-06-F08-US-BE-01: Validação de Titularidade na Fonte

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F08*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F08-US-BE-01
Título oficial:  Validação de Titularidade na Fonte
Feature:         PRISMA-EP-06-F08 — Validação de Titularidade da Conta de Consumo
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F08-US-FE-01 — Vinculação da Minha Conta de Consumo
Endpoint âncora: POST /api/v1/utilities/link
Stack feature:   Spring Boot 3, PostgreSQL, API das concessionárias, Python 3.12
Tabelas DDL:     tb_utility_link, tb_utility_link_validation, tb_utility_link_audit
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F08-US-BE-01` |
| **Título** | **Validação de Titularidade na Fonte** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F08` — Validação de Titularidade da Conta de Consumo |
| **US-FE relacionada** | `PRISMA-EP-06-F08-US-FE-01` — Vinculação da Minha Conta de Consumo |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** confirmar o vínculo entre titular e conta de consumo diretamente com a concessionária,  
**Para que** o score thin-file não seja manipulável por uso de conta alheia.

---

## 3. Descrição

Garantir que o histórico de utilities usado no score pertence de fato ao titular avaliado.

Esta US Backend implementa a capacidade de serviço da feature **Validação de Titularidade da Conta de Consumo**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `POST /api/v1/utilities/link`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_UTILITIES_LINK`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`Spring Boot 3, PostgreSQL, API das concessionárias, Python 3.12`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `POST /api/v1/utilities/link` | Solicita vínculo e valida titularidade na fonte | ROLE_TITULAR_B2C | G |
| `GET /api/v1/utilities/links` | Lista vínculos e status | ROLE_TITULAR_B2C | P |
| `DELETE /api/v1/utilities/links/{linkId}` | Desvincula conta com efeito no próximo score | ROLE_TITULAR_B2C | M |

---

## 5. Contrato (Prévia) — POST /api/v1/utilities/link

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "partner_code": "CEMIG-MG",
  "account_ref": "UC-998877",
  "utility_type": "ENERGIA",
  "holder_name": "Marina Souza"
}
```

### Response 200/201 (exemplo)

```json
{
  "link_id": "l1l1l1l1-2222-3333-4444-555555555555",
  "status": "CONFIRMED",
  "source_confirmed": true,
  "usable_in_score": true,
  "validated_at": "2026-07-27T22:20:00Z"
}
```

##### Erros padrão

```json
{
  "timestamp": "2026-07-27T22:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/utilities/link",
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

- Exigir confirmação da concessionária antes de usar o histórico
- Manter pendente o vínculo sem confirmação disponível
- Excluir o histórico do próximo cálculo após desvinculação

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Validação de Titularidade na Fonte
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia POST /api/v1/utilities/link com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F08-US-FE-01 |
| Stack | Spring Boot 3, PostgreSQL, API das concessionárias, Python 3.12 |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_TITULAR_B2C, ROLE_UTILITIES_LINK`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `POST /api/v1/utilities/link`
- **Controller:** `UtilityLinkController`
- **Service:** `UtilityOwnershipValidationService` (`@Transactional` em escritas)
- **Repository:** `UtilityLinkRepository`

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
| `tb_utility_link` | Vínculo titular ↔ conta de consumo |
| `tb_utility_link_validation` | Resultado da confirmação na concessionária |
| `tb_utility_link_audit` | Auditoria de vínculo/desvínculo |

```sql
-- DDL PRISMA-EP-06-F08 / PRISMA-EP-06-F08-US-BE-01
CREATE TABLE tb_utility_link (
  link_id             UUID PRIMARY KEY,
  documento_hash      CHAR(64) NOT NULL,
  partner_code        VARCHAR(40) NOT NULL,
  account_ref         VARCHAR(80) NOT NULL,
  utility_type        VARCHAR(20) NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','CONFIRMED','REJECTED','UNLINKED')),
  linked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlinked_at         TIMESTAMPTZ,
  UNIQUE (documento_hash, partner_code, account_ref)
);
CREATE INDEX ix_util_link_doc ON tb_utility_link (documento_hash, status);

CREATE TABLE tb_utility_link_validation (
  validation_id       UUID PRIMARY KEY,
  link_id             UUID NOT NULL REFERENCES tb_utility_link(link_id),
  source_confirmed    BOOLEAN NOT NULL,
  name_match_score    NUMERIC(5,2),
  divergence_flags    JSONB,
  raw_response_hash   CHAR(64),
  validated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_utility_link_audit (
  audit_id            UUID PRIMARY KEY,
  link_id             UUID NOT NULL,
  action              VARCHAR(20) NOT NULL,
  actor               VARCHAR(80) NOT NULL,
  details_json        JSONB NOT NULL,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Confirmação obrigatória na fonte | Solicitação de vínculo de conta de consumo | Confirmar a titularidade diretamente com a concessionária antes de usar o histórico | Concessionária sem confirmação disponível mantém o vínculo pendente e o histórico não entra no score | 422 |
| **RN002** | Efeito da desvinculação | Desvinculação de conta pelo titular | Excluir o histórico daquela conta do próximo cálculo de score | Decisão já emitida com base no vínculo permanece registrada no snapshot | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
UtilityLinkController          // @RestController — mapeia HTTP ↔ DTO
  └─ UtilityOwnershipValidationService        // @Service — RN + @Transactional
       ├─ UtilityLinkRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`Spring Boot 3, PostgreSQL, API das concessionárias, Python 3.12`).

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
| API concessionária | Confirmação de titularidade da UC | timeout 8s, retry 2x |
| Score thin-file F02 | Exclusão de histórico após unlink | evento Kafka |
| Consent F04 | Pré-condição UTILITIES_SCORE | fail-closed |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Confirmação na fonte → CONFIRMED (RN-01) | Pass |
| 02 | CT-02 Concessionária indisponível → PENDING sem uso no score | Pass |
| 03 | CT-03 Divergência cadastral → REJECTED | Pass |
| 04 | CT-04 DELETE unlink remove do próximo cálculo (RN-02) | Pass |
| 05 | CT-05 GET links lista status | Pass |
| 06 | CT-06 Sem consentimento → 422 | Pass |

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
