# Esteira QA Prisma

Espelho do pacote **DEMO QA** (Reembolso), montado neste workspace para o produto Prisma.

Tudo roda no **Cursor Chat**. Você escolhe o módulo; o orquestrador ativa os agentes.

```
🛠️ Pré-setup → 🐛 Bug manual (opcional) → 🎭 Gherkin → 🧪 DataForge → 🎬 Playwright → 🔴 Self-heal
```

## Qual módulo testar agora?

**Padrão só se você citar o id.** Sem id (`esteira qa`) o orquestrador pergunta o módulo.

**`qa contestacao`** — EP-05 · Contestação & Console B2B

Outra tela/feature: crie manifesto e chame `qa {id}` — a esteira é a mesma.

---

## Ambiente lab

| | |
|--|--|
| **Front** | Vite `http://localhost:5173` |
| **BFF Java** | `http://localhost:8080` (proxy `/api`) |
| **Python** | `http://localhost:8090` — browser **nunca** chama direto |
| **Data** | mock FE por default; live = `VITE_DATA_MODE=live` + Java UP |

---

## Comandos no chat (ativar esteira e agentes)

| Ação | Digite no chat |
|------|----------------|
| Pré-setup | `qa preparar` ou `qa preparar contestacao` |
| **Esteira completa** | **`qa contestacao`** · `qa prisma` · `esteira qa` |
| Só GherkinFlow | `qa gherkinflow` |
| Só DataForge | `qa dataforge` |
| Só Playwright | `qa playwright` |
| Status artefatos | `qa status` |
| Outro módulo | `qa sala-risco` (depois do scaffold) |
| Self-healing | automático após falha; você responde **GO** ou **NOGO** |
| Encerrar agente | `DA` / `dismiss` |

### Terminal (o agente executa; você não precisa)

```bash
node docs/qa/scripts/qa-preparar.cjs contestacao
node docs/qa/scripts/qa-modulo.cjs list
node docs/qa/scripts/qa-modulo.cjs summary contestacao
node docs/qa/scripts/qa-status.cjs contestacao
node docs/qa/scripts/qa-self-healing.cjs pending
node docs/qa/scripts/qa-bug.cjs status
node docs/qa/scripts/qa-env-check.cjs
```

---

## Passo 1 — Preparar

Chat: `qa preparar contestacao`

Garante estrutura + env-check. Front DOWN → `cd frontend && npm run dev`.

## Passo 2 — Bug self-healing (opcional)

Fora do chat, **você** cola o arquivo:

1. `docs/qa/bug-self-healing/ConsolePage.tsx`
2. sobre `frontend/src/epics/contestacao/ConsolePage.tsx`
3. Quebra C-04 (link Credenciais → rota inválida)

Conferir: `node docs/qa/scripts/qa-bug.cjs status` → `"ativo": true`

A esteira **não** injeta o bug.

## Passo 3 — Rodar

Chat: `qa contestacao`

| Etapa | Agente | Gera |
|-------|--------|------|
| 1 | GherkinFlow | `docs/qa/outputs/gherkinflow/contestacao/CONTESTACAO-BDD-vN.md` (8–12 cenários) |
| 2 | DataForge | `docs/qa/outputs/dataforge/contestacao/contestacao.data.vN.js` |
| 3 | Playwright | spec + Chromium headed |
| 3b | Self-healing | se falhar: GO/NOGO → Dev Kernel corrige app → reteste só o cenário |

## Volume (esteira funcional)

Sem teto de DEMO. GherkinFlow cobre **todas** as telas do manifesto. DataForge gera massa de **todos** os IDs. Playwright **gera a spec a partir do BDD + massa da mesma vN** e **executa todos** os `test()`.

CPF/CNPJ: válidos fictícios, **nunca** `123456…`.

Depois do run: `node docs/qa/scripts/qa-relatorio.cjs {modulo} {N}` → HTML Foursys + Excel (logs, png, webm, traces).

`esteira qa` / `qa prisma` **sem** id → orquestrador **pergunta** o módulo.

Versões: cada run cria trio novo `vN`. Nunca sobrescreve.

Check Cursor: `node docs/qa/scripts/qa-esteira-check.cjs [modulo]`

---

## Reusar para outra tela

```bash
node docs/qa/scripts/qa-modulo.cjs scaffold sala-risco "EP-04 · Sala de Risco"
```

Preencha `telas[].arquivos` + `docs/qa/inputs/ui-elements/sala-risco-ui.json`.  
Chat: `qa sala-risco`.

Épicos já no FE: `contestacao` · `sala-risco` · `copiloto-pj` · `score-vivo` · `thinfile` · `explicabilidade`.

---

## Estrutura (igual DEMO QA)

```
docs/qa/
├── README.md                 ← este guia
├── bug-self-healing/         ← código com bug pra colar
├── setup/                    ← estado + audit self-healing
├── modulos/                  ← manifestos (um por feature)
├── scripts/                  ← modulo, status, self-healing, preparar
├── inputs/ui-elements/       ← seletores
├── outputs/
│   ├── gherkinflow/{modulo}/
│   ├── dataforge/{modulo}/
│   └── playwright/{modulo}/
├── agentes/                  ← elenco (QA + Dev Kernel + orquestrador)
└── legado/                   ← jornada QA Master + EP-05 v1 (não apagar)
```

Skills Cursor: `.cursor/skills/<agente>/SKILL.md`  
Regra de ativação: `.cursor/rules/qa-esteira-prisma.mdc`

---

## Regras

- Não `npm install` na frente do cliente — isso é pré-setup
- Não injetar bug pela esteira
- Playwright gera spec **do BDD** e preenche **com a massa** — não inventa dado na spec
- Playwright, não Cypress
- Sem SQL fictício no E2E live
- Self-healing: **GO/NOGO humano**; Dev corrige app, não o teste
