from __future__ import annotations

import time
from typing import Any
from unittest.mock import MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from prisma_pj.domain.model.principal import Principal, extract_realm_roles, normalize_role
from prisma_pj.infrastructure.config import Settings, get_settings
from prisma_pj.infrastructure.security.jwt_validator import (
    JwtValidationError,
    validate_access_token,
)
from prisma_pj.presentation.security.deps import require_roles


def test_normalize_role_adds_prefix() -> None:
    assert normalize_role("ANALISTA_PJ") == "ROLE_ANALISTA_PJ"
    assert normalize_role("ROLE_PLATFORM") == "ROLE_PLATFORM"


def test_extract_realm_roles() -> None:
    claims: dict[str, object] = {
        "realm_access": {"roles": ["ANALISTA_PJ", "ROLE_PLATFORM"]},
    }
    roles = extract_realm_roles(claims)
    assert "ROLE_ANALISTA_PJ" in roles
    assert "ROLE_PLATFORM" in roles


def test_extract_empty_without_realm() -> None:
    assert extract_realm_roles({}) == frozenset()


def test_principal_lab_bypass() -> None:
    p = Principal(sub="x", lab_bypass=True)
    assert p.has_any_role("ANALISTA_PJ")


def test_principal_needs_role() -> None:
    p = Principal(sub="x", roles=frozenset({"ROLE_ANALISTA_PJ"}))
    assert p.has_any_role("ANALISTA_PJ", "PLATFORM")
    assert not p.has_any_role("AUDIT")


@pytest.fixture(scope="module")
def rsa_pair() -> tuple[Any, Any]:
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public = private.public_key()
    return private, public


def _sign(private: Any, claims: dict[str, Any]) -> str:
    return jwt.encode(claims, private, algorithm="RS256")


def test_validate_access_token_ok(rsa_pair: tuple[Any, Any]) -> None:
    private, public = rsa_pair
    issuer = "http://test/realms/prisma"
    now = int(time.time())
    token = _sign(
        private,
        {
            "sub": "user-1",
            "iss": issuer,
            "exp": now + 3600,
            "iat": now,
            "azp": "prisma-backend",
            "realm_access": {"roles": ["ANALISTA_PJ"]},
        },
    )
    settings = Settings(
        oidc_enabled=True,
        oidc_issuer_uri=issuer,
        oidc_jwk_set_uri="https://example.invalid/jwks",
        oidc_audience="",
    )
    signing = MagicMock()
    signing.key = public
    with patch(
        "prisma_pj.infrastructure.security.jwt_validator._jwk_client"
    ) as mock_client:
        mock_client.return_value.get_signing_key_from_jwt.return_value = signing
        principal = validate_access_token(token, settings)
    assert principal.sub == "user-1"
    assert principal.has_any_role("ANALISTA_PJ")
    assert principal.client_id == "prisma-backend"


def test_validate_access_token_expired(rsa_pair: tuple[Any, Any]) -> None:
    private, public = rsa_pair
    issuer = "http://test/realms/prisma"
    now = int(time.time())
    token = _sign(
        private,
        {
            "sub": "user-1",
            "iss": issuer,
            "exp": now - 10,
            "iat": now - 100,
            "realm_access": {"roles": ["ANALISTA_PJ"]},
        },
    )
    settings = Settings(
        oidc_enabled=True,
        oidc_issuer_uri=issuer,
        oidc_jwk_set_uri="https://example.invalid/jwks",
    )
    signing = MagicMock()
    signing.key = public
    with patch(
        "prisma_pj.infrastructure.security.jwt_validator._jwk_client"
    ) as mock_client:
        mock_client.return_value.get_signing_key_from_jwt.return_value = signing
        with pytest.raises(JwtValidationError):
            validate_access_token(token, settings)


def _app_with_roles(*roles: str) -> FastAPI:
    """Default-arg Depends evita 422 com nested + future annotations."""

    async def endpoint(p: Principal = Depends(require_roles(*roles))) -> dict[str, str]:  # noqa: B008
        return {"sub": p.sub, "bypass": str(p.lab_bypass)}

    app = FastAPI()
    app.get("/secure")(endpoint)
    return app


def test_http_oidc_off_allows() -> None:
    app = _app_with_roles("ANALISTA_PJ")
    app.dependency_overrides[get_settings] = lambda: Settings(oidc_enabled=False)
    r = TestClient(app).get("/secure")
    assert r.status_code == 200
    assert r.json()["bypass"] == "True"
    assert r.json()["sub"] == "lab-anonymous"


def test_http_oidc_on_401_without_token() -> None:
    app = _app_with_roles("ANALISTA_PJ", "PLATFORM")
    app.dependency_overrides[get_settings] = lambda: Settings(
        oidc_enabled=True,
        oidc_jwk_set_uri="https://example.invalid/jwks",
        oidc_issuer_uri="http://test/realms/prisma",
    )
    r = TestClient(app).get("/secure")
    assert r.status_code == 401


def test_http_oidc_on_403_wrong_role(rsa_pair: tuple[Any, Any]) -> None:
    private, public = rsa_pair
    issuer = "http://test/realms/prisma"
    now = int(time.time())
    token = _sign(
        private,
        {
            "sub": "user-ml",
            "iss": issuer,
            "exp": now + 3600,
            "iat": now,
            "realm_access": {"roles": ["ML"]},
        },
    )
    app = _app_with_roles("ANALISTA_PJ", "PLATFORM")
    app.dependency_overrides[get_settings] = lambda: Settings(
        oidc_enabled=True,
        oidc_issuer_uri=issuer,
        oidc_jwk_set_uri="https://example.invalid/jwks",
        oidc_audience="",
    )
    signing = MagicMock()
    signing.key = public
    with patch(
        "prisma_pj.infrastructure.security.jwt_validator._jwk_client"
    ) as mock_client:
        mock_client.return_value.get_signing_key_from_jwt.return_value = signing
        r = TestClient(app).get("/secure", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_http_oidc_on_200_analista(rsa_pair: tuple[Any, Any]) -> None:
    private, public = rsa_pair
    issuer = "http://test/realms/prisma"
    now = int(time.time())
    token = _sign(
        private,
        {
            "sub": "analista-1",
            "iss": issuer,
            "exp": now + 3600,
            "iat": now,
            "realm_access": {"roles": ["ANALISTA_PJ"]},
        },
    )
    app = _app_with_roles("ANALISTA_PJ", "PLATFORM")
    app.dependency_overrides[get_settings] = lambda: Settings(
        oidc_enabled=True,
        oidc_issuer_uri=issuer,
        oidc_jwk_set_uri="https://example.invalid/jwks",
        oidc_audience="",
    )
    signing = MagicMock()
    signing.key = public
    with patch(
        "prisma_pj.infrastructure.security.jwt_validator._jwk_client"
    ) as mock_client:
        mock_client.return_value.get_signing_key_from_jwt.return_value = signing
        r = TestClient(app).get("/secure", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["sub"] == "analista-1"
