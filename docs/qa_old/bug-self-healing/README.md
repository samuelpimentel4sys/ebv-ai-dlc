# Bug da esteira (self-healing) — Console B2B

Arquivo pronto para colar **manualmente** antes de `qa contestacao`.

## O que muda

No link **Gerenciar credenciais**, a rota correta `/b2b/credenciais` vira `/b2b/credenciais-invalido`.

Cenário que falha: **C-04**.

## Como injetar (Ctrl+A / Ctrl+V)

1. Abra `docs/qa/bug-self-healing/ConsolePage.tsx`
2. `Ctrl+A` → `Ctrl+C`
3. Abra `frontend/src/epics/contestacao/ConsolePage.tsx`
4. `Ctrl+A` → `Ctrl+V` → salve
5. Confirme:

```bash
node docs/qa/scripts/qa-bug.cjs status
```

Deve mostrar `"ativo": true` e rota `"/b2b/credenciais-invalido"`.

Na esteira: Playwright falha → diagnóstico → **GO/NOGO**. Só com **GO** o Dev Kernel corrige o `Link` e reexecuta C-04.

A esteira **não** cola o bug por você.
