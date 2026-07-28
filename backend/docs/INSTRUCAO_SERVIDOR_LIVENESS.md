# Instrução Noah — subir Liveness / Biometria no servidor lab

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Ops / Walter — host lab |
| **Host tipico** | `192.168.31.47` |
| **US** | `EP05-F01-US-BE-01` Orquestração Sessão Liveness |
| **Flyway** | `V51__ep05_f01_liveness_biometria.sql` |
| **Data** | 2026-07-28 |

---

## 1. O que sobe no servidor

| Componente | Precisa Docker? | Porta | Obrigatoriedade |
|------------|-----------------|-------|-----------------|
| Tabelas biometria (Supabase Flyway V51) | Não — sobe com o BE | — | **Obrigatório** |
| BE Java `prisma-backend` | Já sobe no lab | `8080` | **Obrigatório** |
| WireMock Rekognition mock | Sim | `8093` | Opcional (`LIVENESS_MODE=http`) |
| AWS Face Liveness real | Não (cloud) | — | Fora deste lab |

**Importante:** LocalStack **não** emula `CreateFaceLivenessSession`. No lab use `stub` ou WireMock (`http`).

---

## 2. Pré-requisitos no host

1. Docker + Docker Compose plugin
2. Clone/atualização do repo com o BE:
   - `Prisma/backend/docker-compose.liveness.yml`
   - `Prisma/backend/docker/rekognition-mock/`
   - código BE com V51 (commit Liveness)
3. Rede: FE/outros hosts alcançam `192.168.31.47:8093` se for usar modo `http`
4. BE apontando Supabase Prisma (mesmo DB do lab) — Flyway aplica V51 no boot

---

## 3. Passo a passo — WireMock (modo `http`)

No servidor (ex.: `192.168.31.47`):

```bash
cd /caminho/para/Prisma/backend

# Sobe só o mock (não precisa do compose postgres/redis local se já usa lab)
docker compose -f docker-compose.liveness.yml up -d rekognition-mock

# Conferir
docker compose -f docker-compose.liveness.yml ps
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8093/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{}'
# Esperado: 200
```

Liberar firewall/security group se FE ou outra máquina for chamar o mock **direto** (em geral só o BE chama `:8093` na mesma máquina).

### Persistência / restart

```bash
# Parar
docker compose -f docker-compose.liveness.yml down

# Subir de novo
docker compose -f docker-compose.liveness.yml up -d rekognition-mock

# Logs
docker compose -f docker-compose.liveness.yml logs -f rekognition-mock
```

Volume monta `./docker/rekognition-mock` → mappings WireMock. Não apagar essa pasta no deploy.

---

## 4. Env do BE (`.env` no host que roda o Java)

### Opção A — só stub (sem Docker mock)

```env
LIVENESS_MODE=stub
BIOMETRIC_TERM_VERSION=v1.0
```

Útil para smoke rápido. `session_id` = UUID gerado no Java.

### Opção B — mock WireMock no mesmo host do BE

```env
LIVENESS_MODE=http
LIVENESS_MOCK_URL=http://127.0.0.1:8093
BIOMETRIC_TERM_VERSION=v1.0
```

### Opção C — BE em outra máquina, mock no lab `192.168.31.47`

```env
LIVENESS_MODE=http
LIVENESS_MOCK_URL=http://192.168.31.47:8093
BIOMETRIC_TERM_VERSION=v1.0
```

Reiniciar o BE **depois** de alterar o `.env` (Noah: após mudar BE → restart).

Flyway V51 aplica sozinho no boot se a migration estiver no jar/classpath.

---

## 5. Smoke no servidor (ou da máquina do Walter)

Substituir `BE_HOST` por `localhost` ou `192.168.31.47` conforme onde o Java está.

```bash
BE_HOST=http://192.168.31.47:8080   # ou http://localhost:8080
CID=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

# 1) Sem consent → 412
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BE_HOST/api/v1/auth/liveness/session" \
  -H "Content-Type: application/json" \
  -d "{\"customer_id\":\"$CID\"}"
# Esperado: 412

# 2) Consentimento
curl -s -X POST "$BE_HOST/api/v1/auth/biometric-consent" \
  -H "Content-Type: application/json" \
  -d "{\"customer_id\":\"$CID\",\"term_version\":\"v1.0\"}"
# Esperado: status ACTIVE

# 3) Sessão
curl -s -X POST "$BE_HOST/api/v1/auth/liveness/session" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: lab-server-001" \
  -d "{\"customer_id\":\"$CID\",\"device_info\":{\"platform\":\"Android\",\"app_version\":\"1.0.0\"},\"audit_context\":{\"channel\":\"WEB_PORTAL\"}}"
# Esperado: 201 · session_id · status CREATED · expires_at (~+3 min)

# 4) Health BE
curl -s "$BE_HOST/actuator/health"
```

OIDC lab off (`OIDC_ENABLED=false`): ownership JWT não bloqueia.  
OIDC on: `sub` do token deve corresponder ao `customer_id`.

---

## 6. Checklist de aceite no servidor

- [ ] `docker compose -f docker-compose.liveness.yml ps` → `rekognition-mock` Up (se modo `http`)
- [ ] Porta `8093` escuta no host
- [ ] `.env` com `LIVENESS_MODE` + `LIVENESS_MOCK_URL` coerentes
- [ ] BE reiniciado; log Flyway mostra **v51**
- [ ] Smoke: consent `ACTIVE` + session `CREATED`
- [ ] FE aponta HITL/contestação pra Java `:8080`; GenAI continua Python `:8090` (sem misturar)

---

## 7. O que NÃO fazer neste lab

- Não esperar Face Liveness real no LocalStack
- Não apontar Amplify FaceLivenessDetector para `session_id` stub/mock e achar que a câmera AWS valida — captura real só com `LIVENESS_MODE=aws` + IAM (fora deste pacote)
- Não commitar secrets do `.env`
- Não expor WireMock na internet pública sem restrição de rede

---

## 8. Rollback rápido

```bash
# Voltar BE para stub (sem mock)
# no .env:
# LIVENESS_MODE=stub
# reiniciar BE

docker compose -f docker-compose.liveness.yml down
```

Tabelas V51 no Supabase **permanecem** (Flyway não remove). Isso é seguro — só param de ser usadas se o BE não chamar as rotas.

---

## 9. Referências no repo

| Artefato | Path |
|----------|------|
| Compose mock | `backend/docker-compose.liveness.yml` |
| Mappings WireMock | `backend/docker/rekognition-mock/` |
| Provisionamento curto | `backend/docs/PROVISIONAMENTO_LIVENESS_REKOGNITION.md` |
| DEV RECORD | `backend/docs/DEV_RECORD_EP05_LIVENESS.md` |
| Plano | `backend/docs/PLANO_TRABALHO_BACKEND.md` (Sprint 5b) |
| US UpStream | `07.Escritor Back/.../06_US-BE_EP05-F01-US-BE-01_Orquestracao_Sessao_Liveness_Rekognition.md` |

---

_Noah · Prisma Backend · 2026-07-28 · Runbook servidor lab Liveness_
