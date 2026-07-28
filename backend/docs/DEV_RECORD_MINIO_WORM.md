# DEV RECORD — MinIO WORM patch (ops ack)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Infra** | MinIO/ClamAV/OTel/Jaeger UP em `192.168.31.47` |
| **Código** | `WormS3Config` — endpointOverride + path-style |

## Env lab

```env
PRISMA_WORM_BACKEND=s3
PRISMA_WORM_S3_ENDPOINT=http://192.168.31.47:9000
PRISMA_WORM_S3_PATH_STYLE=true
PRISMA_WORM_S3_BUCKET=prisma-worm
AWS_ACCESS_KEY_ID=prisma
AWS_SECRET_ACCESS_KEY=***
```

## Ainda pendente

- ClamAV → `AntivirusPort` anexos F08
- Micrometer/OTel export → Jaeger
- Camunda P2

Ref: [`INSTRUCAO_DOCKER_SERVICOS_OBS.md`](./INSTRUCAO_DOCKER_SERVICOS_OBS.md) §13
