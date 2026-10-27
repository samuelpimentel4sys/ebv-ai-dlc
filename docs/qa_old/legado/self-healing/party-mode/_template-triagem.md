# Party Mode — Triagem Self-Healing

> Test ID: [MOD-XX] · Data: {DD/MM/YYYY}

## Participantes

- QA Master
- Dev DownStream ({dev-agent})
- Contexto Playwright

## Falha resumida

(cole error + screenshot path)

## Posições

### QA Master
- Classificação proposta: app_bug | spec_stale | ambiguous
- Cenário BDD: ...

### Dev DownStream
- Causa raiz provável: ...
- Arquivos a alterar: ...

## Decisão

- [ ] **app_bug** → handoff Dev
- [ ] **spec_stale** → Healer L1
- [ ] **ambiguous** → escalar PO

## Plano de fix (max 5 passos)

1. ...
2. ...

## Próximo passo

`@Agents DownStream/{dev-agent}.md` → implementar → `npx playwright test -g "[MOD-XX]"`
