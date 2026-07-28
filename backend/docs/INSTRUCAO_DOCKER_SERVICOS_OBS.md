# Instrução — serviços Docker novos (OBS-14 / 15 / infra lab)

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Ops / Walter — host lab (`192.168.31.47` ou notebook) |
| **Ref** | [`ADR_BACKLOG_OBS_14_15_16.md`](./ADR_BACKLOG_OBS_14_15_16.md) · ciclo 2 |
| **Compose** | [`../docker-compose.obs.yml`](../docker-compose.obs.yml) |
| **Data** | 2026-07-28 |

> **Escopo:** só **subir containers**. Isso **não** fecha DoD das US — falta ligar adapters no BE Java (e, no Camunda, migrar FSM).

---

## 1. O que já existe (não repetir)

| Serviço | Onde | Porta | Compose atual |
|---------|------|-------|---------------|
| Postgres / Redis / Kafka | lab `47` ou local | 5432 / 6379 / 9094 | `docker-compose.yml` (local) |
| Neo4j | `47` | `7687` | fora deste arquivo |
| ONNX scorer | `47` | `8091` | fora |
| Fairlearn | `47` | `8092` | fora |
| WireMock Liveness | `47` ou local | `8093` | `docker-compose.liveness.yml` |
| Keycloak | `47` | (OIDC) | doc Redis/Kafka/Keycloak |

Este documento cobre só o **pacote OBS infra novo**.

---

## 2. Pacote novo — o que subir

| # | Serviço | OBS | Porta host | Prioridade | Fecha DoD sozinho? |
|---|---------|-----|------------|------------|--------------------|
| 1 | **MinIO** (S3 lab + Object Lock) | 15 / WORM | `9000` API · `9001` console | **P0** | Não — setar `PRISMA_WORM_BACKEND=s3` |
| 2 | **ClamAV** | 15 F08 | `3310` | **P0** | Não — falta port scan no upload |
| 3 | **OTel Collector** | 14 | `4317` gRPC · `4318` HTTP | **P1** | Não — instrumentar BE |
| 4 | **Jaeger** (UI traces) | 14 | `16686` | **P1** | Só visualização |
| 5 | **Camunda 7** (opcional) | 15 F02 | `8088` | **P2** | Não — integração workflow |
| — | Neo4j / ONNX / Fairlearn | EP-04/02 | já no `47` | — | Não recriar aqui |

**Fora do Docker (código):** SLA dias úteis EBV · SHAP/DiCE/PDFBox · migração FSM→Camunda · Micrometer OTLP no Spring.

---

## 3. Pré-requisitos

1. Docker Engine + Compose plugin no host
2. Portas livres: `9000`, `9001`, `3310`, `4317`, `4318`, `16686` (+ `8088` se Camunda)
3. Repo atualizado com `Prisma/backend/docker-compose.obs.yml`
4. Rede: notebook do Walter / FE alcança o host se serviços forem remotos

---

## 4. Subir o pacote

No host (ex.: `192.168.31.47` ou máquina local):

```bash
cd /caminho/para/Prisma/backend

# P0 + P1 (recomendado)
docker compose -f docker-compose.obs.yml up -d minio clamav otel-collector jaeger

# Opcional P2
docker compose -f docker-compose.obs.yml --profile camunda up -d

docker compose -f docker-compose.obs.yml ps
```

### Health checks rápidos

```bash
# MinIO
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9000/minio/health/live

# Jaeger UI
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:16686/

# OTel (HTTP receiver sobe mesmo sem spans)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:4318/v1/traces \
  -H 'Content-Type: application/json' -d '{}'

# ClamAV — porta 3310 aberta (nc/Test-NetConnection)
```

Windows (ops):

```powershell
Test-NetConnection 192.168.31.47 -Port 9000
Test-NetConnection 192.168.31.47 -Port 3310
Test-NetConnection 192.168.31.47 -Port 16686
```

---

## 5. MinIO — bucket WORM lab

Console: `http://<host>:9001`  
User/pass default compose: `prisma` / `prismaPrisma1` (trocar em prod).

Criar bucket (UI ou `mc`):

```bash
docker run --rm --network host minio/mc alias set local http://127.0.0.1:9000 prisma prismaPrisma1
docker run --rm --network host minio/mc mb --with-lock local/prisma-worm --ignore-existing
```

### Env BE (props que **já existem**)

```env
PRISMA_WORM_BACKEND=s3
PRISMA_WORM_S3_BUCKET=prisma-worm
PRISMA_WORM_S3_REGION=us-east-1
PRISMA_WORM_S3_PREFIX=decisions/
PRISMA_AUDIT_WORM_BACKEND=s3
PRISMA_AUDIT_WORM_S3_PREFIX=audit/
# Credenciais via AWS SDK DefaultCredentialsProvider:
#   AWS_ACCESS_KEY_ID=prisma
#   AWS_SECRET_ACCESS_KEY=prismaPrisma1
```

### Gap conhecido (fechado no BE)

`WormS3Config` aceita `prisma.worm.s3.endpoint` + `path-style`.  
Com `PRISMA_WORM_S3_ENDPOINT=http://192.168.31.47:9000` o lab usa MinIO.

---

## 6. ClamAV — o que esperar

- Daemon `clamd` na porta **3310**
- BE **ainda não** chama ClamAV no ciclo 2 — container fica pronto para próximo adapter (`AntivirusPort`)
- Até o adapter: anexos F08 continuam só MIME allowlist + FS/S3

Smoke opcional (quando adapter existir): upload EICAR → expect reject.

---

## 7. OTel + Jaeger — o que esperar

| Peça | Função |
|------|--------|
| `otel-collector` | Recebe OTLP `4317`/`4318` → exporta Jaeger |
| `jaeger` | UI `http://<host>:16686` |

BE hoje: métricas lab SQL — **sem** export OTLP ligado.  
Próximo passo código (OBS-14): Micrometer OTLP ou Java agent apontando:

```env
# quando instrumentar
OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.31.47:4317
OTEL_SERVICE_NAME=prisma-backend
```

Até lá: Jaeger vazio = normal.

---

## 8. Camunda 7 (profile `camunda`) — opcional

```bash
docker compose -f docker-compose.obs.yml --profile camunda up -d
```

- UI/API: `http://<host>:8088`
- **Não** substitui FSM da contestação automaticamente
- Usar só se sprint F02 BPMN estiver priorizado

---

## 9. Mapa de portas (host lab sugerido)

| Porta | Serviço |
|------:|---------|
| 9000 | MinIO S3 API |
| 9001 | MinIO Console |
| 3310 | ClamAV |
| 4317 | OTel gRPC |
| 4318 | OTel HTTP |
| 16686 | Jaeger UI |
| 8088 | Camunda 7 (opcional) |

Evitar colisão com: `8080` BE · `8090` Emilly · `8091` ONNX · `8092` Fairlearn · `8093` Liveness · `7687` Neo4j · `9094` Kafka.

---

## 10. Checklist ops → Noah

- [ ] `docker compose -f docker-compose.obs.yml up -d` (minio, clamav, otel, jaeger)
- [ ] Portas acessíveis do notebook Walter
- [ ] Bucket `prisma-worm` criado
- [ ] Credenciais MinIO passadas ao Noah (canal seguro / `.env` local)
- [ ] (Opcional) Camunda profile
- [ ] Avisar Noah → ligar WORM S3 no `.env` + restart BE · depois adapters ClamAV/OTel

---

## 11. Parar / limpar

```bash
cd /caminho/para/Prisma/backend
docker compose -f docker-compose.obs.yml --profile camunda down
# dados MinIO/Jaeger: volumes nomeados — down -v apaga
```

---

## 12. Relação com DoD

| Depois do compose | Ainda falta (código) |
|-------------------|----------------------|
| MinIO UP | `PRISMA_WORM_BACKEND=s3` + endpoint MinIO + smoke decisão/anexo |
| ClamAV UP | `AntivirusPort` no F08 |
| OTel/Jaeger UP | export traces/métricas + p95 real |
| Camunda UP | BPMN contestação + port out |

Ver backlog: [`ADR_BACKLOG_OBS_14_15_16.md`](./ADR_BACKLOG_OBS_14_15_16.md).

---

## 13. Ack ops — host `192.168.31.47` (2026-07-28)

Checklist recebido por Noah:

| Item | Status |
|------|--------|
| MinIO `:9000` / Console `:9001` | [x] healthy |
| Bucket `prisma-worm` + Object Lock | [x] |
| ClamAV `:3310` | [x] PONG |
| OTel `:4317`/`:4318` | [x] |
| Jaeger `:16686` | [x] |
| Camunda | [ ] P2 — não subir |

**Patch Noah:** `WormS3Config` com `PRISMA_WORM_S3_ENDPOINT` + path-style + checksum relaxado MinIO.  
Env lab: WORM `s3` + `AWS_ACCESS_KEY_ID`/`SECRET` apontando MinIO.

Pendências código: ClamAV adapter · OTel export no Spring · Camunda.

_Noah · 2026-07-28_
