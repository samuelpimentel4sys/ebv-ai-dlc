# DEV_RECORD — JWT / OIDC (Emilly · EP-03)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **Agente** | Emilly (`dev-python-esp`) |
| **Escopo** | Auth JWT alinhado ao Keycloak do Noah |

## O que entrou

- Settings: `OIDC_ENABLED`, `OIDC_ISSUER_URI`, `OIDC_JWK_SET_URI`, `OIDC_AUDIENCE`, `OIDC_CLIENT_ID`
- `Principal` + extract `realm_access.roles` (prefixo `ROLE_` igual `KeycloakRealmRoleConverter`)
- Validador RS256 via JWKS (`PyJWKClient`)
- Deps FastAPI: `require_roles` / `RequireAnalistaPj`
- Rotas protegidas (`ANALISTA_PJ` \| `PLATFORM`):
  - `/api/v1/pj/rag/**`, `/library/**`
  - `/ratios/**`, `/opinions/**`, `/guardrails/**`
  - `POST /api/v1/pj/smoke/llm`
- Abertas: `/health`, `/ready`
- Lab: `OIDC_ENABLED=false` → bypass (espelho Java)

## Como ligar

```env
OIDC_ENABLED=true
OIDC_ISSUER_URI=http://192.168.31.47:8180/realms/prisma
OIDC_JWK_SET_URI=http://192.168.31.47:8180/realms/prisma/protocol/openid-connect/certs
```

Token (client_credentials ou password grant) → `Authorization: Bearer …`

Role mínima GenAI: `ANALISTA_PJ` (ou `PLATFORM`).

## Testes

`tests/unit/test_jwt_auth.py` — normalize roles, 401 sem token, 403 role errada, 200 com ANALISTA_PJ, lab bypass.

## Fora deste slice

- ACL de carteira por CNPJ (claim custom)
- Roles aprovador (F04 = Noah)
- Smoke Keycloak real (quando OIDC on no lab)
