# Provisionamento — Liveness / Rekognition (lab)

| Campo | Valor |
|-------|-------|
| **US** | `EP05-F01-US-BE-01` Orquestração Sessão Liveness |
| **Owner** | Noah (Prisma BE) |
| **Flyway** | `V51__ep05_f01_liveness_biometria.sql` |

## O que dá pra controlar em Docker

AWS **Face Liveness** (`CreateFaceLivenessSession`) **não** é emulado pelo LocalStack.

| Modo | Env | Docker |
|------|-----|--------|
| **stub** (default) | `LIVENESS_MODE=stub` | nada — UUID local |
| **http** | `LIVENESS_MODE=http` + `LIVENESS_MOCK_URL=http://localhost:8093` | WireMock |
| **aws** | futuro + IAM | AWS real (fora lab) |

```bash
cd Prisma/backend
docker compose -f docker-compose.yml -f docker-compose.liveness.yml up -d rekognition-mock
```

## APIs lab

```http
POST /api/v1/auth/biometric-consent
{"customer_id":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","term_version":"v1.0"}

POST /api/v1/auth/liveness/session
X-Idempotency-Key: <uuid>
{"customer_id":"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d","device_info":{"platform":"iOS","app_version":"2.14.0"},"audit_context":{"channel":"MOBILE_APP"}}
```

OIDC off: ownership opcional via `actor_customer_id`. OIDC on: `sub` JWT deve bater com `customer_id`.

## FE

Captura Amplify FaceLivenessDetector só com sessão AWS real (`aws`). Em `stub`/`http` o FE pode mockar UI com `session_id` retornado.
