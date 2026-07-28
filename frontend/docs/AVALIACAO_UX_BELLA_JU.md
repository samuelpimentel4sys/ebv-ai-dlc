# Avaliação UX — PrismaShowcase
**Agentes:** Bella (UI/UX) + Ju (Arquiteta de Eficiência Digital)  
**Alvo de implementação:** Eliza (dev-reactjs-fourblox) em party mode  
**App:** `C:\Cursor_Codigo\PrismaShowcase\PrismaShowcase`  
**Data:** 2026-07-28

---

## Scores

| Métrica | Score | Leitura |
|---------|------:|---------|
| **Usabilidade global** | **65/100** | Shell e DS maduros; wayfinding e densidade ainda pesados |
| **Clareza de jornadas** | **42/100** | Telas existem; histórias quase não navegam |

### Dimensões (0–10)

| Dimensão | Score |
|----------|------:|
| Arquitetura de informação / navegação | 7,0 |
| Clareza de jornadas (início→meio→fim) | 4,0 |
| Consistência visual / DS Equifax | 8,5 |
| Feedback e estados (loading/empty/error/success) | 5,5 |
| Acessibilidade percebida | 8,0 |
| Densidade cognitiva | 5,5 |
| Fit showcase demo vs produto | 6,5 |

---

## Diagnóstico (dupla)

### Bella — UI/UX
Visual e tokens Equifax estão sólidos: `ScreenLayout`, `PageHeader`, badges, tema/densidade, a11y com axe. O usuário **não é guiado** entre passos. Prev/próximo em `TopBar` percorre as 57 rotas do registro, não a jornada do épico. CTAs críticos viram toast. Só **2** `<Link>` intra-épico em 56 telas (`FactorsPage` → contrafactuais; `CommunitiesPage` → cockpit).

### Ju — Estratégia / C.O.R.A.G.E.M
**Dor aparente:** “app bonito mas confuso”.  
**Dor real:** showcase documenta **capacidades por US-FE**, não **histórias vendáveis** por persona. Sem trilhas (analista risco, compliance, crédito PJ, operador, titular, coach), a demo não prova valor de ponta a ponta. Investimento #1 = mapa de jornadas + links — não novas telas.

---

## Top 10 problemas

| # | Sev | Problema | Onde |
|---|-----|----------|------|
| 1 | P0 | Prev/Próx global (`flatNav`) quebra fluxo | `TopBar.tsx` |
| 2 | P0 | CTAs críticos → toast em vez de navigate | EP-03, EP-05, várias |
| 3 | P0 | Quase zero cross-links entre telas do mesmo fluxo | 56 telas |
| 4 | P1 | Home abre 1ª tela do nav (ops), não entrada por persona | `HomePage.tsx` |
| 5 | P1 | EP-05 mistura titular / operador / B2B no mesmo grupo | `contestacao/nav.tsx` |
| 6 | P1 | `ErrorState` quase não demonstrado; `failWith`/`isEmpty` ociosos | `useMockQuery` |
| 7 | P1 | Abrir contestação no portal não leva ao tracking | `TitularPortalPage` |
| 8 | P1 | Onboarding B2B cita credenciais sem link | `OnboardingPage` |
| 9 | P2 | Breadcrumb some o grupo épico no mobile | `TopBar.tsx` |
| 10 | P2 | Sem onboarding do showcase na 1ª visita | `HomePage` / `AppShell` |

---

## Backlog priorizado para Eliza (party mode)

### P0 — Wayfinding de jornada
1. **`EpicJourneyNav`**: prev/next scoped a `navByEpic(epic)` em `TopBar`; global só na home.
2. **`src/app/journeys.ts`**: mapa persona → passos (href + label) por épico.
3. **`JourneyLink`**: componente DS; substituir toasts de “próximo passo” nos fluxos críticos.
4. **Wiring mínimo por épico:**
   - EP-02: Fatores ↔ Contrafactuais → Dossiê
   - EP-03: Extração → Índices → Parecer → Guardrails → Alçada
   - EP-04: Cockpit → Contágio / Comunidades → Estresse → Dossiê comitê
   - EP-05: Portal → Tracking → Evidências; Onboarding → Credenciais
   - EP-06: Consentimento → Utilities → Coach → Simulador → Ofertas
   - EP-01: Saúde → SLO / Feature catalog / Registry / Replay (ops)

### P1 — Entrada e personas
5. **`EpicLandingPage`** (`/epicos/:id`) com 2–3 trilhas; `HomePage` cards apontam para landing.
6. Subgrupos no sidebar EP-05/EP-06: Titular | Operador | B2B | Coach | Ops.
7. Demo `?state=error|empty` em 1 tela/épico via `useMockQuery`.
8. Prop `journeyNext` em `ScreenLayout` / `PageHeader.actions`.

### P2 — Polish
9. Breadcrumb mobile sempre com código do épico.
10. Modal 1ª visita (Ctrl+K, trilhas, tema); `localStorage prisma.tour`.

**Quick win:** trocar ~6 toasts por `<Link>`/`navigate` em EP-03, EP-05, EP-06 — alto impacto, diff pequeno.

---

## Personas a guiar

| Persona | Entrada sugerida | Jornada alvo |
|---------|------------------|--------------|
| Analista risco carteira | `/risco/carteira/cockpit` | Cockpit → Contágio → Estresse → Comitê |
| Compliance / DPO | `/explicabilidade/.../fatores` | Fatores → Contrafactuais → Dossiê → Direitos |
| Analista crédito PJ | `/pj/documentos/.../conferencia` | Extração → Índices → Parecer → Alçada |
| Operador contestação | `/disputas/fila` | Fila → SLA → Evidências |
| Titular B2C | `/titular/registros` | Portal → Contestação → Tracking |
| Coach / thin-file | `/titular/privacidade` | Consent → Link → Jornada → Simulador → Ofertas |
| Eng. plataforma | `/plataforma/eventos/saude` | Saúde → Features → Registry → Replay |
| Integrador B2B | `/b2b/onboarding` | Onboarding → Credenciais → Console |

---

## Critério de pronto (para party mode)

- [ ] Prev/próximo nunca salta de EP-0N para EP-0N+1 no meio de um fluxo
- [ ] Cada persona listada tem ≥1 trilha clicável home → fim
- [ ] Zero CTA “próximo passo” que só emita toast (exceto mutações sem destino)
- [ ] Pelo menos 6 telas demonstram empty/error via `?state=`
- [ ] `npm test` + `npm run build` verdes

---

*Handoff Bella + Ju → Eliza. Ativar party mode com as três quando for implementar.*
