# EBV Prisma

Repositório do produto **Prisma** (EBV) — crédito event-driven, decisão explicável, contestação e portfólio.

## Estrutura

```
Prisma/
├── backend/          # Java 21 · Spring Boot 3 · Hexagonal + DDD (Noah)
├── backend-python/   # Python 3.12 · FastAPI · EP-03 Copiloto GenAI (Emilly)
└── frontend/
```

## Backend (Java)

```bash
cd backend
docker compose up -d postgres redis kafka   # infra local
mvn spring-boot:run
```

- Swagger: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- Plano: [`backend/docs/PLANO_TRABALHO_BACKEND.md`](backend/docs/PLANO_TRABALHO_BACKEND.md)
- US: [`backend/docs/user-stories/`](backend/docs/user-stories/)

## Backend Python (EP-03 GenAI)

```bash
cd backend-python
cp .env.example .env
uv sync
uv run uvicorn prisma_pj.presentation.main:app --port 8090
```

- Health: `http://localhost:8090/health`
- Plano: [`backend-python/docs/PLANO_TRABALHO_EP03_PYTHON.md`](backend-python/docs/PLANO_TRABALHO_EP03_PYTHON.md)
- Providers: `local` | `bedrock` | `openai` | `gemini` (sem voz)

## Fontes UpStream

Briefing, Arquitetura V2 e DBA V2 permanecem no workspace Downstream (`99.DownStream/Resumo do UpStream/`). Catálogo BE espelhado em `backend/docs/user-stories/`.

## Graphify

```bash
cd backend
graphify . --wiki
graphify query "dependências EP-01 e EP-05"
```
