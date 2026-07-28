# PRISMA-EP-05-F08-US-BE-01 — Custódia Íntegra de Evidências e Anexos

> **Documento elaborado com agente Escritor Back (BMAD UpStream)** · EBV Prisma · 2026-07-27  
> **Stack:** Java 21 · Spring Boot 3 · PostgreSQL 16 · Redis · OIDC (Keycloak)  
> **Status:** Pronta para desenvolvimento (DoR) · Complexidade **M** (5 SP) · Prioridade **P2**

---

## 1. Identificação

| Campo | Valor |
| --- | --- |
| **US-ID** | `PRISMA-EP-05-F08-US-BE-01` |
| **Título** | Custódia Íntegra de Evidências e Anexos |
| **Épico** | `PRISMA-EP-05` — Central de Contestação Transparente & Console B2B |
| **Feature** | `PRISMA-EP-05-F08` — Trilha de Evidências e Anexos da Contestação |
| **US-FE relacionada** | `PRISMA-EP-05-F08-US-FE-01` |
| **Produto / Cliente** | EBV Prisma · Equifax \| BoaVista (EBV) |
| **Release** | Release 1 (MVP — M1 a M8) |
| **Complexidade** | M (5 SP) |

---

## 2. User Story

**Como** sistema de evidências  
**Quero** verificar, gravar de forma imutável e rastrear acesso a cada anexo  
**Para que** o desfecho da contestação sustentar-se em juízo e auditoria

---

## 3. Descrição

Upload com antivírus + allowlist MIME, gravação em object storage com Object Lock (WORM) pelo prazo legal, hash SHA-256, listagem e evidence-pack (bundle PDF/ZIP + manifesto). Correção exige novo anexo vinculado ao anterior.

**Endpoints cobertos:** `POST /api/v1/disputes/{id}/attachments`, `GET /api/v1/disputes/{id}/attachments`, `GET /api/v1/disputes/{id}/evidence-pack`

---

## 4. Serviços / Endpoints

| Endpoint | Método | Descrição | Auth | Tamanho |
| --- | --- | --- | --- | :---: |
| `POST /api/v1/disputes/{id}/attachments` | POST | Upload multipart de evidência | JWT ROLE_TITULAR|ROLE_ANALISTA_CONTESTACAO | M |
| `GET /api/v1/disputes/{id}/attachments` | GET | Lista anexos metadados (sem binário) | JWT + ownership/role | P |
| `GET /api/v1/disputes/{id}/evidence-pack` | GET | Pacote de evidências + manifesto | JWT ROLE_ANALISTA|ROLE_JURIDICO | M |

---

## 5. Contrato de API (prévia)

### Request principal — `POST /api/v1/disputes/{id}/attachments`

```
POST /api/v1/disputes/{id}/attachments
Headers:
  Authorization: Bearer {jwt}\nContent-Type: multipart/form-data
```

(multipart) file=@comprovante.pdf; description=Comprovante de pagamento

### Response de sucesso

```json
{
  "id": "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff",
  "filename": "comprovante.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 245760,
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "status": "STORED_IMMUTABLE",
  "uploadedAt": "2026-07-27T18:10:00Z"
}
```

### Error DTO (padrão)

```json
{
  "timestamp": "2026-07-27T18:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validação falhou",
  "path": "/api/v1/disputes/{id}/attachments",
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
| **CA-01** | Upload PDF válido → STORED_IMMUTABLE |
| **CA-02** | MIME exe → 422 |
| **CA-03** | AV positivo → 422 |
| **CA-04** | List attachments sem binário |
| **CA-05** | evidence-pack gera manifesto + logs |
| **CA-06** | replace cria novo vínculo |

Critérios herdados da feature (CA funcionais/técnicos do Explorer) permanecem rastreáveis via `PRISMA-EP-05-F08`.

---

## 7. Dependências e Observações

- Épico pai e RNs da feature `PRISMA-EP-05-F08`.
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
| `tb_dispute_attachment` | Anexo | id, dispute_id, filename, mime, size_bytes, sha256, storage_uri, status, replaces_id, uploaded_by |
| `tb_evidence_access_log` | Acesso | id, attachment_id, actor_id, action, at |

#### DDL (PostgreSQL 16)

```sql
CREATE TABLE tb_dispute_attachment (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  storage_uri TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  replaces_attachment_id UUID REFERENCES tb_dispute_attachment(id),
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attachment_dispute ON tb_dispute_attachment(dispute_id);

CREATE TABLE tb_evidence_access_log (
  id UUID PRIMARY KEY,
  attachment_id UUID REFERENCES tb_dispute_attachment(id),
  dispute_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(40) NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.4 Regras de Negócio

| ID | Nome | Gatilho | Comportamento | Exceção | HTTP |
| --- | --- | --- | --- | --- | :---: |
| **RN001** | Verificação antes da custódia | POST attachments | AV scan + MIME allowlist antes de persistir | Reprovado → descartar + 422 | HTTP 422 |
| **RN002** | Imutabilidade | Após aceite | Object Lock; sem replace in-place | Correção = novo anexo com replacesAttachmentId | HTTP 200 |
| **RN003** | Trilha de acesso | GET evidence-pack / download | Registrar quem/quando/por quê | Sem audit → 500 fail-closed opcional | HTTP 200 |
| **RN004** | Tamanho e quantidade | POST | Max 10 MB/arquivo; max 10 anexos/dispute (MVP) | Excesso → 413/422 | HTTP 413 |

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
| Autorização | `ROLE_TITULAR (upload próprios) · ROLE_ANALISTA_CONTESTACAO · ROLE_JURIDICO (pack)` |
| Ownership | Sempre filtrar por `titular_id` ou `tenant_id` do token |
| Input | Bean Validation + sanitização; prepared statements JPA |
| Transporte | HTTPS TLS 1.2+ |
| CORS | Whitelist portais B2C/B2B |
| Auditoria | `X-Correlation-ID` + access log em evidências/credenciais |

### 8.7 Integrações e Dependências

| Integração | Tipo | Uso | Resiliência |
| --- | --- | --- | --- |
| S3 Object Lock | Storage | WORM pelo prazo legal | Compliance mode |
| Antivirus (ClamAV/AWS) | Scan | Pré-persistência | Fail closed |
| F02 | Domínio | Valida dispute existente/ownership | Sync |

### 8.8 Testes de Integração

| ID | Cenário | HTTP esperado |
| --- | --- | :---: |
| **CT-01** | Upload PDF válido → STORED_IMMUTABLE | 201 |
| **CT-02** | MIME exe → 422 | 422 |
| **CT-03** | AV positivo → 422 | 422 |
| **CT-04** | List attachments sem binário | 200 |
| **CT-05** | evidence-pack gera manifesto + logs | 200 |
| **CT-06** | replace cria novo vínculo | 201 |
| **CT-07** | arquivo >10MB → 413 | 413 |
| **CT-08** | cross-dispute access → 403 | 403 |

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
| Escritor Front | Contratos para `PRISMA-EP-05-F08-US-FE-01` |

---

_Fim da US · Escritor Back · PRISMA-EP-05 · PRISMA-EP-05-F08-US-BE-01_
