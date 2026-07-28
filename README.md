# EBV Prisma

Repositório do produto **Prisma** (EBV) — crédito event-driven, decisão explicável, contestação e portfólio.

## Estrutura

```
Prisma/
└── backend/          # Java 21 · Spring Boot 3 · Hexagonal + DDD
    ├── docs/         # Plano, arquitetura, User Stories BE
    ├── src/          # Código (domain → application → infrastructure → presentation)
    ├── docker-compose.yml
    ├── Dockerfile
    └── pom.xml
```

## Backend

```bash
cd backend
docker compose up -d postgres redis kafka   # infra local
mvn spring-boot:run
```

- Swagger: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`
- Plano: [`backend/docs/PLANO_TRABALHO_BACKEND.md`](backend/docs/PLANO_TRABALHO_BACKEND.md)
- US: [`backend/docs/user-stories/`](backend/docs/user-stories/)

## Fontes UpStream

Briefing, Arquitetura V2 e DBA V2 permanecem no workspace Downstream (`99.DownStream/Resumo do UpStream/`). Catálogo BE espelhado em `backend/docs/user-stories/`.

## Graphify

```bash
cd backend
graphify . --wiki
graphify query "dependências EP-01 e EP-05"
```
