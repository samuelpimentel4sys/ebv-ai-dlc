# Plano de Trabalho — Frontend Prisma (Sofia / React ESP)

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Produto** | **Prisma Equifax** (EBV · Equifax / BoaVista) |
| **Repo FE** | `Prisma/frontend` |
| **Repo BE** | `Prisma/backend` (Noah) |
| **Atualizado em** | 2026-07-28 20:45 |
| **Fase atual** | FE 100% BE lab ✅ · Amplify/OIDC backlog · P1 Score |

---

## 0. Onde estamos (honesto)

| Camada | Estado | Comentário |
|--------|--------|------------|
| Showcase 59 telas + Equifax DS | ✅ | + SCR-BIO (3) |
| HTTP + `VITE_DATA_MODE=live` | ✅ Sprint 0 | `httpClient` · proxy · badge live/mock |
| EP-01 plug APIs | ✅ Sprint 1 | 10/10 telas live (lab) |
| **IA / navegação de produto** | ✅ P0 | Domínios produto · demo/dev gated · `index.html` Prisma Equifax |
| **DS hardening (targets/inverse/overlay)** | ✅ P0.1 | `min-h-target` · `text-eqx-text-inverse` · `--color-overlay` |
| Contratos FE = OpenAPI (sem mapper frouxo) | 🟡 | Mappers compensam gap mock×BE |
| Auth lab (`OIDC_ENABLED=false`) | ✅ | Sem login — `httpClient` direto (Noah) |
| Auth demo JWT (`VITE_API_BEARER`) | ✅ pronto | Atalho smoke; não é login de produto |
| Login OIDC produto (PKCE) | ❌ backlog P6 | Client `prisma-steward-ui` |
| EP-02…06 live | ✅ 01–06 | EP-03 via Noah `:8080` (HITL + BFF GenAI) |

**Conclusão:** plug live lab **fechado** — FE só Noah `:8080`. Mock só Vitest. Próximo: **P1** hardening Score · Amplify aws · **P6** OIDC PKCE produto.

---

## 1. Visão alvo — produto vs showcase

| Showcase (hoje) | Produto Prisma Equifax (alvo) |
|-----------------|-------------------------------|
| “EBV Prisma Showcase” | **Prisma** — plataforma de crédito Equifax |
| Navegação por **épico** (EP-01…) | Navegação por **domínio de produto** |
| Trilhas de persona + roteiro 60 min | Menu operacional + busca; trilhas opcionais em “Ajuda / Demo” |
| Badge `PRISMA-EP-01-F0x-US-FE-01` no header | US-ID só em rodapé/dev (`?dev=1`) ou omitido |
| “Passo 3/6 da trilha” | Breadcrumb de domínio → tela |
| Home conta história Maria/Aurora | Home = **áreas do produto** + atalhos + status live |
| Pastas `epics/*` no código | Podem ficar (organização interna); **usuário não vê “épico”** |

Épico/Feature **continuam** como rastreabilidade interna (US, commits, Noah). **Não** são a IA do produto.

### Mapa épico → módulo de produto

| Código interno | Módulo produto (UI) | Menu |
|----------------|---------------------|------|
| EP-01 | **Score & Plataforma** | Plataforma · Dados · Risco · Integração · ML |
| EP-02 | **Explicabilidade & Compliance** | Compliance |
| EP-03 | **Copiloto PJ** | Crédito PJ |
| EP-04 | **Sala de Risco** | Portfólio |
| EP-05 | **Contestação & Console B2B** | Contestações · Console |
| EP-06 | **Inclusão & Coach** | Inclusão · App titular (futuro) |

---

## 2. Sprint P — Productização (AGORA)

### P0 — Shell de produto (1–2 dias) · **FEITO 2026-07-28**

- [x] Home: marca **Prisma**, áreas do produto, sem “Showcase”
- [x] Sidebar: grupos por domínio (não `EP-01 Score Vivo`)
- [x] Remover/ocultar “Roteiro da demo” do nav principal → `?demo=1`
- [x] TopBar: breadcrumb produto; badge live/mock; US-ID só `?dev=1`
- [x] `ScreenLayout`: `usId` / JourneyNav só demo/dev
- [x] Copy: zero “épico” na UI operador
- [x] `docs/IA_PRODUTO_PRISMA.md` — mapa módulo ↔ rotas

### P0.1 — Hardening Equifax DS · **FEITO 2026-07-28**

- [x] Touch targets → `min-h-target` / `h-target` (48px)
- [x] `text-white` → `text-eqx-text-inverse`
- [x] Overlays → `bg-eqx-overlay` (`--color-overlay`)
- [x] Magic sizes críticos no shell/ds (`text-xs`, icon buttons)
- [x] Meta HTML: título/descrição **Prisma Equifax**

### P2 — Plug Explicabilidade (`explainability.ts`) · **FEITO 2026-07-28**

Ordem Noah: F05 → F10 → F01 → F02 → F06 → F08 → F04 → F03 → F09 → F07 — **10/10 live**

### P3 — Plug Contestação & Console (`dispute.ts` · `b2bConsole.ts`) · **FEITO 2026-07-28**

Noah lab 9/9 — **9/9 telas live**

### P4 — Plug Inclusão & Coach (`inclusion.ts`) · **FEITO 2026-07-28**

Noah lab 9/9 — ordem F04→F08→F01→F02→F03→F05→F06→F07→F09 — **9/9 live**

### P1 — Hardening live Score & Plataforma

- [ ] Diff OpenAPI × mappers (gap list Noah)
- [ ] Empty/error reais sem depender só de `?state=`
- [ ] Smoke roteiro operador (não demo 60 min)

### P5 — Plug Portfólio / Sala de Risco (`portfolio.ts`) · **FEITO 2026-07-28**

Noah lab 9/9 (stubs Neptune/Trino) · handoff 15:40 · **9/9 telas live**

### P5+ — Copiloto PJ

| Parte | Estado |
|-------|--------|
| **F04 HITL** (Noah `:8080`) | ✅ BE lab · ✅ FE plug (`pjHitl.ts`) |
| **F01 BIO Liveness** (Noah `:8080`) | ✅ BE V51 · ✅ FE (`liveness.ts` + 3 telas) · Amplify fora |
| GenAI F01–F03/F05–F09 (BFF Noah → Emilly) | ✅ FE (`pjGenai.ts`) · host só `:8080` · `HANDOFF_SOFIA_BFF_GENAI.md` |

### P6 — Login OIDC produto (backlog · desenho Noah 2026-07-28)

Só quando lab deixar de ser aberto **e** demo precisar de usuário humano no browser.

- [ ] Client Keycloak **`prisma-steward-ui`** (público · PKCE)
- [ ] Authorization Code + PKCE no browser → guardar `access_token`
- [ ] Injetar `Authorization: Bearer` em toda chamada (evoluir além de `VITE_API_BEARER` estático)
- [ ] Tela login / redirect Keycloak · roles `realm_access.roles` alinhadas aos paths BE
- [ ] **Não** embutir `prisma-backend` + `client_secret` no FE
- [ ] **Não** inventar `POST /api/v1/login` no Spring

---

## 2.1 Auth — como Sofia autentica (Noah · arquitetura atual)

Fonte: handoff + resposta Noah 2026-07-28. Keycloak lab: `http://192.168.31.47:8180/realms/prisma`.

### Fluxo oficial (OIDC on)

```
Sofia (browser)
  → Keycloak (login / token)
  → Prisma BE com Authorization: Bearer <JWT>
```

### Modos operacionais

| Modo | O que fazer | Estado Sofia |
|------|-------------|--------------|
| **Lab aberto** (`OIDC_ENABLED=false`) | Nada — APIs liberadas; `httpClient` chama direto | **Default agora** |
| **Demo com JWT** | Token Keycloak (password / client_credentials só lab) → `VITE_API_BEARER` ou header | Já cabe no `httpClient` |
| **Produto** | Client `prisma-steward-ui` + PKCE + tela login (redirect Keycloak) | Backlog **P6** |

### Já no código

- `src/lib/httpClient.ts` — se `VITE_API_BEARER` setado, envia Bearer em toda request
- `.env.example` — documenta a variável

### Não fazer

| Proibido | Motivo |
|----------|--------|
| Chamar `prisma-backend` + `client_secret` **do browser** | Secret vaza |
| Esperar `POST /api/v1/login` no Spring | Fora do desenho Noah |
| Tratar `VITE_API_BEARER` como login de produto | Só atalho lab/smoke |

### Diagnóstico 401 (handoff Noah)

1. `GET /actuator/health` → 200 (público)
2. `GET /api/v1/identity/candidates` sem Bearer:
   - **401** → OIDC on no processo vivo (restart com `OIDC_ENABLED=false` **ou** Bearer)
   - **200** → lab aberto, plugar sem auth
3. Só alterar `.env` do BE **não** muda processo já rodando — precisa **reiniciar** Spring

---

## 3. Sprints técnicos já feitos

| Sprint | Status |
|--------|--------|
| S0 HTTP | ✅ |
| S1 Score & Plataforma live | ✅ (`scorePlatform.ts` · `DEV_RECORD_EP01_PLUG.md`) |
| S2 F08/F10 | ✅ no plug (ressalvas lab) |
| P0.1 DS hardening | ✅ |
| P2 Explicabilidade live | ✅ (`explainability.ts`) |
| P3 Contestação/Console live | ✅ (`dispute.ts` · `b2bConsole.ts`) |
| P4 Inclusão/Coach live | ✅ (`inclusion.ts` · `DEV_RECORD_INCLUSION_PLUG.md`) |
| P5 Portfólio/Sala de Risco live | ✅ (`portfolio.ts` · `DEV_RECORD_PORTFOLIO_PLUG.md`) |

---

## 4. Regras que não mudam

- Stack: Vite · React 18 · RR7 · Tailwind · Equifax DS
- `VITE_DATA_MODE=mock|live`
- Rotas das US-FE **estáveis** (deep links / contratos)
- Tokens `rgb(var(--color-*))` — zero HEX
- Noah CORS: `localhost:5173` · `localhost:3000`
- Auth: lab aberto default · demo via `VITE_API_BEARER` · produto = PKCE `prisma-steward-ui` (P6)
- Secrets Keycloak / BE **nunca** no FE versionado

---

## 5. Decisão pedida ao stakeholder

Inventário completo: [`GAP_US_FE_FORA_DO_ESCOPO.md`](./GAP_US_FE_FORA_DO_ESCOPO.md)

1. **Feito:** F04 HITL + BIO + EP-03 GenAI via BFF Noah (`pjGenai.ts` · host `:8080`)
2. **Em paralelo:** P1 hardening contrato Score & Plataforma
3. **Quando OIDC on em demo:** colar JWT em `VITE_API_BEARER`
4. **Quando produto:** autorizar sprint **P6** (PKCE + login UI)
5. **Amplify Face Liveness:** só com `LIVENESS_MODE=aws` · GetResults / IAL3 backlog
6. **Docs:** gerar US-FE md EP-05 Downstream
7. **Ops lab:** Noah `:8080` público; Emilly `:8090` **interno** (só BFF)

_Sofia · Prisma Equifax_
