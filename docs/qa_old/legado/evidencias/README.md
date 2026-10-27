# Output — Evidências

**Origem:** execução Playwright + QA Master (métricas)

## Estrutura

```
evidencias/
├── playwright-report/       # npx playwright show-report
├── test-results.json      # reporter JSON
├── traces/                # --trace on
├── screenshots/           # on failure
└── metricas/
    └── {modulo}-{data}.md
```

## Quando gerar

- Após cada `npx playwright test`
- Após Self-Healing re-run bem-sucedido
- Para apresentação POC (ver `compartilhar/plano-de-trabalho.md`)

## Gate apresentação

- [ ] Report HTML
- [ ] ≥ 1 trace de falha + ≥ 1 trace pós-heal (se Etapa 4 executada)
- [ ] Screenshot dos cenários críticos
