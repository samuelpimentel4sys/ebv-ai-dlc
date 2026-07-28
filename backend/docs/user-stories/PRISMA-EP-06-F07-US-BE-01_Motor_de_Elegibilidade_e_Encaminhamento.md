# US Backend — PRISMA-EP-06-F07-US-BE-01: Motor de Elegibilidade e Encaminhamento

> **Escritor Back** · UpStream Foursys · AI-DLC Etapa 5 · Data: **2026-07-27**  
> **Gate G5 (Definition of Ready):** ✅ **APROVADA** (geração consolidada a partir do Explorer PRISMA-EP-06)  
> **Fonte:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-06/PRISMA-EP-06-F07*.md`

---

## Gate de Inputs — Prova de Leitura

```
US-ID:           PRISMA-EP-06-F07-US-BE-01
Título oficial:  Motor de Elegibilidade e Encaminhamento
Feature:         PRISMA-EP-06-F07 — Marketplace de Ofertas Elegíveis
Épico:           PRISMA-EP-06 — Score de Inclusão Thin-File & Coach B2C Gamificado
US-FE pareada:   PRISMA-EP-06-F07-US-FE-01 — Descoberta de Ofertas Elegíveis
Endpoint âncora: GET /api/v1/marketplace/offers
Stack feature:   React Native, Spring Boot 3, PostgreSQL, Kafka, API de parceiros
Tabelas DDL:     tb_mkt_partner, tb_mkt_offer, tb_mkt_referral, tb_mkt_conversion
Complexidade:    G (~8 SP indicativos)
```

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **US-ID** | `PRISMA-EP-06-F07-US-BE-01` |
| **Título** | **Motor de Elegibilidade e Encaminhamento** |
| **Produto** | EBV Prisma |
| **Cliente** | Equifax \| BoaVista (EBV) |
| **Épico** | `PRISMA-EP-06` — Score de Inclusão Thin-File & Coach B2C Gamificado |
| **Feature** | `PRISMA-EP-06-F07` — Marketplace de Ofertas Elegíveis |
| **US-FE relacionada** | `PRISMA-EP-06-F07-US-FE-01` — Descoberta de Ofertas Elegíveis |
| **Release** | Release 2 (Expansão — M9 a M14) |
| **Status** | Pronta para Desenvolvimento (DoR) |
| **Versão** | v1.0 |
| **Autor** | Escritor Back · UpStream Foursys |
| **Complexidade** | **G** (~8 SP) |

---

## 2. User Story

**Como** sistema,  
**Quero** cruzar o perfil do titular com os critérios dos parceiros e encaminhar com consentimento,  
**Para que** a base B2C gere receita sem comprometer a confiança do titular.

---

## 3. Descrição

Monetizar a base B2C conectando o titular a ofertas para as quais ele efetivamente se qualifica.

Esta US Backend implementa a capacidade de serviço da feature **Marketplace de Ofertas Elegíveis**, expondo os contratos REST sob `/api/v1` e persistindo o estado canônico em PostgreSQL. O endpoint âncora é `GET /api/v1/marketplace/offers`.

Fluxo resumido:
1. Autenticação JWT + autorização por role (`ROLE_TITULAR_B2C, ROLE_MARKETPLACE_OPS, ROLE_PARTNER_API`).
2. Validações de formato (DTO) e de existência.
3. Aplicação das regras de negócio (RN001+).
4. Integrações externas / motores conforme stack (`React Native, Spring Boot 3, PostgreSQL, Kafka, API de parceiros`).
5. Persistência transacional + resposta com códigos HTTP semânticos.

---

## 4. Serviços / Endpoints

| Endpoint | Descrição | Auth (role mín.) | Tamanho |
|---|---|---|---|
| `GET /api/v1/marketplace/offers` | Vitrine filtrada por elegibilidade real | ROLE_TITULAR_B2C | G |
| `POST /api/v1/marketplace/offers/{id}/apply` | Encaminha lead com consentimento | ROLE_TITULAR_B2C | G |
| `GET /api/v1/marketplace/eligibility` | Critérios e elegibilidade do titular | ROLE_TITULAR_B2C | M |

---

## 5. Contrato (Prévia) — GET /api/v1/marketplace/offers

### Request
- **Headers:** `Authorization: Bearer {jwt}`, `Content-Type: application/json`, `X-Correlation-ID: {uuid}`
- **Body (exemplo):**

```json
{
  "consent_id": "c0ffee00-0000-4000-8000-000000000099",
  "share_fields": [
    "score_band",
    "thin_file_flag"
  ]
}
```

### Response 200/201 (exemplo)

```json
{
  "offers": [
    {
      "offer_id": "oooooooo-1111-2222-3333-444444444444",
      "title": "Cartão garantido — parceiro X",
      "eligible": true,
      "reason": "Score inclusão na faixa aceita pelo parceiro",
      "partner_code": "FINTECH-X"
    }
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
  "path": "/api/v1/marketplace/offers",
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

- Filtrar a vitrine pelos critérios reais de cada parceiro
- Compartilhar dados apenas após aceite explícito
- Apurar encaminhamento e conversão por parceiro

### Gherkin (referência)

```gherkin
# language: pt
Funcionalidade: Motor de Elegibilidade e Encaminhamento
  @positivo @backend
  Cenário: Fluxo feliz do endpoint âncora
    Dado um cliente autenticado com role permitida
    Quando envia GET /api/v1/marketplace/offers com payload válido
    Então o sistema responde 200 ou 201 com o contrato documentado
    E as regras RN001+ são respeitadas
```

---

## 7. Dependências e Observações

| Tipo | Dependência |
|---|---|
| Épico | PRISMA-EP-06 (consentimento, thin-file, coach, marketplace) |
| Feature FE | PRISMA-EP-06-F07-US-FE-01 |
| Stack | React Native, Spring Boot 3, PostgreSQL, Kafka, API de parceiros |
| Cross-épico | Motor de score PRISMA-EP-01 (quando aplicável); consentimento F04 como pré-condição de dado |

**Observação:** Score Points são indicativos para planejamento; estimativa formal cabe ao Estimator / sprint planning.

---

## 8. Especificação Detalhada de Contratos

### 8.1 Endpoints completos

Para cada endpoint da §4:
- Autenticação: JWT Bearer (OIDC / Keycloak EBV)
- Roles: `ROLE_TITULAR_B2C, ROLE_MARKETPLACE_OPS, ROLE_PARTNER_API`
- Rate limit sugerido: 60–120 req/min (ajuste por endpoint sensível)
- Versionamento: `/api/v1`
- Correlation: header `X-Correlation-ID` obrigatório em escrita

#### Endpoint âncora — detalhe

- **Método/Path:** `GET /api/v1/marketplace/offers`
- **Controller:** `MarketplaceController`
- **Service:** `MarketplaceEligibilityService` (`@Transactional` em escritas)
- **Repository:** `MarketplaceOfferRepository`

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
| `tb_mkt_partner` | Parceiro e critérios de elegibilidade |
| `tb_mkt_offer` | Oferta publicada |
| `tb_mkt_referral` | Encaminhamento consentido |
| `tb_mkt_conversion` | Apuração de conversão |

```sql
-- DDL PRISMA-EP-06-F07 / PRISMA-EP-06-F07-US-BE-01
CREATE TABLE tb_mkt_partner (
  partner_id          UUID PRIMARY KEY,
  code                VARCHAR(40) NOT NULL UNIQUE,
  name                VARCHAR(200) NOT NULL,
  eligibility_json    JSONB NOT NULL,
  active              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tb_mkt_offer (
  offer_id            UUID PRIMARY KEY,
  partner_id          UUID NOT NULL REFERENCES tb_mkt_partner(partner_id),
  title               VARCHAR(200) NOT NULL,
  product_type        VARCHAR(40) NOT NULL,
  explanation_template VARCHAR(500) NOT NULL,
  active              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tb_mkt_referral (
  referral_id         UUID PRIMARY KEY,
  offer_id            UUID NOT NULL REFERENCES tb_mkt_offer(offer_id),
  documento_hash      CHAR(64) NOT NULL,
  consent_id          UUID NOT NULL,
  status              VARCHAR(20) NOT NULL CHECK (status IN ('CREATED','SENT','ACCEPTED','REJECTED','ERROR')),
  partner_ref         VARCHAR(80),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_mkt_ref_doc ON tb_mkt_referral (documento_hash, created_at DESC);

CREATE TABLE tb_mkt_conversion (
  conversion_id       UUID PRIMARY KEY,
  referral_id         UUID NOT NULL REFERENCES tb_mkt_referral(referral_id),
  converted           BOOLEAN NOT NULL,
  revenue_cents       BIGINT,
  reported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
|---|---|---|---|---|---|
| **RN001** | Elegibilidade antes da exibição | Montagem da vitrine para o titular | Exibir apenas ofertas cujos critérios o titular efetivamente atende | Parceiro sem critério disponível fica fora da vitrine, sem oferta genérica | 422 |
| **RN002** | Consentimento no encaminhamento | Interesse do titular em uma oferta | Enviar dados ao parceiro somente após aceite explícito e específico | Recusa mantém a oferta visível sem qualquer compartilhamento de dado | 422 |
| **RN003** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |
| **RN004** | Autenticação e ownership | Qualquer chamada aos endpoints | Exigir JWT válido e titular/dono do recurso | Acesso cross-tenant bloqueado | 401/403 |

**Ordem de validação:** (1) formato DTO → (2) authZ/ownership → (3) existência → (4) RN de domínio → (5) persistência/integração.

### 8.5 Camadas e Estrutura de Código

```
MarketplaceController          // @RestController — mapeia HTTP ↔ DTO
  └─ MarketplaceEligibilityService        // @Service — RN + @Transactional
       ├─ MarketplaceOfferRepository // Spring Data JPA
       └─ *Port / Adapter      // integrações externas
```

Stack de implementação preferencial alinhada à arquitetura Prisma: **Java 21 / Spring Boot 3** nos serviços de domínio B2C; pipelines de dados/ML conforme stack da feature (`React Native, Spring Boot 3, PostgreSQL, Kafka, API de parceiros`).

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
| API parceiros | Encaminhamento de lead + callback conversão | timeout 5s, retry 2x |
| Consent Service F04 | Aceite explícito MARKETPLACE_SHARE | fail-closed |
| Kafka mkt.referral | Telemetria de funil/ROI | async |

### 8.8 Testes de Integração

| # | Cenário | Resultado esperado |
|---|---|---|
| 01 | CT-01 Vitrine só com ofertas elegíveis (RN-01) | Pass |
| 02 | CT-02 Parceiro sem critério → fora da vitrine | Pass |
| 03 | CT-03 Apply sem consentimento → 422 (RN-02) | Pass |
| 04 | CT-04 Apply com consentimento cria referral SENT | Pass |
| 05 | CT-05 Conversão apurada por parceiro | Pass |
| 06 | CT-06 Recusa mantém oferta visível sem share | Pass |

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
