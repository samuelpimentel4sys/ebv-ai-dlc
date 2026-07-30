# Modo Showcase — só Supabase (sem lab 192.168.31.47)

| Campo | Valor |
|-------|-------|
| **Flag** | `PRISMA_SHOWCASE=true` |
| **Profiles** | `supabase` (+ `showcase` auto) — **sem** `infra` |
| **Data** | 2026-07-30 |

## O que sobe

| Precisa | Não precisa |
|---------|-------------|
| Java `:8080` | Redis / Kafka / Keycloak |
| Supabase Postgres + Flyway | Neo4j / ONNX / Fairlearn / MinIO |
| FE `:5173` (opcional) | Emilly Python `:8090` (GenAI = stub) |
| | WireMock Liveness / ClamAV / OTel |

## Como ligar

```powershell
cd Prisma/backend
# no .env:
#   PRISMA_SHOWCASE=true
#   SPRING_PROFILES_ACTIVE=supabase
#   SPRING_DATASOURCE_PASSWORD=...

$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$mvn = "..\.tools\apache-maven-3.9.6\bin\mvn.cmd"
Get-Content .\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2)
  Set-Item -Path "Env:$($k.Trim())" -Value $v.Trim()
}
& $mvn spring-boot:run
```

Template: [`.env.showcase.example`](../.env.showcase.example)

## Como desligar

```env
PRISMA_SHOWCASE=false
# ou remova a linha
SPRING_PROFILES_ACTIVE=supabase,infra   # lab completo de novo
```

## Smoke

```bash
curl -i http://localhost:8080/actuator/health
# Header: X-Prisma-Showcase: true

curl -s http://localhost:8080/api/v1/showcase/status
curl -s http://localhost:8080/api/v1/pj/genai/health
# → stub prisma-pj-stub
```

## Comportamento

| Área | Showcase |
|------|----------|
| Eventos crédito | `LocalCreditEventPublisher` (memória) |
| Grafo / ONNX / Liveness | stub |
| WORM | filesystem `./data/worm` |
| GenAI BFF | JSON stub (`PRISMA_GENAI_ENABLED=false`) |
| HITL F04 | Java real (JDBC Supabase) |
| OIDC | off |

Se `PRISMA_SHOWCASE=true` e profile `infra` estiver no `.env`, o `ShowcaseEnvironmentPostProcessor` **remove** `infra` no boot.

## Lab ≠ DoD

Showcase = demo FE. Não declarar US Done / DoD.

_Noah · 2026-07-30_
