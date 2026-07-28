# EBV Prisma — Backend

Java 21 · Spring Boot 3.4 · Hexagonal Architecture · DDD · SOLID · TDD

## Quick start

```bash
# Infra
docker compose up -d postgres redis kafka

# App
mvn spring-boot:run
```

| Recurso | URL |
|---------|-----|
| Health | http://localhost:8080/actuator/health |
| Swagger | http://localhost:8080/swagger-ui.html |
| API docs | http://localhost:8080/api-docs |

## Layout Hexagonal

```
domain/          → aggregates, value objects, ports (ZERO Spring/JPA)
application/     → use cases (@Service, @Transactional)
infrastructure/  → adapters (JPA, Kafka, Redis, externos)
presentation/    → REST controllers, DTOs, exception handler
```

## Docs

- [Plano de trabalho](docs/PLANO_TRABALHO_BACKEND.md)
- [User Stories BE](docs/user-stories/) — 56 US (EP-01…EP-06)
- [Arquitetura Hexagonal](docs/architecture/HEXAGONAL.md)

## Graphify

```bash
graphify . --wiki --no-viz
graphify query "caminho quente TITULAR SCORE DECISAO"
graphify explain "PRISMA-EP-01"
```
