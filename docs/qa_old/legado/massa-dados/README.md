# Output — Massa de Dados

**Agente:** DataForge (Etapa 2)

## Estrutura

```
massa-dados/
├── {modulo}-massa-v1.sql          # PostgreSQL / MySQL / MSSQL
└── {modulo}-massa-v1.js           # MongoDB / NoSQL
```

## Regras do script

- `BEGIN` / `COMMIT` (SQL)
- INSERTs puros, ordem topológica FK
- 5–25 linhas/tabela
- CPF/CNPJ/telefone BR válidos

## Gate

- [ ] Executa sem erro de constraint
- [ ] Cobre cenários em `inputs/contexto-gherkin/`
- [ ] Copiar extrato relevante para `outputs/automacao/{modulo}/*.data.ts`
