from __future__ import annotations

from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

from prisma_pj.domain.model.principal import Principal, extract_realm_roles
from prisma_pj.infrastructure.config import Settings


class JwtValidationError(Exception):
    """Token inválido / expirado / issuer errado."""


@lru_cache(maxsize=4)
def _jwk_client(jwk_set_uri: str) -> PyJWKClient:
    return PyJWKClient(jwk_set_uri, cache_keys=True, lifespan=300)


def validate_access_token(token: str, settings: Settings) -> Principal:
    """Valida JWT RS256 via JWKS Keycloak (mesmo issuer do Java)."""
    if not settings.oidc_jwk_set_uri:
        raise JwtValidationError("OIDC_JWK_SET_URI não configurado")

    try:
        signing_key = _jwk_client(settings.oidc_jwk_set_uri).get_signing_key_from_jwt(token)
        options: dict[str, Any] = {
            "require": ["exp", "sub"],
            "verify_aud": bool(settings.oidc_audience),
        }
        decode_kwargs: dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": options,
        }
        if settings.oidc_issuer_uri:
            decode_kwargs["issuer"] = settings.oidc_issuer_uri
        else:
            options["verify_iss"] = False
        if settings.oidc_audience:
            decode_kwargs["audience"] = settings.oidc_audience
        claims = jwt.decode(token, signing_key.key, **decode_kwargs)
    except jwt.PyJWTError as exc:
        raise JwtValidationError(str(exc)) from exc

    if not isinstance(claims, dict):
        raise JwtValidationError("claims inválidos")

    sub = str(claims.get("sub") or "")
    if not sub:
        raise JwtValidationError("claim sub ausente")

    azp = claims.get("azp") or claims.get("client_id")
    return Principal(
        sub=sub,
        roles=extract_realm_roles(claims),
        client_id=str(azp) if azp else None,
        lab_bypass=False,
    )


def clear_jwk_cache() -> None:
    _jwk_client.cache_clear()
