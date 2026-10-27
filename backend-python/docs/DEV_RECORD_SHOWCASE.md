# DEV_RECORD — SHOWCASE_MODE (Emilly · EP-03)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-30 |
| **Agente** | Emilly (`dev-python-esp`) |
| **Escopo** | Modo showcase: só Supabase real |

## O que entrou

- `SHOWCASE_MODE` em `Settings` — força `inference_provider=stub`, `oidc_enabled=false`, `group_graph_backend=stub`, index `v1-showcase-stub` (se default local)
- `StubLlmAdapter` — parecer por seção (RESUMO/INDICES/RISCOS/RECOMENDACAO) + eco smoke
- `StubEmbedAdapter` — vetor L2 determinístico `RAG_VECTOR_DIMS` (pgvector real)
- Factory / health / ready / lifespan banner
- `.env.example` + README

## Como usar

```env
SHOWCASE_MODE=true
DATABASE_URL=...supabase...
DATABASE_SSL=require
```

Sem Ollama, Redis, Keycloak. Desligar: `SHOWCASE_MODE=false`.
