# Output — Cenários BDD

**Agente:** GherkinFlow (Etapa 1)

## Formato canônico — tabela BDD (7 colunas)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|--------------------------|--------------|---------------|--------------|----------|----------------------|

- **Entrega:** par **HTML + MD** por tela (mesmos IDs e linhas)
- HTML: layout Foursys (`html-output-template.html`)
- MD: tabela editável (`compartilhar/_template-bdd-tabela.md`)
- **Uma linha por cenário** · pills Positivo / Negativo / Regressivo no HTML
- **Proibido:** bullets Given/When/Then, blocos ` ```gherkin ` Cucumber, HTML sem par `.md`

Doc: `compartilhar/formato-tabela-bdd.md`

## Estrutura

```
cenarios-bdd/
└── {projeto}/
    └── v{N}-{YYYYMMDD}/
        ├── EP05-F{NN}-{tela}.html
        └── EP05-F{NN}-{tela}.md
```

## Espelho DataForge

`inputs/contexto-gherkin/` — consolidação multi-feature (mesma tabela 7 colunas)

## Gate

- [ ] `.html` + `.md` existem por feature (mesmo prefixo)
- [ ] Tabela 7 colunas preenchida em ambos
- [ ] IDs `[MOD-XX]` estáveis e iguais entre HTML e MD
- [ ] 15–25 cenários (curated)
- [ ] reg-notes em regressivos
- [ ] ⚠️ em integrações SQ-11
