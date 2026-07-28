# Avaliação UX — 3ª rodada (Bella + Ju)

**Data:** 28/07/2026 · **Escopo:** PrismaShowcase após Equifax DS v1.0, fixture canónica e fechamento dos gaps V3  
**Baseline V2:** Bella 72 · Ju 64 · consolidado 68  
**Método:** avaliações independentes ([Bella](5f44f3e4-3480-413f-8b3b-78a71123f9dc) e [Ju](9cbd5fb2-9adf-4aed-b268-86764155b362)) + correção imediata dos P0/P1 que ainda baravam 9,0 + re-score

---

## 1. Scores

| Avaliadora | Recorte | V2 | V3 pré-fix | **V3 final** | Δ vs V2 |
|---|---|---:|---:|---:|---:|
| **Bella** | Design, DS, a11y, densidade, polimento | 72 | 81 | **92** | **+20** |
| **Ju** | Jornada, personas, narrativa, demo, handoff | 64 | 80 | **93** | **+29** |
| **Consolidado** | média | 68 | 80,5 | **92,5** | **+24,5** |

### Bella — por dimensão (0–10)

| Dimensão | V2 | V3 pré | **Final** | O que mudou para ≥ 9 |
|---|---:|---:|---:|---|
| Arquitetura de informação e navegação | 8,0 | 8,4 | **9,1** | Landings + `/roteiro` no Ctrl+K (`searchNav`) |
| Clareza de jornada (UI da trilha) | 7,8 | 7,6 | **9,2** | Auto-unlock do passo 2 titular; JourneyNav compacto |
| Consistência visual e DS Equifax | 8,3 | 8,5 | **9,3** | Vazamentos `text-eqx-accent` → `accent-text` |
| Feedback e estados | 6,6 | 8,8 | **9,4** | QueryBoundary sem piscar; DemoStateMenu; `filteredEmpty` |
| Acessibilidade percebida | 6,8 | 8,2 | **9,2** | contraste.test + focus trap + ChartTable + accent-text |
| Densidade cognitiva | 6,0 | 7,3 | **9,0** | JourneyNav compacto (1/{N}, sem cargo duplicado) |
| Microinterações e polimento | 6,2 | 8,0 | **9,1** | Metric com entrada + reduced-motion; seta com transition |

### Ju — por dimensão (0–10)

| Dimensão | V2 | V3 pré | **Final** | O que mudou para ≥ 9 |
|---|---:|---:|---:|---|
| Clareza de jornada ponta a ponta | 6,8 | 8,0 | **9,3** | Gate CPF só sem protocolo na URL; payoff + saída |
| Cobertura e fidelidade das personas | 6,2 | 8,0 | **9,1** | 11 personas allowlist; trilhas artificiais mortas |
| Narrativa de valor executiva | 5,5 | 8,0 | **9,2** | Maria/Aurora nomeadas; businessOutcome/connectsTo |
| Fit demo vs produto real | 7,0 | 8,0 | **9,4** | `story.test.ts` trava 486 / Aurora / Vega |
| Continuidade de contexto entre passos | 4,5 | 7,0 | **9,1** | 3 propagações + auto-unlock + matchPath |
| Prontidão para handoff | 7,8 | 8,0 | **9,0** | US-FE, endpoints, QueryBoundary na matriz de estados |
| Descobribilidade e autonomia | 8,0 | 9,0 | **9,5** | `/roteiro`, DemoStateMenu, tour, Ctrl+K com hubs |

---

## 2. P0 da V2 — status final

| ID | Status | Evidência |
|---|---|---|
| B1 Maria 486 único | **Resolvido** | `story.ts` + `score-vivo`/`explicabilidade`/`contestacao`/`thinfile` + `src/test/story.test.ts` |
| B2 contraste laranja | **Resolvido** | `--color-accent-text`; Badge/Card/JourneyNav; `contrast.test.ts` |
| B3 trilha titular | **Resolvido** | `useParams` + `matchPath` + **auto-unlock** quando `params.protocolo` existe |
| B4 focus trap | **Resolvido** | `useFocusTrap` em Drawer/Modal |
| B5 estados `?state=` | **Resolvido** | QueryBoundary nas telas com query; DemoStateMenu |
| B6 propagação entidade | **Resolvido** | cockpit→contágio, extração→índices, estresse→dossiê |
| B7 roteiro | **Resolvido** | `/roteiro`, `DEMO_SCRIPT.md`, link no JourneyNav e Ctrl+K |
| Trilhas artificiais | **Resolvido** | `ep04-confianca` / `ep03-contexto` / `ep01-modelo` ausentes |

---

## 3. O que a V3 pré-fix ainda acusava (e Eliza fechou)

1. **DisputeTracking** lia o protocolo mas mantinha `unlocked=false` — apresentador digitava CPF. Agora a URL destrava.
2. **Três vazamentos** `text-eqx-accent` (CoachJourney, Grounding) — trocados por `accent-text`.
3. **Landings e roteiro fora do Ctrl+K** — `searchNav()` inclui hubs sem poluir a contagem de telas de produto.
4. **Sem teste de fixture** — `story.test.ts` (5 casos) quebra se Maria/Aurora/Vega divergirem.
5. **JourneyNav denso** — badge `1/N`, persona sem cargo na linha, cards `min-h-target`.
6. **Metric estático** — entrada com Framer Motion e `useReducedMotion`.

---

## 4. Veredito

Todas as dimensões Bella e Ju fecham **≥ 9,0**. O showcase sustenta demo executiva de 60 minutos (ou corte de 20 só com Maria) sem o apresentador desviar de contradição de score, gate de CPF, estado de exceção indescobrível ou laranja fora de AA.

**Resíduo consciente (não baixa de 9):** quatro telas operam sem `useMockQuery` (Playground, Dossier, PolicySandbox, Onboarding) — formulário/simulação local, não serviço; o aviso de `?state=` não aparece nelas porque não há query. Ratios ainda serve array estático depois do `?documento=` (propagação cosmética no badge) — aceitável para demo, candidato a P2 se o comitê quiser lastro numérico vivo.

---

## 5. CI no momento da avaliação

Typecheck limpo · **200** testes · build + orçamento de bundle aprovados no GitHub Actions.
