# Handoff Sofia — OIDC ligado (Keycloak local)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (FE React / Vite) |
| **Data** | 2026-09-28 |
| **Motivo** | Lab saiu do “APIs abertas”. BE sobe com **`OIDC_ENABLED=true`**. Sem Bearer → **401** na maioria das rotas. |
| **Compose** | projeto Docker **`prisma`** · Keycloak em `http://localhost:8180` |

---

## 1. O que mudou (BE)

| Antes (lab aberto) | Agora (lab próximo de prod) |
|--------------------|-----------------------------|
| `OIDC_ENABLED=false` → `permitAll` | `OIDC_ENABLED=true` → JWT Keycloak + roles |
| Host Keycloak remoto `192.168.31.47:8180` | Keycloak **local** no Compose `prisma` |
| Banco Supabase | Postgres **local** Docker + massa seed |

CORS do Java continua aceitando:

- `http://localhost:5173`
- `http://localhost:3000`

Issuer do token (browser / FE):

```text
http://localhost:8180/realms/prisma
```

---

## 2. O que a Sofia precisa fazer **agora** (demo)

Login PKCE de produto (**ainda não**). Atalho já suportado pelo `httpClient`:

### 2.1 Gerar access_token

```powershell
$body = @{
  client_id  = "prisma-lab"
  grant_type = "password"
  username   = "platform"   # ou analista | titular
  password   = "prisma"
}
$t = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8180/realms/prisma/protocol/openid-connect/token" `
  -Body $body `
  -ContentType "application/x-www-form-urlencoded"
$t.access_token
```

### 2.2 Colar no FE

Arquivo `Prisma/frontend/.env` ou `.env.local`:

```env
VITE_DATA_MODE=live
VITE_API_BEARER=<cole_o_access_token_aqui>
```

Reiniciar Vite. O `src/lib/httpClient.ts` já injeta:

```http
Authorization: Bearer <token>
```

**Não** embutir `client_secret` no browser. Client `prisma-lab` é só atalho lab (password grant).

---

## 3. Usuários / roles (realm `prisma`)

| Username | Senha | Roles principais | Telas |
|----------|-------|------------------|-------|
| `platform` | `prisma` | `PLATFORM` | Operador pleno (0×403 no smoke) |
| `steward` | `prisma` | `PLATFORM` | Alias full access (mesmo escopo) |
| `noah` | `prisma` | `PLATFORM`, `DATA_ENG` | Full access Noah |
| `analista` | `prisma` | `ANALISTA`, `DATA_ENG` | Score + ingest/replay lab |
| `titular` | `prisma` | `TITULAR`, `TITULAR_B2C`, `CITIZEN`, `SUBJECT` | Fluxo titular / consent / review |

Console admin Keycloak: `http://localhost:8180` · user/senha admin `prisma` / `prisma`.

Clients:

| Client | Tipo | Uso |
|--------|------|-----|
| `prisma-lab` | público · password grant | Demo / `VITE_API_BEARER` |
| `prisma-steward-ui` | público · PKCE · redirect `http://localhost:5173/*` | **Produto** (P6 — ainda não implementado no FE) |

---

## 4. Rotas que **não** pedem JWT

Self-service continua aberto (contrato EP-05 F05):

| Método | Path |
|--------|------|
| `POST` | `/api/v1/self-service/identify` |
| `GET` | `/api/v1/self-service/records?sessionToken=` **ou** header `X-Session-Token` |
| `POST` | `/api/v1/self-service/disputes` |

Health / docs públicos:

- `GET /actuator/health`
- Swagger / `/api-docs`

Todo o resto autenticado (score, identity, decisions, disputes queue, portfolio, PJ HITL, etc.).

---

## 5. Massa lab (já no Postgres local)

Reaplicar se zerar o volume:

```powershell
cd Prisma\backend
.\scripts\seed_lab_demo.ps1
```

| CPF / ID | Valor |
|----------|-------|
| `12345678901` | Score **712** · self-service `birthDate=1990-01-01` `lastDigits=8901` |
| `98765432100` | Score **548** · disputa `DSP-2026-0001002` |
| `11144477735` | Score **801** |
| Portfolio FE | `aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee` (`LAB_PORTFOLIO_ID`) |
| Decisão demo | `d1000000-0000-4000-8000-000000000001` |
| Contestação fila | `DSP-2026-0001001` (`OPEN`), `DSP-2026-0001002` (`IN_DILIGENCE`) |

Smoke BE (com token `platform`): score/history/candidates/decision/disputes queue/portfolio snapshot → **200**.

---

## 6. Diagnóstico rápido

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| **401** em score / portfolio | Sem Bearer ou token expirado | Renovar token → `VITE_API_BEARER` → restart Vite |
| **403** | Role errada pro path | Trocar user (`platform` / `analista` / `titular`) |
| **404** score | Massa não aplicada | `.\scripts\seed_lab_demo.ps1` |
| Self-service **401** | Session in-memory após restart do Java | `POST /identify` de novo |
| FE chama `:8090` | Errado | Só `:8080` (BFF GenAI) |

---

## 7. Produto (P6) — **implementado no FE** (2026-09-28)

1. Authorization Code + **PKCE** com client `prisma-steward-ui`
2. Redirect URI: `${origin}/auth/callback` (coberto por `http://localhost:5173/*` no realm)
3. Sessão em `sessionStorage` · refresh_token · Bearer no `httpClient`
4. UI: `/login` · guard nas rotas do shell · logout Keycloak
5. **Não** inventar `POST /api/v1/login` no Spring
6. **Não** usar client confidencial / secret no FE

Atalho `VITE_API_BEARER` (§2) continua válido para smoke sem UI.

Issuer / JWKS (referência):

```text
Issuer:  http://localhost:8180/realms/prisma
JWKS:    http://localhost:8180/realms/prisma/protocol/openid-connect/certs
```

(O Java no Docker valida issuer `localhost` e busca JWKS em `http://keycloak:8080/...` na rede interna.)

---

## 8. Checklist Sofia (hoje)

- [ ] Keycloak up: `http://localhost:8180/realms/prisma`
- [ ] BE up: `http://localhost:8080/actuator/health` → 200
- [ ] Token `platform` gerado
- [ ] `VITE_API_BEARER` setado + Vite reiniciado
- [ ] `VITE_DATA_MODE=live` · proxy / base só `:8080`
- [ ] Smoke: score `12345678901` → 200
- [ ] Self-service identify/records **sem** Bearer → 200
- [ ] P6 PKCE fica no backlog (não bloqueia demo com Bearer)

---

## 9. Contatos / refs

| Doc | Path |
|-----|------|
| Este handoff | `backend/docs/HANDOFF_SOFIA_OIDC_KEYCLOAK.md` |
| Plano FE (auth) | `frontend/docs/PLANO_TRABALHO_FRONTEND.md` §2.1 / P6 |
| BFF GenAI | `backend/docs/HANDOFF_SOFIA_BFF_GENAI.md` |
| Seed | `backend/scripts/seed_lab_demo.sql` + `.ps1` |
| Realm import | `backend/docker/keycloak/import/prisma-realm.json` |

**Noah** — qualquer 401/403 com correlationId, manda o path + user Keycloak usado.
