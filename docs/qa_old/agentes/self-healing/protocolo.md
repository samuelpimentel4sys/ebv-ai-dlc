# Self-Healing — protocolo Prisma

> Extraído do DEMO QA (`agentes/self-healing/protocolo.md`) + Solution Center (`QA Agents/docs/self-healing-loop.md`).

## Regras locais (executáveis neste repo)

- Bug **manual** do apresentador — esteira **não** injeta
- Falha → `docs/qa/setup/.qa-falha-pendente.json`
- Dev **Kernel** corrige no chat (stack pelo path do arquivo)
- CLI: `node docs/qa/scripts/qa-self-healing.cjs pending`

## Exemplo Contestação (C-04)

1. Colar `docs/qa/bug-self-healing/ConsolePage.tsx` em `frontend/src/epics/contestacao/ConsolePage.tsx`
2. Rota `/b2b/credenciais` vira `/b2b/credenciais-invalido`
3. Playwright falha C-04 → GO → Dev corrige o `Link` → reteste verde

## Conferir bug

```bash
node docs/qa/scripts/qa-bug.cjs status
```

## Classificação rápida

| Sintoma | Camada | Ação |
|---------|--------|------|
| locator / timeout de carga / flake | L1 | Ajustar spec, re-run |
| massa incoerente | DataForge | Regenerar constante, re-run |
| ambiente DOWN | QA Master / orquestrador | Subir Vite/Java |
| comportamento ≠ BDD | L2 | GO/NOGO → Dev Kernel |
