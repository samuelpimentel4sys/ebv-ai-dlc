# Módulos da Esteira QA Prisma

Cada módulo = **um manifesto JSON**. O elenco de agentes é o mesmo. Troca o manifesto, testa outra tela.

## Módulo padrão

| ID | Nome | Comando no chat |
|----|------|-----------------|
| `contestacao` | EP-05 · Contestação & Console B2B | `qa contestacao` · `qa prisma` · `esteira qa` |

Sem citar módulo → usar **`contestacao`**.

## Adicionar qualquer outra tela / feature

```text
node docs/qa/scripts/qa-modulo.cjs scaffold sala-risco "EP-04 · Sala de Risco"
```

1. Preencha `telas[].arquivos`, `apis`, `inputs.uiJson`
2. Crie `docs/qa/inputs/ui-elements/sala-risco-ui.json`
3. Valide: `node docs/qa/scripts/qa-modulo.cjs summary sala-risco`
4. Chat: `qa sala-risco`

`"padrao": true` em **um** manifesto só.

## CLI

```bash
node docs/qa/scripts/qa-modulo.cjs list
node docs/qa/scripts/qa-modulo.cjs summary contestacao
node docs/qa/scripts/qa-modulo.cjs sources contestacao
node docs/qa/scripts/qa-modulo.cjs next-version contestacao
```
