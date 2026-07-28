# Plano de Trabalho — Frontend Prisma (Sofia / React ESP)

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Produto** | **Prisma Equifax** (EBV · Equifax / BoaVista) |
| **Repo FE** | `Prisma/frontend` |
| **Repo BE** | `Prisma/backend` (Noah) |
| **Atualizado em** | 2026-07-28 14:50 |
| **Fase atual** | **P2 Explainability live** feito · próximo P1 contrato / EP-05 |

---

## 0. Onde estamos (honesto)

| Camada | Estado | Comentário |
|--------|--------|------------|
| Showcase 56 telas + Equifax DS | ✅ | Base UI boa |
| HTTP + `VITE_DATA_MODE=live` | ✅ Sprint 0 | `httpClient` · proxy · badge live/mock |
| EP-01 plug APIs | ✅ Sprint 1 | 10/10 telas live (lab) |
| **IA / navegação de produto** | ✅ P0 | Domínios produto · demo/dev gated · `index.html` Prisma Equifax |
| **DS hardening (targets/inverse/overlay)** | ✅ P0.1 | `min-h-target` · `text-eqx-text-inverse` · `--color-overlay` |
| Contratos FE = OpenAPI (sem mapper frouxo) | 🟡 | Mappers compensam gap mock×BE |
| Login OIDC / papéis | ❌ | Lab aberto |
| EP-02…06 live | ✅ EP-02 via `explainability.ts` | EP-03…06 aguardam BE |

**Conclusão:** o FE está **conectado**, mas ainda **parece demo**. Próximo passo obrigatório = **virar Prisma Equifax** (navegação, copy, hierarquia), sem perder as rotas das US.

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

### P1 — Hardening live Score & Plataforma

- [ ] Diff OpenAPI × mappers (gap list Noah)
- [ ] Empty/error reais sem depender só de `?state=`
- [ ] Smoke roteiro operador (não demo 60 min)

### P3+ — Contestação / Inclusão / R2 (03–04)

Conforme BE + WSJF.

---

## 3. Sprints técnicos já feitos

| Sprint | Status |
|--------|--------|
| S0 HTTP | ✅ |
| S1 Score & Plataforma live | ✅ (`scorePlatform.ts` · `DEV_RECORD_EP01_PLUG.md`) |
| S2 F08/F10 | ✅ no plug (ressalvas lab) |
| P0.1 DS hardening | ✅ |
| P2 Explicabilidade live | ✅ (`explainability.ts` · `DEV_RECORD_EXPLAINABILITY_PLUG.md`) |

---

## 4. Regras que não mudam

- Stack: Vite · React 18 · RR7 · Tailwind · Equifax DS
- `VITE_DATA_MODE=mock|live`
- Rotas das US-FE **estáveis** (deep links / contratos)
- Tokens `rgb(var(--color-*))` — zero HEX
- Noah CORS: `localhost:5173`

---

## 5. Decisão pedida ao stakeholder

Próximo: P1 gaps contrato Score & Plataforma · P3 Contestação quando Noah fechar handoff.

_Sofia · Prisma Equifax_
