# DEV RECORD — EP-05 F01 Liveness (Noah)

| Campo | Valor |
|-------|-------|
| **US** | `EP05-F01-US-BE-01` |
| **Data** | 2026-07-28 |
| **Status** | Lab 🟡 |

## Entregue

- Flyway V51 — consent, session, attempt, lockout, spoofing audit
- BC `liveness` — create session + register consent
- REST `/api/v1/auth/liveness/session` + `/biometric-consent`
- Adapters: `stub` (default) · `http` (WireMock :8093)
- RN006 consent · RN002 lockout · RN007 idempotency · RN003 expires +3m
- Unit tests CA-01/02/03/04/07

## Rekognition Docker

Face Liveness **não** no LocalStack → mock WireMock (`docker-compose.liveness.yml`).

## DoD US (OBS-10)

- [x] Paths consent + session
- [x] Unit CA consent/lockout/idempotency
- [x] Port stub|http (WireMock) — ADR: Face Liveness ≠ LocalStack
- [ ] AWS Rekognition real (`LIVENESS_MODE=aws`)
- [x] DEV_RECORD + MockMvc contrato

## Fora deste slice

- GetFaceLivenessSessionResults / scoring (US-BE-02)
- JWT IAL3 (US-BE-03)
- Adapter AWS SDK real (`LIVENESS_MODE=aws`)
- Rate limit 5/min interceptor
