# Agentes da demo — elenco principal

Pasta **só** dos agentes da esteira E2E Reembolso (pré-vendas).  
Não misturar com catálogo geral (`architecture-template/agents`, Solution Center, etc.).

## Elenco

| Papel | Agente | Arquivo | Função na demo |
|-------|--------|---------|----------------|
| Condutor | Orquestrador | `orquestrador/orquestrador.md` | Banner + ativa QA em série |
| QA | GherkinFlow | `gherkinflow/gherkinflow.md` | BDD a partir do código |
| QA | DataForge | `dataforge/dataforge.md` | Massa JS por cenário |
| QA | Playwright | `playwright/playwright.md` | Spec + execução headed |
| Protocolo | Self-healing | `self-healing/self-healing.md` | Gate GO/NOGO após falha |
| Dev | Dev FourBlox | `dev-fourblox/bridge.md` | Corrige app (só com GO) |

```
DEMO/agentes/
├── README.md
├── orquestrador/orquestrador.md
├── gherkinflow/gherkinflow.md
├── dataforge/dataforge.md
├── playwright/playwright.md
├── self-healing/
│   ├── self-healing.md
│   └── protocolo.md
└── dev-fourblox/
    └── bridge.md
```

Stubs Cursor (descoberta): `.cursor/skills/<agente>/SKILL.md` → redirecionam para cá.

## Comandos

| Comando | Quem age |
|---------|----------|
| `demo reembolso` | Orquestrador → GherkinFlow → DataForge → Playwright (+ Self-healing/Dev se falha + GO) |
| `demo gherkinflow` / `demo dataforge` / `demo playwright` | Um agente QA isolado (rules em `.cursor/rules/pre-sales-demo-agente-*.mdc`) |

## Fora deste escopo

- `architecture-template/agents/qa-master.md` — persona BMAD geral, **não** é agente da pasta DEMO
- Showcase meta / outros agentes Foursys — não moram aqui
