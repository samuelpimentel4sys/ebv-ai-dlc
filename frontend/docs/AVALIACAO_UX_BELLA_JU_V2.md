# Avaliação UX — 2ª rodada (Bella + Ju)

**Data:** 28/07/2026 · **Escopo:** PrismaShowcase após a implementação das trilhas de jornada
**Baseline:** `docs/AVALIACAO_UX_BELLA_JU.md` (usabilidade 65/100, clareza de jornada 42/100)
**Modo:** somente leitura, avaliações independentes e depois consolidadas

---

## 1. Scores

| Avaliadora | Recorte | Antes | Agora | Δ |
|---|---|---:|---:|---:|
| **Bella** | Design, DS, acessibilidade, densidade, polimento | 63 | **72** | **+9** |
| **Ju** | Jornada, personas, narrativa, fit demo, handoff | 43 | **64** | **+21** |
| **Consolidado** | média das duas visões | 53 | **68** | **+15** |

### Bella — por dimensão

| Dimensão | Antes | Agora | Δ | Leitura |
|---|---:|---:|---:|---|
| Arquitetura de informação e navegação | 70 | 80 | +10 | Wayfinding resolvido; sidebar ficou longa e landings não entram no Ctrl+K |
| Clareza de jornada | 42 | 78 | +36 | Trilhas cobrem as 56 telas com teste garantindo; toda trilha termina em beco sem saída |
| Consistência visual e DS | 85 | 83 | −2 | `buttonClass()` acertou, mas convivem 3 idiomas de link-botão e 5 alturas mínimas |
| Feedback e estados | 55 | 66 | +11 | `?state=` é boa ideia, honrada em 6 de 47 telas com query |
| Acessibilidade percebida | 80 | 68 | −12 | Laranja de 2,9:1 em todas as telas; regra `color-contrast` fora da suíte axe |
| Densidade cognitiva | 55 | 60 | +5 | Home e landings escaneáveis; as 56 telas ganharam um 4º bloco de cromo |
| Microinterações e polimento | 65 | 62 | −3 | Motion só no shell; a seta do "Próximo passo" pula por falta de `transition-transform` |

### Ju — por dimensão

| Dimensão | Antes | Agora | Δ | Leitura |
|---|---:|---:|---:|---|
| Clareza de jornada ponta a ponta | 42 | 68 | +26 | Trilhas navegáveis com objetivo declarado; a maioria termina em painel, não em resultado |
| Cobertura e fidelidade das personas | 35 | 62 | +27 | 11 personas representadas; 3 trilhas inventaram persona para absorver telas sobrando |
| Narrativa de valor executiva | 30 | 55 | +25 | A história existe nos mocks e nunca é nomeada pela aplicação |
| Fit demo vs produto real | 65 | 70 | +5 | Mocks financeiramente auditáveis, contaminados por contradições entre épicos |
| Continuidade de contexto entre passos | 20 | 45 | +25 | A trilha carrega a posição, não a entidade |
| Prontidão para handoff | 70 | 78 | +8 | US-FE, DTOs e endpoints explícitos; máquina de estados desigual |
| Descobribilidade e autonomia | 55 | 80 | +25 | Home, landings, sidebar, Ctrl+K e tour resolvem; `?state=` indescobrível |

---

## 2. O que as duas confirmaram como ganho real

A camada de jornadas não é fachada. `src/app/journeys.ts` define 15 trilhas cujos passos somam exatamente 56 hrefs sem repetição, e `src/test/journeys.test.tsx` falha se divergir. As duas avaliadoras verificaram independentemente que **todas** as 56 telas usam `ScreenLayout` e portanto recebem o `JourneyNav` — não há tela órfã.

O problema P0 nº 1 do baseline está morto: `src/shell/TopBar.tsx:24-26` trocou `flatNav()` por `journeyPosition()`, e as setas nunca mais saltam entre épicos. O breadcrumb leva à landing do épico inclusive no mobile.

Os seis CTAs prometidos realmente navegam, verificados um a um. A entrada por persona existe em três níveis coerentes: home, landing de épico e sidebar numerada.

Ju destacou um ganho que não estava no plano: a qualidade financeira dos mocks de EP-03 é auditável — liquidez, cobertura, ROE e alavancagem derivam dos campos extraídos do PDF, e o achado `gf-02` do guardrail acusa uma divergência **intencional** entre o texto do parecer (R$ 12,3 mi) e a exposição consolidada do grupo (R$ 12,74 mi).

---

## 3. Bloqueantes (P0)

### B1 · O protagonista tem dois scores contraditórios — verificado

Para o documento `12345678901` / `123.***.**01`:

- `score-vivo/data.ts:305-313` → score **742**, faixa "B — risco baixo", pd12m 3,8, decisão **aprovada** às 12:38
- `explicabilidade/data.ts:31-38` → score **486**, **recusado** às 11:04, dois apontamentos ativos
- `contestacao/data.ts` e `thinfile/data.ts` confirmam 486

São 256 pontos de diferença em 94 minutos, com dois apontamentos desaparecendo no intervalo. E `scoreHistory()` não contém nenhum ponto 486: o evento central da demo é invisível na própria tela de histórico de score.

### B2 · O laranja falha AA em todas as telas e a suíte axe não pode vê-lo — verificado

`--color-accent` é `--eqx-orange-500` = `rgb(255 102 27)` (`eqx-tokens.css:32,100`) → **2,93:1** sobre branco, **2,49:1** dentro de `Badge tone="accent"` (fundo `bg-eqx-accent/15`). AA exige 4,5:1. Aparece no badge de épico das 56 telas, no eyebrow de todo `CardHeader`, no badge "Passo X/N" e no rótulo "Próximo passo".

A razão de ter passado: `src/test/a11y.test.tsx` lista 19 regras em `runOnly` e **não inclui** `color-contrast`, `target-size`, `region` nem `focus-order-semantics`. A afirmação "axe-core sem violações" é verdadeira e cobre apenas regras estruturais.

O token `--eqx-orange-700` (`rgb(183 59 0)`, 5,9:1) já existe e não é usado para texto.

### B3 · A trilha do titular quebra no clique mais importante — verificado

`TitularPortalPage.tsx:62` gera `CT-2026-448${aleatório}` e navega. `journeyPosition` faz `steps.indexOf(href)` com string exata, e o passo 2 da trilha `ep05-titular` é o literal `/titular/contestacoes/CT-2026-448120`. Qualquer outro protocolo devolve `null`: o `JourneyNav` desaparece, as setas desabilitam e `TopBar.tsx:22` — que também compara href exato — perde o épico e o badge de US-FE, exibindo "Início / Início".

Agrava: `DisputeTrackingPage.tsx` importa `useNavigate` mas **nunca** `useParams`. O passo 2 da trilha abre atrás de um formulário que pede protocolo e CPF de 11 dígitos, ignorando o parâmetro da URL. Ao vivo, o apresentador para a demo para digitar um CPF fictício.

### B4 · Drawer e Modal não prendem nem devolvem o foco

`Overlay.tsx:37-39` e `:113-115` fazem `panelRef.current?.focus()` e param aí — sem focus trap, sem restauração no elemento disparador, sem bloqueio de scroll. Vale para todos os overlays, inclusive os de ação irreversível (revogação de consentimento, aprovação de alçada). O `WelcomeTour` agrava ao abrir automaticamente e roubar o foco.

### B5 · `?state=error|empty` gera tela em branco em 41 das 47 telas com query

`ScreenLayout.tsx:45-63` afirma que a tela está simulando a exceção, mas só 6 telas importam `ErrorState`. Nas outras 41, `data` fica `null` e o `{query.data ? … : null}` não renderiza nada. Nas 9 telas sem query, o aviso aparece afirmando algo falso enquanto os dados funcionam.

### B6 · Nenhuma entidade persiste entre passos

Três rupturas concretas: "Simular contágio a partir deste nó" (`CockpitPage.tsx:275`) aponta para `/risco/carteira/contagio` sem parâmetro, e `ContagionPage` reinicia com origem fixa — coincide por sorte com a Aurora Log; `RatiosPage` afirma que os insumos vêm da tela de extração mas importa array estático; o dossiê do comitê monta seções estáticas sem um número das duas telas anteriores da própria trilha.

### B7 · Não existe roteiro de demonstração

`docs/` só tem a avaliação anterior. Com 15 trilhas e 56 telas, ninguém improvisa dez minutos coerentes diante de uma diretoria.

---

## 4. Trilhas artificiais (Ju — média 6,1/10)

Melhores: `ep03-parecer` (9), `ep02-recusa` (8), `ep06-titular` (8).

Artificiais, a refazer:

- **`ep04-confianca` (2/10)** — junta SLA de cubos com o fallback sem WebGL sob a persona inventada "Operação de dados". A visão 2D é requisito de compatibilidade do cockpit, não passo de jornada.
- **`ep03-contexto` (3/10)** — biblioteca, grupo econômico e custo de inferência sob "Gestor da carteira PJ", persona ausente da lista do produto. Pior: "Grupo econômico" revela os R$ 12,74 mi que o guardrail da trilha do parecer acusa como divergentes — pertence àquela trilha.
- **`ep01-modelo` (5/10)** — funde cientista de dados com integrador B2B, papéis que não se sobrepõem.

---

## 5. A narrativa que já existe e ninguém nomeou

Ju encontrou duas histórias completas escritas nos mocks, atravessando os seis épicos:

**Pessoa física.** Maria (CPF `123.***.**01`) é recusada às 11:04 de 27/07 com score 486 por dois apontamentos; vê no portal a consulta que o "Banco Parceiro S.A." fez sobre ela naquele minuto exato — que reaparece como ator `banco.parceiro.api` na trilha de auditoria às 11:19; contesta o apontamento de R$ 4.812 que jura ter quitado em 20/07; o credor responde que não localizou a baixa; em paralelo constrói histórico no coach com a conta de energia vinculada em maio, rumo à meta de 600 pontos.

**Pessoa jurídica.** A Metalúrgica Aurora de EP-03 pede R$ 8 mi e recebe R$ 5,5 mi condicionados por quebra de covenant; é o nó `cli-aurora-met` do grafo de carteira de EP-04; sua controlada logística inadimplente é a origem do bolsão de risco que o comitê vai discutir.

Duas histórias com conflito, evidência e desfecho — distribuídas em seis épicos que hoje se apresentam como seis produtos distintos.

---

## 6. Backlog priorizado para Eliza

### P0 — bloqueiam a demo

| # | Ação | Arquivos | Esforço |
|---|---|---|:--:|
| 1 | Fixture canônica: um personagem por linha de negócio, score/apontamentos/exposição idênticos em todos os épicos, com teste que falha na divergência | criar `src/app/story.ts`; `score-vivo/data.ts`, `sala-risco/data.ts`, `thinfile/data.ts` | G |
| 2 | Resolver trilha por `matchPath(item.path)` em vez de href literal, em `journeyPosition` e no `TopBar` | `src/app/journeys.ts`, `src/shell/TopBar.tsx:22` | M |
| 3 | `DisputeTrackingPage` lê `useParams` e dispensa o gate quando o protocolo vem da URL | `contestacao/DisputeTrackingPage.tsx`, `TitularPortalPage.tsx` | P |
| 4 | Corrigir contraste: `--color-accent-text` = `--eqx-orange-700` para todo uso tipográfico; adicionar `color-contrast`, `target-size`, `region`, `focus-order-semantics` à suíte axe | `eqx-tokens.css`, `ds/Badge.tsx`, `ds/Card.tsx`, `shell/JourneyNav.tsx`, `test/a11y.test.tsx` | M |
| 5 | `QueryBoundary` que honre `?state=` nas 56 telas; não exibir o aviso em telas sem query | `shell/ScreenLayout.tsx`, `lib/useMockQuery.ts`, 41 telas | G |
| 6 | Focus trap, restauração de foco e bloqueio de scroll em Drawer/Modal; tour só por ação do usuário | `ds/Overlay.tsx`, `shell/WelcomeTour.tsx` | M |
| 7 | Roteiro de demonstração navegável: rota `/roteiro` com 6 atos, 10 minutos, persona, frase-chave e número a apontar | criar `app/DemoScriptPage.tsx`, `docs/DEMO_SCRIPT.md` | M |
| 8 | Propagar a entidade nos três pontos de ruptura (cockpit→contágio, extração→índices, estresse→dossiê) | `sala-risco/*`, `copiloto-pj/*` | M |

### P1 — sustentam escrutínio

| # | Ação | Arquivos | Esforço |
|---|---|---|:--:|
| 9 | Dissolver `ep04-confianca` e `ep03-contexto`; separar `ep01-modelo`; validar persona por allowlist de 11 personas | `app/journeys.ts`, criar `app/personas.ts`, `test/journeys.test.tsx` | M |
| 10 | Saída ao fim de cada trilha e link para o roteiro no meio dela | `shell/JourneyNav.tsx:19,57-61` | P |
| 11 | Tornar o fio narrativo visível: `businessOutcome` e `connectsTo` por épico, personagem nomeado nas landings | `app/epics.ts`, `app/EpicLandingPage.tsx` | M |
| 12 | Validação em campo com `FieldShell.error` e foco no primeiro inválido, em vez de `toast.error` genérico | 7 telas com formulário | M |
| 13 | Equivalente textual real nos gráficos: `role="img"` fora do contêiner, `aria-label` com dados, tabela `visually-hidden`, sem `tabIndex` dentro de `role="img"` | `ds/charts/*` | M |
| 14 | Destravar CTAs: estado de verificação do parecer sobrevive à navegação; "Aceitar valores sugeridos" na extração | `copiloto-pj/OpinionEditorPage.tsx`, `ExtractionReviewPage.tsx` | M |

### P2 — acabamento

| # | Ação | Arquivos | Esforço |
|---|---|---|:--:|
| 15 | Sidebar: colapsar por padrão os épicos inativos, persistir em `localStorage`, elevar contraste dos rótulos para `text-white/70` | `shell/Sidebar.tsx` | M |
| 16 | Unificar link-botão em `buttonClass()` e alturas em `min-h-target`; registrar as 6 landings em `NAV_ITEMS` para entrarem no Ctrl+K | `shell/*`, `app/*`, `ds/Button.tsx` | M |
| 17 | Motion no conteúdo: entrada escalonada de cards, transição de número em `Metric`, `transition-transform` na seta do JourneyNav | `ds/Card.tsx`, `shell/JourneyNav.tsx:8` | P |
| 18 | Reversibilidade: desfazer em ações consequentes, toast com pausa no hover e botão de fechar | `ds/Toast.tsx`, `DisputeQueuePage`, `ConsentPage` | M |
| 19 | Contraste do heatmap na faixa de risco alto (hoje 1,85:1) e convergir as datas dos mocks para 27/07/2026 | `ds/charts/Matrix.tsx`, `sala-risco/data.ts` | P |

---

## 7. Veredito consolidado

O showcase deixou de ser um catálogo de 56 telas e passou a ter uma camada de jornada legítima, testada e presente em toda tela. Esse é um salto de categoria e vale os +15 pontos consolidados.

O que impede o nível de demo executiva premium não é falta de recurso — é confiabilidade sob os olhos de quem assiste. Existem quatro pontos em que a apresentação desmonta ao vivo: o mesmo titular vale 742 e está aprovado em EP-01 e vale 486 e está recusado em EP-02, EP-05 e EP-06; o passo 2 da trilha mais vendável do portfólio exige digitar um CPF fictício; o CTA que leva até lá derruba o rodapé de jornada e o breadcrumb; e a promessa de WCAG 2.2 AA não sobrevive a uma auditoria real porque a regra de contraste está excluída da suíte enquanto o laranja de 2,5:1 aparece em todas as 56 telas.

A boa notícia é que os oito P0 cabem numa sprint curta e nenhum deles exige tela nova. Executados, a aplicação sai da faixa de 68 para a de 85 — e aí sustenta um telão diante de um comitê da Equifax sem que o apresentador precise desviar de nada.
