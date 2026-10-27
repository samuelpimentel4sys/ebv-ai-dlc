# Output — Automação Playwright

**Agente:** Playwright (Etapa 3)

## Estrutura por módulo (versionada)

```
automacao/
└── {modulo}/
    └── v{N}-{YYYYMMDD}/
        ├── playwright.config.ts
        ├── {modulo}.data.ts      # import ../../massa-dados/{modulo}-massa-v{N}.fixture.json
        ├── {modulo}.spec.ts      # um test() por cenário [MOD-XX]
        └── seed.spec.ts          # opcional — setup Playwright Agents
```

**N** = mesma versão de BDD + massa do pipeline run (ver `.pipeline-state.json` → `output_version`).

## Inputs consumidos

| Input | Path |
|-------|------|
| UI JSON | `inputs/ui-elements/{modulo}-ui.json` |
| BDD | `outputs/cenarios-bdd/{projeto}/v{N}-{date}/*.html` + `.md` |
| Massa SQL | `outputs/massa-dados/{modulo}-massa-v{N}.sql` |
| Massa fixture | `outputs/massa-dados/{modulo}-massa-v{N}.fixture.json` |

## Rodar

```powershell
cd outputs/automacao/{modulo}/v{N}-{date}
npm install -D @playwright/test
npx playwright install
npx playwright test --reporter=list,html
```

Ou via esteira: `workflows/run-playwright.ps1` (lê `output_version.automacao_dir`).

Ver `_template/` para scaffold inicial.
