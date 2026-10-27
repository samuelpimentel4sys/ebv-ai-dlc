# Agentes da esteira QA Prisma

Elenco extraído do pacote DEMO QA (Reembolso) e adaptado ao Prisma.  
Não misturar com catálogo BMAD geral — este é o time da esteira.

## Elenco

| Papel | Agente | Arquivo | Função |
|-------|--------|---------|--------|
| Condutor | Orquestrador | `orquestrador/orquestrador.md` | Banner + ativa QA em série |
| QA | GherkinFlow | `gherkinflow/gherkinflow.md` | BDD a partir do código |
| QA | DataForge | `dataforge/dataforge.md` | Massa JS por cenário |
| QA | Playwright | `playwright/playwright.md` | Spec + execução headed |
| Protocolo | Self-healing | `self-healing/self-healing.md` | Gate GO/NOGO após falha |
| Dev | Dev Kernel | `dev-kernel/bridge.md` | Corrige app (só com GO) — Sofia/Noah/Emilly conforme stack |

```
docs/qa/agentes/
├── README.md
├── orquestrador/orquestrador.md
├── gherkinflow/gherkinflow.md
├── dataforge/dataforge.md
├── playwright/playwright.md
├── self-healing/
│   ├── self-healing.md
│   └── protocolo.md
└── dev-kernel/
    └── bridge.md
```

Stubs Cursor: `.cursor/skills/<agente>/SKILL.md` → apontam para cá.

## Comandos (chat)

| Comando | Quem age |
|---------|----------|
| `qa contestacao` / `qa prisma` / `esteira qa` | Orquestrador → GherkinFlow → DataForge → Playwright (+ Self-healing/Dev se falha + GO) |
| `qa gherkinflow` / `qa dataforge` / `qa playwright` | Um agente isolado |
| `qa {modulo}` | Mesma esteira, outro manifesto |

## Fora deste escopo

- `qa-master.md` (Solution Center) — persona estratégica; **não** substitui o orquestrador desta pasta
- Artefatos EP-05 antigos — `docs/qa/legado/`
