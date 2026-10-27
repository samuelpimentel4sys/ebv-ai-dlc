# Integração / acesso QA — Prisma lab

Prisma lab **não** usa OTP FourMakers. Auth produto = OIDC (fail-closed fora de `local`).

| Modo | Como |
|------|------|
| **mock FE** | `VITE_DATA_MODE=mock` (default Vitest/Vite test). E2E UI sem Java. |
| **live** | Java `:8080` UP + `VITE_DATA_MODE=live`. Proxy Vite `/api` → BFF. |
| **OIDC** | Lab: `OIDC_ENABLED=false` só em `.env` local + profile `local`. Fora disso, APIs 401. |

Self-service identify (live): body com `birthDate` + `lastDigits` (4 dígitos). `GET /records` usa `X-Session-Token`.

Credenciais locais: copie `docs/qa/setup/credenciais.example.json` → `credenciais.json` (gitignored).
