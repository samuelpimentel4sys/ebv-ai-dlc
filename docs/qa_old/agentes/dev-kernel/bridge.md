# Dev Kernel — ponte (Prisma)

> Equivalente ao `dev-fourblox/bridge.md` do DEMO QA.  
> No Prisma o Dev não é FourBlox: o stack do arquivo falho escolhe o Kernel.

Ativar **somente** com GO no gate de self-healing, quando existir `docs/qa/setup/.qa-falha-pendente.json`.

## Banner

```
╔══════════════════════════════════════════════════╗
║  ⚛️ DEV KERNEL ATIVO — correção de aplicação     ║
╚══════════════════════════════════════════════════╝
```

## Roteamento

| Path da falha | Kernel | Corrige |
|---------------|--------|---------|
| `frontend/` | Sofia (React) | UI, rotas, cliente API |
| `backend/` | Noah (Java) | BFF, security, disputes |
| `backend-python/` | Emilly (Python) | RAG, GenAI, guardrails |

Contestação C-04 (bug de rota no Console) → **Sofia / frontend**.

## Regras

- Corrigir **produto**, não a spec
- Diff mínimo — uma causa raiz
- Após o fix: `node docs/qa/scripts/qa-self-healing.cjs resolve '{"resumoCorrecao":"...","arquivosAlterados":["..."]}'`
- Devolver o controle ao Playwright para reexecutar **só** o cenário
- Não commitar a menos que o usuário peça
