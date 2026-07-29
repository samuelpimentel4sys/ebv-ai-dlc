# Prisma PJ — Copiloto GenAI (EP-03)

Serviço **Python 3.12 · FastAPI · Hexagonal** — núcleo GenAI do Prisma.  
Java (`../backend`) continua dono de HITL/alçada, OIDC e BCs R1.

## Database (Supabase Prisma)

Mesmo Postgres do backend Java (`jrpjrvttiqustpfedxdz`):

```bash
cp .env.example .env   # DATABASE_URL + DATABASE_SSL=require
uv run python scripts/smoke_db.py
```

Migration: `alembic/versions/001_ep03_pj_genai_vector_tables.py` (já aplicada no Supabase).  
Tabelas: `tb_pj_*` (document, extraction, library, rag_chunk/answer/citation) + extensão `vector`.

## Quick start

```bash
cd backend-python
cp .env.example .env
# ajustar LOCAL_LLM_BASE_URL / keys conforme provider

uv sync
uv run uvicorn prisma_pj.presentation.main:app --reload --port 8090
```

- Health: http://localhost:8090/health  
- Ready: http://localhost:8090/ready  
- Smoke LLM: `POST /api/v1/pj/smoke/llm` `{"prompt":"ping"}`  
- OpenAPI: http://localhost:8090/docs  

```bash
uv run pytest
uv run ruff check src tests
uv run mypy src
```

## Providers

`INFERENCE_PROVIDER=local|bedrock|openai|gemini` — ver [docs/ADR-001-llm-provider-multi.md](docs/ADR-001-llm-provider-multi.md).  
Voz/STT/TTS **não** entram neste serviço.

## Plano

[docs/PLANO_TRABALHO_EP03_PYTHON.md](docs/PLANO_TRABALHO_EP03_PYTHON.md)
